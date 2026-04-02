import Phaser from 'phaser';
import {
  SCENE_KEYS, COLORS, UI_FONT, readableFontSize,
} from '../constants';
import { GameState, CompanyId } from '../types';
import type { ActiveMission, RunBoosts } from '../types';
import { SALVAGE_RESPAWN_DELAY, PLAYER_RADIUS, PLAYER_SHIELD_BREAK_INVULN_MS, NPC_BUMP_RADIUS, NPC_BONUS_POINTS } from '../data/tuning';
import { MissionSystem, loadOrGenerateMissions } from '../systems/MissionSystem';
import { InputSystem } from '../systems/InputSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { SalvageSystem } from '../systems/SalvageSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { ExtractionSystem } from '../systems/ExtractionSystem';
import { BankingSystem } from '../systems/BankingSystem';
import { DifficultySystem } from '../systems/DifficultySystem';
import { SaveSystem } from '../systems/SaveSystem';
import { Player } from '../entities/Player';
import { SalvageDebris } from '../entities/SalvageDebris';
import { DrifterHazard } from '../entities/DrifterHazard';
import { ShieldPickup } from '../entities/ShieldPickup';
import { BonusPickup } from '../entities/BonusPickup';
import { BombPickup } from '../entities/BombPickup';
import { ShipDebris } from '../entities/ShipDebris';
import { ExitGate } from '../entities/ExitGate';
import { NPCShip } from '../entities/NPCShip';
import { Hud } from '../ui/Hud';
import { Overlays } from '../ui/Overlays';
import { GeoSphere } from '../entities/GeoSphere';
import { HologramOverlay } from '../ui/HologramOverlay';
import { SlickComm } from '../ui/SlickComm';
import { LiaisonComm } from '../ui/LiaisonComm';
import { COMPANIES, loadCompanyRep, getRepLevel, getSlickCutPercent, getWalletSharePercent } from '../data/companyData';
import { getLiaisonLine } from '../data/liaisonLines';
import { RegentComm } from '../ui/RegentComm';
import { getSlickLine } from '../data/slickLines';
import { getRegentLine } from '../data/regentLines';
import { getLayout, setLayoutSize } from '../layout';
import { getSettings, updateSettings } from '../systems/SettingsSystem';
import { refreshMusicForSettings, setGameplayMusicForPhase } from '../systems/MusicSystem';
import { CustomCursor } from '../ui/CustomCursor';
import { SettingsSlider } from '../ui/SettingsSlider';

interface MenuHandoff {
  drifterState?: { x: number; y: number; vx: number; vy: number; radiusScale: number }[];
  debrisState?: { x: number; y: number; vx: number; vy: number }[];
  npcState?: { x: number; y: number; vx: number; vy: number }[];
  retryFromDeath?: boolean;
  selectedMissions?: ActiveMission[];
  runBoosts?: RunBoosts;
}

interface StarfieldStar {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
  color: number;
}

interface ResultData {
  score: number;
  cause: 'death' | 'extract';
  missionBonus?: number;
  walletPayout?: number;
  slickCut?: number;
  walletBalance?: number;
  missionProgress?: { label: string; progress: number; target: number; completed: boolean; reward: number }[];
}

type DeathCause = 'asteroid' | 'enemy' | 'laser';
type CommSpeaker = 'slick' | 'regent' | 'liaison';

interface GameplayCommOptions {
  allowInterrupt?: boolean;
  ignoreCooldown?: boolean;
}

export class GameScene extends Phaser.Scene {
  private static readonly COUNTDOWN_PHRASES = ['STAY ALIVE', 'GET PAID', 'GET OUT', 'GO'];
  private static readonly START_COUNTDOWN_MS = GameScene.COUNTDOWN_PHRASES.length * 1000;
  private static readonly PAUSE_SLOW_SCALE = 0.025;
  private static readonly STARFIELD_OVERSCAN = 96;
  private static readonly STARFIELD_COUNT = 170;
  private static readonly GAMEPLAY_COMM_GAP_MS = 2200;
  private static readonly DEFAULT_COMM_HIDE_MS = {
    slick: 5200,
    regent: 5600,
    liaison: 5400,
  } as const;

  private inputSystem!: InputSystem;
  private scoreSystem!: ScoreSystem;
  private salvageSystem!: SalvageSystem;
  private collisionSystem!: CollisionSystem;
  private extractionSystem!: ExtractionSystem;
  private bankingSystem!: BankingSystem;
  private difficultySystem!: DifficultySystem;
  private saveSystem!: SaveSystem;
  private missionSystem!: MissionSystem;
  private player!: Player;
  private debrisList: SalvageDebris[] = [];
  private shields: ShieldPickup[] = [];
  private bonusPickups: BonusPickup[] = [];
  private bombPickups: BombPickup[] = [];
  private hud!: Hud;
  private state: GameState = GameState.PLAYING;
  private debrisRespawnTimer: Phaser.Time.TimerEvent | null = null;
  private rareSalvageTimer = 0;
  private countdownTimer = 0;
  private starfield!: Phaser.GameObjects.Graphics;
  private starfieldStars: StarfieldStar[] = [];
  private geoSphere!: GeoSphere;
  private arenaBorder!: Phaser.GameObjects.Graphics;
  private hologramOverlay!: HologramOverlay;
  private entryGate: ExitGate | null = null;
  private slickComm!: SlickComm;
  private regentComm!: RegentComm;
  private regentIntroduced = false;
  private regentEnemyAnnounced = false;
  private regentBeamAnnounced = false;
  private regentLastPhase = 0;
  private liaisonComm: LiaisonComm | null = null;
  private liaisonCompanyId: CompanyId | null = null;
  private liaisonRepLevel = 0;
  private playerDebris: ShipDebris[] = [];
  private invulnerableTimer = 0;
  private countdownText: Phaser.GameObjects.Text | null = null;
  private resultData: ResultData | null = null;
  private resultUi: Phaser.GameObjects.GameObject[] = [];
  private resultInputLocked = false;
  private lastGateActive = false;
  private activeRunBoosts: RunBoosts | null = null;
  private activeCommSpeaker: CommSpeaker | null = null;
  private activeCommPriority = 0;
  private activeCommVisibleUntil = 0;
  private nextGameplayCommAt = 0;
  private pauseButtonBg!: Phaser.GameObjects.Graphics;
  private pauseButtonText!: Phaser.GameObjects.Text;
  private pauseButtonHit!: Phaser.GameObjects.Zone;
  private pauseUi: Phaser.GameObjects.GameObject[] = [];
  private pausedFromState: GameState = GameState.PLAYING;
  private cursor!: CustomCursor;

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  create(data?: MenuHandoff): void {
    this.events.once('shutdown', this.cleanup, this);
    setLayoutSize(this.scale.width, this.scale.height);
    const handoff = data ?? {};
    const layout = getLayout();
    this.state = GameState.COUNTDOWN;
    this.rareSalvageTimer = 0;
    this.countdownTimer = GameScene.START_COUNTDOWN_MS;
    this.resultData = null;
    this.resultUi = [];
    this.resultInputLocked = false;
    this.lastGateActive = false;
    this.activeRunBoosts = handoff.runBoosts ?? null;
    this.activeCommSpeaker = null;
    this.activeCommPriority = 0;
    this.activeCommVisibleUntil = 0;
    this.nextGameplayCommAt = 0;
    this.pauseUi = [];
    this.pausedFromState = GameState.COUNTDOWN;
    this.regentIntroduced = false;
    this.regentEnemyAnnounced = false;
    this.regentBeamAnnounced = false;
    this.regentLastPhase = 0;
    this.invulnerableTimer = 2000;
    this.bombPickups = [];

    this.saveSystem = new SaveSystem();
    this.inputSystem = new InputSystem(this);
    this.scoreSystem = new ScoreSystem();
    this.scoreSystem.setBest(this.saveSystem.getBestScore());

    // Starfield background (hologram-tinted)
    this.starfield = this.add.graphics().setDepth(-1);
    this.starfieldStars = [];
    for (let i = 0; i < GameScene.STARFIELD_COUNT; i++) {
      this.starfieldStars.push({
        x: Phaser.Math.Between(-GameScene.STARFIELD_OVERSCAN, layout.gameWidth + GameScene.STARFIELD_OVERSCAN),
        y: Phaser.Math.Between(-GameScene.STARFIELD_OVERSCAN, layout.gameHeight + GameScene.STARFIELD_OVERSCAN),
        speed: Phaser.Math.FloatBetween(3, 12),
        alpha: Phaser.Math.FloatBetween(0.1, 0.4),
        size: Phaser.Math.FloatBetween(0.5, 1.2),
        color: Math.random() < 0.6 ? COLORS.PLAYER : 0xffffff,
      });
    }
    this.drawStarfield();

    // Rotating geometric sphere behind the arena
    this.geoSphere = new GeoSphere(this);

    // Draw arena boundary (hologram style)
    this.arenaBorder = this.add.graphics().setDepth(0);

    // Subtle grid inside arena
    this.arenaBorder.lineStyle(1, COLORS.GRID, 0.04);
    for (let x = layout.arenaLeft + 40; x < layout.arenaRight; x += 40) {
      this.arenaBorder.lineBetween(x, layout.arenaTop, x, layout.arenaBottom);
    }
    for (let y = layout.arenaTop + 40; y < layout.arenaBottom; y += 40) {
      this.arenaBorder.lineBetween(layout.arenaLeft, y, layout.arenaRight, y);
    }

    // Arena border
    this.arenaBorder.lineStyle(1, COLORS.HUD, 0.12);
    this.arenaBorder.strokeRect(layout.arenaLeft, layout.arenaTop, layout.arenaWidth, layout.arenaHeight);
    const cm = 12;
    this.arenaBorder.lineStyle(1.5, COLORS.HUD, 0.3);
    for (const [cx, cy] of [[layout.arenaLeft, layout.arenaTop], [layout.arenaRight, layout.arenaTop], [layout.arenaLeft, layout.arenaBottom], [layout.arenaRight, layout.arenaBottom]]) {
      const sx = cx === layout.arenaLeft ? 1 : -1;
      const sy = cy === layout.arenaTop ? 1 : -1;
      this.arenaBorder.lineBetween(cx, cy, cx + cm * sx, cy);
      this.arenaBorder.lineBetween(cx, cy, cx, cy + cm * sy);
    }

    // Hologram scanline overlay
    this.hologramOverlay = new HologramOverlay(this);
    this.cursor = new CustomCursor(this);
    this.slickComm = new SlickComm(this, { width: layout.gameWidth });
    this.regentComm = new RegentComm(this, { width: layout.gameWidth });

    const spawnX = layout.arenaLeft + layout.arenaWidth / 2;
    const spawnY = layout.arenaTop + layout.arenaHeight * 0.75;
    this.player = new Player(this, spawnX, spawnY);

    // Entry gate — player appears inside a closing gate
    this.entryGate = new ExitGate(this, { x: spawnX, y: spawnY }, GameScene.START_COUNTDOWN_MS);

    this.salvageSystem = new SalvageSystem(this, this.player, this.scoreSystem);
    this.collisionSystem = new CollisionSystem(this.player);
    this.extractionSystem = new ExtractionSystem(this);
    this.bankingSystem = new BankingSystem(this.player, this.scoreSystem, this.saveSystem);
    this.difficultySystem = new DifficultySystem(this, 1);

    // Carry over background entities from menu for seamless transition
    if (handoff.drifterState?.length) {
      for (const d of handoff.drifterState) {
        const drifter = DrifterHazard.createFragment(this, d.x, d.y, d.vx, d.vy, d.radiusScale);
        this.difficultySystem.getDrifters().push(drifter);
      }
    }
    if (handoff.debrisState?.length) {
      for (const d of handoff.debrisState) {
        const debris = SalvageDebris.createAt(this, d.x, d.y, d.vx, d.vy);
        this.debrisList.push(debris);
        this.salvageSystem.addDebris(debris);
      }
    }
    if (handoff.npcState?.length) {
      for (const npc of handoff.npcState) {
        this.difficultySystem.getNPCs().push(NPCShip.createAt(this, npc.x, npc.y, npc.vx, npc.vy));
      }
    }

    // Mission system — use selected missions from briefing, or reload from persistence on retry
    const missionList = handoff.selectedMissions ?? loadOrGenerateMissions().filter((m) => m.accepted);
    this.missionSystem = new MissionSystem(missionList);

    // Apply per-run boosts from purchased favors
    if (handoff.runBoosts) {
      this.salvageSystem.setBoosts(handoff.runBoosts.salvageYieldMult, handoff.runBoosts.miningYieldMult);
      this.difficultySystem.setBoosts(handoff.runBoosts.npcBonusMult, handoff.runBoosts.bonusDropChanceAdd);
    }

    // Opening comm comes from an active contract liaison when available; otherwise Slick handles run start.
    this.liaisonComm = null;
    this.liaisonCompanyId = null;
    this.liaisonRepLevel = 0;
    const repSave = loadCompanyRep();
    const activeContractCompanies = Array.from(new Set(missionList.map((m) => m.def.company)));
    if (activeContractCompanies.length > 0) {
      const openingCompany = Phaser.Utils.Array.GetRandom(activeContractCompanies);
      this.liaisonCompanyId = openingCompany;
      this.liaisonRepLevel = Math.max(1, getRepLevel(repSave.rep[openingCompany] ?? 0));
      this.liaisonComm = new LiaisonComm(this, COMPANIES[openingCompany], { width: layout.gameWidth });
    }
    this.applyGameplayCommLayout();

    // Only spawn fresh debris if none carried over
    if (this.debrisList.length === 0) {
      this.spawnDebris();
    }

    setGameplayMusicForPhase(this, 1);

    this.hud = new Hud(this);
    this.createPauseButton();
    this.countdownText = this.add.text(
      layout.centerX,
      layout.centerY,
      GameScene.COUNTDOWN_PHRASES[0],
      {
        fontFamily: UI_FONT,
        fontSize: readableFontSize(44),
        fontStyle: 'bold',
        color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
        stroke: `#${COLORS.GRID.toString(16).padStart(6, '0')}`,
        strokeThickness: 4,
        align: 'center',
        wordWrap: { width: 320 },
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
          blur: 14,
          fill: true,
        },
      },
    ).setOrigin(0.5).setDepth(120).setAlpha(0.9);
    if (!this.liaisonComm || !this.liaisonCompanyId) {
      const openingLineKey = handoff.retryFromDeath && Math.random() < 0.45 ? 'gameOverRetry' : 'runStart';
      this.showSlickExclusive(getSlickLine(openingLineKey));
    }

    // Liaison intro — show after Slick's opener fades
    if (this.liaisonComm && this.liaisonCompanyId) {
      const openingLiaisonKey = handoff.retryFromDeath ? 'runStart' : 'intro';
      this.showLiaisonExclusive(getLiaisonLine(this.liaisonCompanyId, this.liaisonRepLevel, openingLiaisonKey), 4200);
    }

    this.refreshPauseUi();

    this.input.on('pointerdown', this.handlePointerDown, this);
  }

  update(_time: number, delta: number): void {
    if (
      this.state !== GameState.COUNTDOWN &&
      this.state !== GameState.PAUSED &&
      this.state !== GameState.PLAYING &&
      this.state !== GameState.RESULTS &&
      this.state !== GameState.DEAD &&
      this.state !== GameState.EXTRACTING
    ) return;

    const paused = this.state === GameState.PAUSED;
    const runFrozen = (
      this.state === GameState.DEAD ||
      this.state === GameState.EXTRACTING ||
      this.state === GameState.RESULTS
    );
    const effectiveDelta = paused ? delta * GameScene.PAUSE_SLOW_SCALE : delta;
    const activeState = paused ? this.pausedFromState : this.state;
    const gameplayActive = activeState === GameState.PLAYING;
    const countdownActive = activeState === GameState.COUNTDOWN;

    if (!runFrozen) {
      this.updateEntryGate(effectiveDelta);
    }

    if (gameplayActive) {
      const target = paused ? null : (this.inputSystem.update(), this.inputSystem.getTarget());
      const swipe = paused ? null : this.inputSystem.getSwipe();
      this.player.update(effectiveDelta, target, swipe);
      if (this.invulnerableTimer > 0) {
        this.invulnerableTimer -= effectiveDelta;
        // Flicker player to indicate invulnerability
        const blink = Math.sin(this.invulnerableTimer * 0.012) > 0;
        this.player.graphic.setAlpha(blink ? 1 : 0.3);
      } else {
        this.player.graphic.setAlpha(1);
      }
    }

    // Update all debris
    for (let i = this.debrisList.length - 1; i >= 0; i--) {
      const d = this.debrisList[i];
      d.update(effectiveDelta);
      if (!d.active) {
        // Shatter effect if depleted/expired (not just drifting offscreen)
        const layout = getLayout();
        const onScreen = d.x > -40 && d.x < layout.gameWidth + 40 && d.y > -40 && d.y < layout.gameHeight + 40;
        if (onScreen) {
          const color = d.isRare ? 0xff44ff : COLORS.SALVAGE;
          this.playerDebris.push(new ShipDebris(this, d.x, d.y, d.driftVx, d.driftVy, color, 20));
        }
        this.salvageSystem.removeDebris(d);
        d.destroy();
        this.debrisList.splice(i, 1);
        if (!runFrozen && !d.isRare) {
          this.scheduleDebrisRespawn();
        }
      }
    }

    // Beams destroy salvage
    if (!runFrozen) {
      for (const beam of this.difficultySystem.getBeams()) {
        if (!beam.active || !beam.isLethal()) continue;
        const halfBeam = beam.width / 2;
        for (const debris of this.debrisList) {
          if (!debris.active) continue;
          const dist = beam.isHorizontal
            ? Math.abs(debris.y - beam.y1)
            : Math.abs(debris.x - beam.x1);
          if (dist < halfBeam + 30) {
            debris.active = false;
          }
        }
      }
    }

    // Ensure at least one normal debris exists or is scheduled
    const hasNormal = this.debrisList.some(d => !d.isRare);
    if (!runFrozen && !hasNormal && !this.debrisRespawnTimer) {
      this.scheduleDebrisRespawn();
    }

    // Update shield pickups
    for (let i = this.shields.length - 1; i >= 0; i--) {
      const s = this.shields[i];
      s.update(effectiveDelta);
      if (!s.active) {
        s.destroy();
        this.shields.splice(i, 1);
        continue;
      }
      // Check pickup collision
      if (gameplayActive && !this.player.hasShield) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, s.x, s.y);
        if (dist < PLAYER_RADIUS + s.radius) {
          this.player.hasShield = true;
          this.missionSystem.trackShieldCollected();
          this.tryShowSlick('shieldPickup', 0.22);
          s.active = false;
          s.destroy();
          this.shields.splice(i, 1);
          continue;
        }
      }

      if (gameplayActive) {
        for (const npc of this.difficultySystem.getNPCs()) {
          if (!npc.active || npc.hasShield) continue;
          const dist = Phaser.Math.Distance.Between(npc.x, npc.y, s.x, s.y);
          if (dist < npc.radius + s.radius) {
            npc.hasShield = true;
            s.active = false;
            s.destroy();
            this.shields.splice(i, 1);
            break;
          }
        }
      }
    }

    for (let i = this.bonusPickups.length - 1; i >= 0; i--) {
      const pickup = this.bonusPickups[i];
      pickup.update(effectiveDelta);
      if (!pickup.active) {
        pickup.destroy();
        this.bonusPickups.splice(i, 1);
        continue;
      }

      if (gameplayActive) {
        const playerDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, pickup.x, pickup.y);
        if (pickup.isCollectable() && playerDist < PLAYER_RADIUS + pickup.radius) {
          this.scoreSystem.addUnbanked(pickup.points);
          this.salvageSystem.spawnRewardText(`+${pickup.points}`, pickup.x, pickup.y - 8);
          pickup.active = false;
          pickup.destroy();
          this.bonusPickups.splice(i, 1);
          continue;
        }

        let claimedByNpc = false;
        for (const npc of this.difficultySystem.getNPCs()) {
          if (!npc.active) continue;
          const npcDist = Phaser.Math.Distance.Between(npc.x, npc.y, pickup.x, pickup.y);
          if (npcDist < npc.radius + pickup.radius) {
            pickup.active = false;
            pickup.destroy();
            this.bonusPickups.splice(i, 1);
            claimedByNpc = true;
            break;
          }
        }
        if (claimedByNpc) continue;
      }
    }

    // Update bomb pickups
    for (let i = this.bombPickups.length - 1; i >= 0; i--) {
      const bomb = this.bombPickups[i];
      bomb.update(effectiveDelta);
      if (!bomb.active) {
        bomb.destroy();
        this.bombPickups.splice(i, 1);
        continue;
      }

      if (gameplayActive && bomb.isCollectable()) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, bomb.x, bomb.y);
        if (dist < PLAYER_RADIUS + bomb.radius) {
          bomb.active = false;
          bomb.destroy();
          this.bombPickups.splice(i, 1);
          this.boardWipe();
          continue;
        }

        // NPCs can trigger bombs — wipes field and kills the player
        let claimedByNpc = false;
        for (const npc of this.difficultySystem.getNPCs()) {
          if (!npc.active) continue;
          const npcDist = Phaser.Math.Distance.Between(npc.x, npc.y, bomb.x, bomb.y);
          if (npcDist < npc.radius + bomb.radius) {
            bomb.active = false;
            bomb.destroy();
            this.bombPickups.splice(i, 1);
            this.boardWipe();
            this.handleDeath('asteroid');
            claimedByNpc = true;
            break;
          }
        }
        if (claimedByNpc) return;
      }
    }

    // Track phase before extraction update
    const prevPhase = this.extractionSystem.getPhaseCount();

    // Extraction
    if (runFrozen) {
      this.extractionSystem.updateVisual(effectiveDelta);
    } else {
      this.extractionSystem.update(effectiveDelta);
    }

    // Phase advanced — update difficulty
    const currentPhase = this.extractionSystem.getPhaseCount();
    if (!runFrozen && !paused && gameplayActive && currentPhase !== prevPhase) {
      this.missionSystem.trackPhaseReached(currentPhase);
      this.difficultySystem.setPhase(currentPhase);
      setGameplayMusicForPhase(this, currentPhase);
      const slickPhaseLine = Math.random() < 0.16 ? getSlickLine('phaseAdvance') : null;
      let regentPhaseLine: string | null = null;

      if (currentPhase === 2 && !this.regentIntroduced && Math.random() < 0.35) {
        regentPhaseLine = getRegentLine('threatDetected');
      } else if (currentPhase >= 3 && !this.regentIntroduced) {
        this.regentIntroduced = true;
        regentPhaseLine = getRegentLine('gateClose');
      } else if (this.regentIntroduced) {
        if (currentPhase > 7 && currentPhase > this.regentLastPhase) {
          regentPhaseLine = Math.random() < 0.25 ? getRegentLine('whyWontYouDie') : null;
        } else if (currentPhase >= 3) {
          regentPhaseLine = Math.random() < 0.18 ? getRegentLine('gateClose') : null;
        }
      }

      if (regentPhaseLine) {
        this.tryShowGameplayRegent(regentPhaseLine, 2600);
      } else if (slickPhaseLine) {
        this.tryShowGameplaySlick(slickPhaseLine);
      }

      this.regentLastPhase = currentPhase;
    }

    // Rare salvage spawning (phase 2+)
    if (!runFrozen && currentPhase >= 2) {
      this.rareSalvageTimer += effectiveDelta;
      const rareInterval = Math.max(8000, 18000 - currentPhase * 2000);
      if (this.rareSalvageTimer >= rareInterval) {
        this.spawnRareDebris(currentPhase);
        this.rareSalvageTimer = 0;
      }
    }

    // Assign salvage targets to NPCs
    const npcs = this.difficultySystem.getNPCs();
    for (const npc of npcs) {
      if (!npc.active) continue;

      let bestTargetX: number | null = null;
      let bestTargetY: number | null = null;
      let bestDist = Infinity;

      for (const d of this.debrisList) {
        if (!d.active || d.depleted) continue;
        const dist = Phaser.Math.Distance.Between(npc.x, npc.y, d.x, d.y);
        if (dist < bestDist) {
          bestDist = dist;
          bestTargetX = d.x;
          bestTargetY = d.y;
        }
      }

      if (!npc.hasShield) {
        for (const shield of this.shields) {
          if (!shield.active) continue;
          const dist = Phaser.Math.Distance.Between(npc.x, npc.y, shield.x, shield.y);
          if (dist < bestDist) {
            bestDist = dist;
            bestTargetX = shield.x;
            bestTargetY = shield.y;
          }
        }
      }

      for (const pickup of this.bonusPickups) {
        if (!pickup.active) continue;
        const dist = Phaser.Math.Distance.Between(npc.x, npc.y, pickup.x, pickup.y);
        if (dist < bestDist) {
          bestDist = dist;
          bestTargetX = pickup.x;
          bestTargetY = pickup.y;
        }
      }

      if (bestTargetX !== null && bestTargetY !== null) {
        npc.setTarget(bestTargetX, bestTargetY);
      } else {
        npc.clearTarget();
      }
    }

    // Difficulty system manages hazard spawning + updating
    const enemiesBefore = this.difficultySystem.getEnemies().length;
    const beamsBefore = this.difficultySystem.getBeams().length;
    if (runFrozen) {
      this.difficultySystem.updateVisualOnly(effectiveDelta, this.player.x, this.player.y);
    } else {
      this.difficultySystem.update(effectiveDelta, this.player.x, this.player.y);
    }

    // Regent: announce first enemy arrival
    if (!runFrozen && this.regentIntroduced && !this.regentEnemyAnnounced && enemiesBefore === 0 && this.difficultySystem.getEnemies().length > 0) {
      this.regentEnemyAnnounced = true;
      this.tryShowGameplayRegent(getRegentLine('enemyEnter'));
    }
    // Regent: announce first beam activation (phase 7)
    if (!runFrozen && this.regentIntroduced && !this.regentBeamAnnounced && beamsBefore === 0 && this.difficultySystem.getBeams().length > 0) {
      this.regentBeamAnnounced = true;
      this.tryShowGameplayRegent(getRegentLine('beamUnlock'));
    }

    // NPC salvage depletion — NPCs drain salvage HP when close
    if (!runFrozen) {
      for (const npc of npcs) {
        if (!npc.active || !npc.isSalvaging()) continue;
        for (const d of this.debrisList) {
          if (!d.active || d.depleted) continue;
          const dist = Phaser.Math.Distance.Between(npc.x, npc.y, d.x, d.y);
          if (dist < d.salvageRadius) {
            d.hp -= effectiveDelta / 1000;
            if (d.hp <= 0) {
              d.hp = 0;
              d.depleted = true;
            }
          }
        }
      }
    }

    // Player-NPC collisions — collision = destruction
    const invulnerable = this.invulnerableTimer > 0;

    for (const npc of npcs) {
      if (!npc.active) continue;
      const dx = npc.x - this.player.x;
      const dy = npc.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < NPC_BUMP_RADIUS && dist > 0.1) {
        if (!gameplayActive || invulnerable) continue;

        if (this.player.hasShield) {
          // Player shield absorbs hit — NPC destroyed
          this.player.hasShield = false;
          this.invulnerableTimer = Math.max(this.invulnerableTimer, PLAYER_SHIELD_BREAK_INVULN_MS);
          npc.active = false;
          npc.killedByHazard = false;
          this.missionSystem.trackNpcKill();
          this.playerDebris.push(new ShipDebris(this, npc.x, npc.y, npc.vx, npc.vy, 0xffcc44, npc.radius));
          this.bonusPickups.push(new BonusPickup(this, npc.x, npc.y, NPC_BONUS_POINTS, npc.vx * 0.5, npc.vy * 0.5));
          Overlays.shieldBreakFlash(this);
          continue;
        } else {
          // No shield — collision is lethal
          this.handleDeath('asteroid');
          return;
        }
      }
    }

    // Spawn shields from dead NPCs — inherit NPC velocity so they drift
    if (!runFrozen) {
      const deadNPCs = this.difficultySystem.consumeDeadNPCs();
      for (const pos of deadNPCs) {
        if (this.shields.length < 3) {
          const shield = new ShieldPickup(this, pos.x, pos.y, pos.vx * 0.5, pos.vy * 0.5);
          this.shields.push(shield);
        }
      }

      const bonusDrops = this.difficultySystem.consumeBonusDrops();
      for (const drop of bonusDrops) {
        this.bonusPickups.push(new BonusPickup(this, drop.x, drop.y, drop.points, drop.vx, drop.vy, undefined, drop.miningBonus));
      }

      const bombDrops = this.difficultySystem.consumeBombDrops();
      for (const drop of bombDrops) {
        this.bombPickups.push(new BombPickup(this, drop.x, drop.y, drop.vx, drop.vy));
      }
    }

    // Check extraction — player can extract any time they enter the active gate
    const activeGate = this.extractionSystem.getGate();
    if (gameplayActive && activeGate && this.bankingSystem.checkExtraction(activeGate)) {
      this.handleExtraction();
      return;
    }

    // Check collisions — shield absorbs one hit and destroys/splits the asteroid
    const hitDrifter = this.collisionSystem.checkDrifters(this.difficultySystem.getDrifters());
    const hitBeam = this.collisionSystem.checkBeams(this.difficultySystem.getBeams());
    const hitEnemy = this.collisionSystem.checkEnemies(this.difficultySystem.getEnemies());
    if (gameplayActive && !invulnerable && (hitDrifter || hitBeam || hitEnemy)) {
      this.missionSystem.trackDamageTaken();
      if (this.player.hasShield) {
        this.player.hasShield = false;
        this.invulnerableTimer = Math.max(this.invulnerableTimer, PLAYER_SHIELD_BREAK_INVULN_MS);
        // Shield destroys or splits the asteroid it hit
        if (hitDrifter) {
          this.difficultySystem.shieldDestroyDrifter(hitDrifter);
        }
        // Shield destroys enemy on contact
        if (hitEnemy) {
          hitEnemy.active = false;
          this.missionSystem.trackEnemyKill();
        }
        Overlays.shieldBreakFlash(this);
      } else {
        let deathCause: DeathCause;
        if (hitBeam) {
          deathCause = 'laser';
        } else if (hitEnemy) {
          deathCause = 'enemy';
        } else if (hitDrifter) {
          deathCause = 'asteroid';
        } else {
          deathCause = 'enemy';
        }
        this.handleDeath(deathCause);
        return;
      }
    }

    if (gameplayActive) {
      this.salvageSystem.update(delta, this.difficultySystem.getDrifters());
      // Mission tracking for income sources and credit thresholds
      const frameSalvage = this.salvageSystem.getLastFrameSalvageIncome();
      const frameMining = this.salvageSystem.getLastFrameMiningIncome();
      if (frameSalvage > 0) this.missionSystem.trackSalvageIncome(frameSalvage);
      if (frameMining > 0) this.missionSystem.trackMiningIncome(frameMining);
      this.missionSystem.trackCreditsReached(this.scoreSystem.getUnbanked());
      // Check for mission completions and show pop-ups
      const completions = this.missionSystem.consumeNewCompletions();
      for (const m of completions) {
        this.salvageSystem.spawnRewardText(
          `MISSION +${m.def.reward}`,
          this.player.x,
          this.player.y - 40,
          `#${COLORS.GATE.toString(16).padStart(6, '0')}`,
        );
      }
    }

    // Update player death debris
    for (let i = this.playerDebris.length - 1; i >= 0; i--) {
      this.playerDebris[i].update(effectiveDelta);
      if (!this.playerDebris[i].active) {
        this.playerDebris[i].destroy();
        this.playerDebris.splice(i, 1);
      }
    }

    this.updateStarfield(effectiveDelta);
    this.geoSphere.update(effectiveDelta);
    if (countdownActive) {
      this.updateCountdown(effectiveDelta, paused);
    }

    // Hologram overlay
    this.hologramOverlay.update(effectiveDelta);
    // Pass player coords only during active gameplay so the triangle
    // eases back to pointing up when paused or on the result screen
    const cursorTracking = !paused && !this.resultData;
    this.cursor.update(this, cursorTracking ? this.player.x : undefined, cursorTracking ? this.player.y : undefined);

    // HUD — comm triggers keyed to extractable transitions
    const gateExtractable = this.extractionSystem.isGateActive();
    const gate = this.extractionSystem.getGate();
    if (!runFrozen && !paused && gate?.justBecameExtractable && Math.random() < 0.35) {
      this.tryShowGameplaySlick(getSlickLine('gateOpen'));
    }
    if (!runFrozen && !paused && !gateExtractable && this.lastGateActive && Math.random() < 0.25) {
      this.tryShowGameplaySlick(getSlickLine('gateClose'), 2400);
    }
    if (!runFrozen) {
      this.lastGateActive = gateExtractable;
    }

    this.hud.update(
      this.scoreSystem.getUnbanked(),
      this.scoreSystem.getBest(),
      currentPhase,
      this.player.hasShield,
    );
    this.hud.setMissionPillsHidden(
      this.isGameplayCommState()
      && this.activeCommSpeaker !== null
      && this.time.now < this.activeCommVisibleUntil,
    );
    this.hud.updateMissions(this.missionSystem.getActiveMissions());
  }

  private spawnDebris(): void {
    const debris = new SalvageDebris(this);
    this.debrisList.push(debris);
    this.salvageSystem.addDebris(debris);

    // Spawn a shield pickup near the salvage (if player doesn't have one and none exists)
    if (!this.player.hasShield && this.shields.length === 0) {
      const offsetAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const offsetDist = debris.salvageRadius * 0.7;
      const sx = debris.x + Math.cos(offsetAngle) * offsetDist;
      const sy = debris.y + Math.sin(offsetAngle) * offsetDist;
      const shield = new ShieldPickup(this, sx, sy, debris.driftVx, debris.driftVy);
      this.shields.push(shield);
    }
  }

  private spawnRareDebris(phase: number): void {
    const debris = new SalvageDebris(this, {
      isRare: true,
      lifetime: 12000,
      pointsMultiplier: 4 + phase * 1.0,
    });
    this.debrisList.push(debris);
    this.salvageSystem.addDebris(debris);
  }

  private scheduleDebrisRespawn(): void {
    this.debrisRespawnTimer = this.time.delayedCall(SALVAGE_RESPAWN_DELAY, () => {
      if (
        this.state === GameState.COUNTDOWN ||
        this.state === GameState.PLAYING ||
        this.state === GameState.PAUSED
      ) {
        this.spawnDebris();
      }
      this.debrisRespawnTimer = null;
    });
  }

  private handleDeath(cause: DeathCause): void {
    const lostScore = this.scoreSystem.getUnbanked();
    const missionProgress = this.missionSystem.getActiveMissions().map((m) => ({
      label: m.def.label,
      progress: Math.floor(m.progress),
      target: m.def.target,
      completed: m.completed,
      reward: m.def.reward,
    }));
    this.missionSystem.save();
    this.resultData = { score: lostScore, cause: 'death', missionProgress };
    this.state = GameState.DEAD;
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.hidePauseMenu();
    this.refreshPauseUi();
    const currentPhase = this.extractionSystem.getPhaseCount();
    if (cause === 'enemy' || cause === 'laser' || currentPhase >= 5) {
      this.slickComm.hide();
      this.showRegentExclusive(getRegentLine('killTaunt'), 0);
    } else {
      const slickDeathKey = Math.random() < 0.35 ? 'death' : 'hazardDeath';
      this.showSlickExclusive(getSlickLine(slickDeathKey), 0);
    }
    this.playerDebris.push(new ShipDebris(
      this, this.player.x, this.player.y,
      this.player.getVelocityX(), this.player.getVelocityY(),
      COLORS.PLAYER, 8,
    ));
    this.player.setDestroyedVisual(true);
    Overlays.screenShake(this, 0.014, 350);
    Overlays.screenWipe(
      this,
      0xff3366,
      0.55,
      () => {
        this.enterResultsState();
      },
      { duration: 350, hold: 120 },
    );
  }

  private handleExtraction(): void {
    this.state = GameState.EXTRACTING;
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.hidePauseMenu();
    this.refreshPauseUi();
    // Check mission completion on extraction
    this.missionSystem.trackCreditsExtracted(this.scoreSystem.getBanked());
    this.missionSystem.checkExtraction();
    const missionBonus = this.missionSystem.getCompletedReward();
    // Capture mission progress before clearing completed missions
    const missionProgress = this.missionSystem.getActiveMissions().map((m) => ({
      label: m.def.label,
      progress: Math.floor(m.progress),
      target: m.def.target,
      completed: m.completed,
      reward: m.def.reward,
    }));
    if (missionBonus > 0) {
      this.scoreSystem.addBanked(missionBonus);
    }
    this.missionSystem.claimAndClear();
    const score = this.scoreSystem.getBanked();
    const walletDeposit = this.saveSystem.depositWalletPayout(score);
    this.bankingSystem.finalizeExtraction();
    this.resultData = {
      score,
      cause: 'extract',
      missionBonus,
      walletPayout: walletDeposit.payout,
      slickCut: walletDeposit.slickCut,
      walletBalance: walletDeposit.walletBalance,
      missionProgress,
    };
    this.showSlickExclusive(getSlickLine('extraction'), 0);
    this.clearBoard();
    Overlays.bombFlash(this);
    Overlays.screenWipe(this, 0x44ff88, 0.5, () => {
      this.enterResultsState();
    });
  }

  private tryShowSlick(
    key: Parameters<typeof getSlickLine>[0],
    chance: number,
    autoHideMs?: number,
  ): void {
    if (Math.random() >= chance) return;
    this.tryShowGameplaySlick(getSlickLine(key), autoHideMs);
  }

  private tryShowGameplaySlick(message: string, autoHideMs?: number): boolean {
    return this.tryShowGameplayComm('slick', message, autoHideMs);
  }

  private tryShowGameplayRegent(message: string, autoHideMs?: number): boolean {
    return this.tryShowGameplayComm('regent', message, autoHideMs, {
      allowInterrupt: this.regentIntroduced,
      ignoreCooldown: this.regentIntroduced,
    });
  }

  private tryShowGameplayComm(
    speaker: CommSpeaker,
    message: string,
    autoHideMs?: number,
    options: GameplayCommOptions = {},
  ): boolean {
    if (!this.isGameplayCommState()) return false;

    this.syncCommState();
    const now = this.time.now;
    const priority = this.getCommPriority(speaker);
    const commVisible = this.activeCommSpeaker !== null && now < this.activeCommVisibleUntil;

    if (commVisible) {
      if (!(options.allowInterrupt && priority > this.activeCommPriority)) {
        return false;
      }
    } else if (now < this.nextGameplayCommAt && !options.ignoreCooldown) {
      return false;
    }

    this.showCommNow(speaker, message, autoHideMs);
    return true;
  }

  private isGameplayCommState(): boolean {
    return (
      this.state === GameState.COUNTDOWN ||
      this.state === GameState.PLAYING ||
      this.state === GameState.PAUSED
    );
  }

  private syncCommState(): void {
    if (this.activeCommVisibleUntil === Number.POSITIVE_INFINITY) return;
    if (this.time.now < this.activeCommVisibleUntil) return;
    this.activeCommSpeaker = null;
    this.activeCommPriority = 0;
    this.activeCommVisibleUntil = 0;
  }

  private getCommPriority(speaker: CommSpeaker): number {
    if (speaker === 'regent') {
      return this.regentIntroduced ? 3 : 2;
    }
    return speaker === 'slick' ? 2 : 1;
  }

  private getCommDuration(speaker: CommSpeaker, autoHideMs?: number): number {
    return autoHideMs ?? GameScene.DEFAULT_COMM_HIDE_MS[speaker];
  }

  private hideOtherComms(activeSpeaker: CommSpeaker): void {
    if (activeSpeaker !== 'slick') this.slickComm.hide();
    if (activeSpeaker !== 'regent') this.regentComm.hide();
    if (activeSpeaker !== 'liaison') this.liaisonComm?.hide();
  }

  private clearCommState(): void {
    this.activeCommSpeaker = null;
    this.activeCommPriority = 0;
    this.activeCommVisibleUntil = 0;
    this.nextGameplayCommAt = this.time.now;
  }

  private showCommNow(
    speaker: CommSpeaker,
    message: string,
    autoHideMs?: number,
  ): void {
    const duration = this.getCommDuration(speaker, autoHideMs);
    this.hideOtherComms(speaker);

    if (speaker === 'slick') {
      this.slickComm.show(message, duration);
    } else if (speaker === 'regent') {
      this.regentComm.show(message, duration);
    } else {
      this.liaisonComm?.show(message, duration);
    }

    this.activeCommSpeaker = speaker;
    this.activeCommPriority = this.getCommPriority(speaker);
    this.activeCommVisibleUntil = duration > 0 ? this.time.now + duration : Number.POSITIVE_INFINITY;
    this.nextGameplayCommAt = duration > 0
      ? this.activeCommVisibleUntil + GameScene.GAMEPLAY_COMM_GAP_MS
      : Number.POSITIVE_INFINITY;
  }

  private showSlickExclusive(message: string, autoHideMs?: number): void {
    this.showCommNow('slick', message, autoHideMs);
  }

  private showRegentExclusive(message: string, autoHideMs?: number): void {
    this.showCommNow('regent', message, autoHideMs);
  }

  private showLiaisonExclusive(message: string, autoHideMs?: number): void {
    this.showCommNow('liaison', message, autoHideMs);
  }

  private cleanup(): void {
    this.input.off('pointerdown', this.handlePointerDown, this);
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.inputSystem.destroy();
    this.scoreSystem.destroy();
    this.salvageSystem.destroy();
    this.collisionSystem.destroy();
    this.extractionSystem.destroy();
    this.bankingSystem.destroy();
    this.difficultySystem.destroy();
    this.missionSystem.destroy();
    this.player.destroy();
    for (const d of this.debrisList) d.destroy();
    this.debrisList = [];
    for (const s of this.shields) s.destroy();
    this.shields = [];
    for (const bonus of this.bonusPickups) bonus.destroy();
    this.bonusPickups = [];
    for (const bomb of this.bombPickups) bomb.destroy();
    this.bombPickups = [];
    for (const pd of this.playerDebris) pd.destroy();
    this.playerDebris = [];
    if (this.debrisRespawnTimer) {
      this.debrisRespawnTimer.destroy();
      this.debrisRespawnTimer = null;
    }
    if (this.entryGate) {
      this.entryGate.destroy();
      this.entryGate = null;
    }
    if (this.countdownText) {
      this.countdownText.destroy();
      this.countdownText = null;
    }
    this.hidePauseMenu();
    this.pauseButtonBg.destroy();
    this.pauseButtonText.destroy();
    this.pauseButtonHit.destroy();
    this.clearResultUi();
    this.hud.destroy();
    this.clearCommState();
    this.slickComm.destroy();
    this.regentComm.destroy();
    this.liaisonComm?.destroy();
    this.liaisonComm = null;
    this.hologramOverlay.destroy();
    this.cursor.destroy(this);
    this.geoSphere.destroy();
    this.starfield.destroy();
    this.arenaBorder.destroy();
  }

  private updateStarfield(delta: number): void {
    const layout = getLayout();
    const dt = delta / 1000;
    for (const star of this.starfieldStars) {
      star.x -= star.speed * dt;
      if (star.x < -GameScene.STARFIELD_OVERSCAN - star.size) {
        star.x = layout.gameWidth + GameScene.STARFIELD_OVERSCAN + star.size;
        star.y = Phaser.Math.Between(-GameScene.STARFIELD_OVERSCAN, layout.gameHeight + GameScene.STARFIELD_OVERSCAN);
      }
    }
    this.drawStarfield();
  }

  private updateEntryGate(delta: number): void {
    if (this.entryGate) {
      this.entryGate.update(delta);
      if (!this.entryGate.active) {
        this.entryGate.destroy();
        this.entryGate = null;
      }
    }
  }

  private updateCountdown(delta: number, paused = false): void {
    this.countdownTimer = Math.max(0, this.countdownTimer - delta);
    const elapsed = GameScene.START_COUNTDOWN_MS - this.countdownTimer;
    const phraseIndex = Math.min(
      Math.floor(elapsed / 1000),
      GameScene.COUNTDOWN_PHRASES.length - 1,
    );
    this.countdownText?.setText(GameScene.COUNTDOWN_PHRASES[phraseIndex]);

    const secondProgress = 1 - ((this.countdownTimer % 1000) / 1000);
    const scale = 0.9 + secondProgress * 0.45;
    this.countdownText?.setScale(scale);
    this.countdownText?.setAlpha(0.72 + secondProgress * 0.24);

    if (this.countdownTimer <= 0) {
      this.countdownText?.destroy();
      this.countdownText = null;
      if (paused && this.state === GameState.PAUSED) {
        this.pausedFromState = GameState.PLAYING;
      } else {
        this.state = GameState.PLAYING;
      }
      this.refreshPauseUi();
      // Game entry — clear board, flash white, fresh start
      this.boardWipe();
    }
  }

  private drawStarfield(): void {
    const layout = getLayout();
    this.starfield.clear();
    this.starfield.fillStyle(0x020806, 1);
    this.starfield.fillRect(
      -GameScene.STARFIELD_OVERSCAN,
      -GameScene.STARFIELD_OVERSCAN,
      layout.gameWidth + GameScene.STARFIELD_OVERSCAN * 2,
      layout.gameHeight + GameScene.STARFIELD_OVERSCAN * 2,
    );
    for (const star of this.starfieldStars) {
      this.starfield.fillStyle(star.color, star.alpha);
      this.starfield.fillCircle(star.x, star.y, star.size);
    }
  }

  private enterResultsState(): void {
    if (!this.resultData) return;

    this.state = GameState.RESULTS;
    this.resultInputLocked = true;
    this.hidePauseMenu();
    this.refreshPauseUi();
    this.showResultUi(this.resultData);
    this.time.delayedCall(500, () => {
      this.resultInputLocked = false;
    });
  }

  private showResultUi(data: ResultData): void {
    this.clearResultUi();
    const layout = getLayout();
    const resultCommWidth = Math.min(layout.gameWidth - 96, 368);
    this.slickComm.setPanelWidth(resultCommWidth);
    this.regentComm.setPanelWidth(resultCommWidth);
    this.liaisonComm?.setPanelWidth(resultCommWidth);

    const centerX = layout.centerX;
    const isDeath = data.cause === 'death';
    const arenaInset = Phaser.Math.Clamp(Math.round(Math.min(layout.arenaWidth, layout.arenaHeight) * 0.04), 16, 30);
    const panelLeft = layout.arenaLeft + arenaInset;
    const panelTop = layout.arenaTop + arenaInset;
    const panelWidth = layout.arenaWidth - arenaInset * 2;
    const panelHeight = layout.arenaHeight - arenaInset * 2;
    const panelBottom = panelTop + panelHeight;
    const compactResults = layout.gameWidth <= 430 || layout.gameHeight <= 760;
    const panelPaddingX = Phaser.Math.Clamp(Math.round(panelWidth * 0.08), 18, 30);
    const panelPaddingTop = Phaser.Math.Clamp(Math.round(panelHeight * 0.055), 18, 30);
    const panelPaddingBottom = Phaser.Math.Clamp(Math.round(panelHeight * 0.05), 18, 28);
    const textWidth = panelWidth - panelPaddingX * 2;
    const titleGap = Phaser.Math.Clamp(Math.round(panelHeight * (compactResults ? 0.018 : 0.022)), 6, compactResults ? 12 : 16);
    const lineGap = Phaser.Math.Clamp(Math.round(panelHeight * 0.014), 6, 10);
    const sectionGap = Phaser.Math.Clamp(Math.round(panelHeight * (compactResults ? 0.02 : 0.026)), 8, compactResults ? 16 : 20);
    const buttonWidth = Math.min(panelWidth - panelPaddingX * 2, 392);
    const buttonHeight = Phaser.Math.Clamp(Math.round(panelHeight * 0.074), 40, 58);
    const buttonGap = Phaser.Math.Clamp(Math.round(panelHeight * 0.022), 8, 16);
    const commPanelHeight = Math.max(
      96,
      isDeath
        ? Math.max(this.slickComm.getPanelHeight(), this.regentComm.getPanelHeight())
        : this.slickComm.getPanelHeight(),
    );
    const commGap = Phaser.Math.Clamp(Math.round(panelHeight * 0.026), 10, 16);
    const menuButtonY = panelBottom - panelPaddingBottom - buttonHeight / 2;
    const retryButtonY = menuButtonY - buttonHeight - buttonGap;
    const retryButtonTop = retryButtonY - buttonHeight / 2;
    const titleColor = isDeath ? COLORS.HAZARD : COLORS.GATE;
    const titleText = isDeath ? 'DESTROYED' : 'EXTRACT';
    const titleBarHeight = Phaser.Math.Clamp(Math.round(panelHeight * (compactResults ? 0.05 : 0.058)), 34, 48);
    const titleBarTop = panelTop + Phaser.Math.Clamp(Math.round(panelHeight * 0.018), 8, 16);
    const titleBarBottom = titleBarTop + titleBarHeight;
    const titleSize = readableFontSize(Phaser.Math.Clamp(Math.round(titleBarHeight * 0.58), 20, 30));
    const scoreSize = readableFontSize(Phaser.Math.Clamp(Math.round(panelHeight * 0.053), isDeath ? 24 : 28, 38));
    const metaSize = readableFontSize(Phaser.Math.Clamp(Math.round(panelHeight * 0.026), 12, 16));
    const detailSize = readableFontSize(Phaser.Math.Clamp(Math.round(panelHeight * 0.022), 11, 14));
    const missionHeaderSize = readableFontSize(Phaser.Math.Clamp(Math.round(panelHeight * 0.024), 12, 15));
    const missionLineSize = readableFontSize(Phaser.Math.Clamp(Math.round(panelHeight * 0.022), 11, 14));
    const bonusSize = readableFontSize(Phaser.Math.Clamp(Math.round(panelHeight * 0.03), 14, 18));

    const backing = this.add.graphics().setDepth(205);
    backing.fillStyle(COLORS.BG, 0.78);
    backing.fillRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 18);
    backing.lineStyle(1.5, titleColor, 0.4);
    backing.strokeRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 18);
    this.resultUi.push(backing);

    const titleBar = this.add.graphics().setDepth(208);
    titleBar.fillStyle(titleColor, 0.94);
    titleBar.fillRect(0, titleBarTop, layout.gameWidth, titleBarHeight);
    titleBar.lineStyle(1, COLORS.BG, 0.35);
    titleBar.lineBetween(0, titleBarTop, layout.gameWidth, titleBarTop);
    titleBar.lineBetween(0, titleBarBottom, layout.gameWidth, titleBarBottom);
    this.resultUi.push(titleBar);

    let currentY = Math.max(panelTop + panelPaddingTop, titleBarBottom + titleGap);

    const title = this.add.text(centerX, titleBarTop + titleBarHeight / 2, titleText, {
      fontFamily: UI_FONT,
      fontSize: titleSize,
      color: `#${COLORS.BG.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(210);
    this.resultUi.push(title);

    const scoreText = this.add.text(
      centerX,
      currentY,
      isDeath ? `CREDITS LOST: ${Math.floor(data.score)}` : `SCORE: ${Math.floor(data.score)}`,
      {
        fontFamily: UI_FONT,
        fontSize: scoreSize,
        color: `#${(isDeath ? COLORS.HAZARD : COLORS.SALVAGE).toString(16).padStart(6, '0')}`,
        align: 'center',
        wordWrap: { width: textWidth },
      },
    ).setOrigin(0.5, 0).setDepth(210);
    this.resultUi.push(scoreText);
    currentY += scoreText.height;
    let resultContentBottomY = currentY;

    if (!isDeath) {
      currentY += lineGap;
      const walletText = this.add.text(centerX, currentY, `WALLET +${Math.floor(data.walletPayout ?? 0)}c  //  TOTAL ${Math.floor(data.walletBalance ?? 0)}c`, {
        fontFamily: UI_FONT,
        fontSize: metaSize,
        color: `#${COLORS.GATE.toString(16).padStart(6, '0')}`,
        align: 'center',
        wordWrap: { width: textWidth },
      }).setOrigin(0.5, 0).setDepth(210).setAlpha(0.86);
      this.resultUi.push(walletText);
      currentY += walletText.height + lineGap;
      resultContentBottomY = currentY;

      const slickCutText = this.add.text(centerX, currentY, `YOU KEEP ${getWalletSharePercent()}%  //  SLICK TAKES ${getSlickCutPercent()}%  //  SLICK GOT ${Math.floor(data.slickCut ?? 0)}c`, {
        fontFamily: UI_FONT,
        fontSize: detailSize,
        color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
        align: 'center',
        wordWrap: { width: textWidth },
      }).setOrigin(0.5, 0).setDepth(210).setAlpha(0.62);
      this.resultUi.push(slickCutText);
      currentY += slickCutText.height;
      resultContentBottomY = currentY;
    }

    // Mission results section
    const missions = data.missionProgress ?? [];
    if (missions.length > 0) {
      const missionStartRatio = isDeath
        ? (compactResults ? 0.2 : 0.24)
        : (compactResults ? 0.24 : 0.28);
      currentY = Math.max(currentY + sectionGap, panelTop + panelHeight * missionStartRatio);
      const headerLabel = isDeath ? 'MISSIONS: INCOMPLETE' : 'MISSIONS:';
      const headerColor = isDeath ? COLORS.HAZARD : COLORS.GATE;
      const mHeader = this.add.text(centerX, currentY, headerLabel, {
        fontFamily: UI_FONT,
        fontSize: missionHeaderSize,
        color: `#${headerColor.toString(16).padStart(6, '0')}`,
        align: 'center',
      }).setOrigin(0.5, 0).setDepth(210).setAlpha(0.8);
      this.resultUi.push(mHeader);
      currentY += mHeader.height + lineGap;
      resultContentBottomY = currentY;

      for (let i = 0; i < missions.length; i++) {
        const m = missions[i];
        const prog = Math.min(m.progress, m.target);
        let line: string;
        let lineColor: number;
        if (!isDeath && m.completed) {
          line = `\u2713 ${m.label}  +${m.reward}`;
          lineColor = COLORS.GATE;
        } else {
          line = `  ${m.label}  ${prog}/${m.target}`;
          lineColor = isDeath ? COLORS.HAZARD : COLORS.HUD;
        }
        const mText = this.add.text(centerX, currentY, line, {
          fontFamily: UI_FONT,
          fontSize: missionLineSize,
          color: `#${lineColor.toString(16).padStart(6, '0')}`,
          align: 'center',
          wordWrap: { width: textWidth },
        }).setOrigin(0.5, 0).setDepth(210).setAlpha(m.completed ? 0.9 : 0.6);
        this.resultUi.push(mText);
        currentY += mText.height + lineGap;
        resultContentBottomY = currentY;
      }

      if (!isDeath && data.missionBonus && data.missionBonus > 0) {
        currentY += Math.max(2, lineGap - 2);
        const bonusText = this.add.text(centerX, currentY, `BONUS: +${data.missionBonus}`, {
          fontFamily: UI_FONT,
          fontSize: bonusSize,
          color: `#${COLORS.GATE.toString(16).padStart(6, '0')}`,
          align: 'center',
          fontStyle: 'bold',
        }).setOrigin(0.5, 0).setDepth(210);
        this.resultUi.push(bonusText);
        currentY += bonusText.height;
        resultContentBottomY = currentY;
      }
    }

    const gapTop = resultContentBottomY + commGap;
    const gapBottom = retryButtonTop - commGap;
    const commAvailableTravel = Math.max(0, gapBottom - gapTop - commPanelHeight);
    const resultCommY = Phaser.Math.Clamp(
      gapTop + commAvailableTravel * (compactResults || isDeath ? 1 : 0.5),
      gapTop,
      Math.max(gapTop, gapBottom - commPanelHeight),
    );

    this.slickComm.setPinnedLayout(resultCommY, 212);
    if (isDeath) {
      this.regentComm.setPinnedLayout(resultCommY, 212);
    } else {
      this.regentComm.resetLayout();
    }

    this.createResultButton(
      'TAP TO RETRY',
      centerX,
      retryButtonY,
      buttonWidth,
      buttonHeight,
      COLORS.GATE,
      () => {
        this.scene.start(SCENE_KEYS.GAME, {
          retryFromDeath: this.resultData?.cause === 'death',
          runBoosts: this.resultData?.cause === 'death' ? this.activeRunBoosts ?? undefined : undefined,
        } satisfies MenuHandoff);
      },
    );

    this.createResultButton(
      'MENU',
      centerX,
      menuButtonY,
      buttonWidth,
      buttonHeight,
      COLORS.HUD,
      () => {
        this.scene.start(SCENE_KEYS.MENU);
      },
    );
  }

  private applyGameplayCommLayout(): void {
    const bottomInset = 2;
    this.slickComm.setBottomPinnedLayout(bottomInset);
    this.regentComm.setBottomPinnedLayout(bottomInset);
    this.liaisonComm?.setBottomPinnedLayout(bottomInset);
  }

  private clearResultUi(): void {
    for (const obj of this.resultUi) {
      obj.destroy();
    }
    this.resultUi = [];
  }

  private createResultButton(
    label: string,
    x: number,
    y: number,
    width: number,
    height: number,
    accentColor: number,
    onClick: () => void,
  ): void {
    const bg = this.add.graphics().setDepth(210);
    const labelText = this.add.text(x, y, label, {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(Phaser.Math.Clamp(Math.round(height * 0.42), 14, 19)),
      color: `#${accentColor.toString(16).padStart(6, '0')}`,
      align: 'center',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(211);
    const hit = this.add.zone(x, y, width, height)
      .setData('cornerRadius', 10)
      .setOrigin(0.5)
      .setDepth(212)
      .setInteractive({ useHandCursor: true });

    const draw = (hovered: boolean, pressed: boolean): void => {
      const left = x - width / 2;
      const top = y - height / 2;
      bg.clear();
      bg.fillStyle(COLORS.BG, hovered ? 0.92 : 0.82);
      bg.lineStyle(1.5, accentColor, pressed ? 0.95 : hovered ? 0.72 : 0.45);
      bg.fillRoundedRect(left, top, width, height, 10);
      bg.strokeRoundedRect(left, top, width, height, 10);
      bg.fillStyle(accentColor, pressed ? 0.18 : hovered ? 0.1 : 0.06);
      bg.fillRoundedRect(left + 4, top + 4, width - 8, height - 8, 8);
      labelText.setAlpha(pressed ? 1 : hovered ? 0.96 : 0.88);
    };

    draw(false, false);

    hit.on('pointerover', () => draw(true, false));
    hit.on('pointerout', () => draw(false, false));
    hit.on('pointerdown', (
      _pointer: Phaser.Input.Pointer,
      _lx: number,
      _ly: number,
      event: Phaser.Types.Input.EventData,
    ) => {
      event.stopPropagation();
      if (this.resultInputLocked) return;
      draw(true, true);
      onClick();
    });

    this.resultUi.push(bg, labelText, hit);
  }

  private createPauseButton(): void {
    const layout = getLayout();
    const buttonWidth = 52;
    const buttonHeight = 34;
    const buttonX = layout.gameWidth - 16 - buttonWidth / 2;
    const buttonY = 44;

    this.pauseButtonBg = this.add.graphics().setDepth(230);
    this.pauseButtonText = this.add.text(buttonX, buttonY, '||', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(14),
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(231);

    this.pauseButtonHit = this.add.zone(
      buttonX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
    ).setData('cornerRadius', 8).setOrigin(0, 0).setDepth(232).setInteractive({ useHandCursor: true });
    this.pauseButtonHit.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.togglePause();
      },
    );
  }

  /** Clear all hazards, enemies, salvage, and pickups from the board. */
  /** Clear all hazards, enemies, salvage, and pickups — each shatters into debris. */
  private clearBoard(): void {
    const drifters = this.difficultySystem.getDrifters();
    for (const d of drifters) {
      this.playerDebris.push(new ShipDebris(this, d.x, d.y, d.vx, d.vy, COLORS.HAZARD, d.radius));
      d.destroy();
    }
    drifters.length = 0;

    const beams = this.difficultySystem.getBeams();
    for (const b of beams) b.destroy();
    beams.length = 0;

    const enemies = this.difficultySystem.getEnemies();
    for (const e of enemies) {
      this.playerDebris.push(new ShipDebris(this, e.x, e.y, e.getVelocityX(), e.getVelocityY(), 0xff00ff, e.radius));
      this.missionSystem.trackEnemyKill();
      e.destroy();
    }
    enemies.length = 0;

    const npcs = this.difficultySystem.getNPCs();
    for (const n of npcs) {
      this.playerDebris.push(new ShipDebris(this, n.x, n.y, n.vx, n.vy, 0xffcc44, n.radius));
      n.destroy();
    }
    npcs.length = 0;

    for (const s of this.shields) {
      this.playerDebris.push(new ShipDebris(this, s.x, s.y, s.vx, s.vy, 0x44aaff, s.radius));
      s.destroy();
    }
    this.shields = [];

    for (const b of this.bonusPickups) {
      this.playerDebris.push(new ShipDebris(this, b.x, b.y, b.vx, b.vy, COLORS.SALVAGE, b.radius));
      b.destroy();
    }
    this.bonusPickups = [];

    for (const b of this.bombPickups) {
      this.playerDebris.push(new ShipDebris(this, b.x, b.y, b.vx, b.vy, 0xff8800, b.radius));
      b.destroy();
    }
    this.bombPickups = [];

    for (const d of this.debrisList) {
      const color = d.isRare ? 0xff44ff : COLORS.SALVAGE;
      this.playerDebris.push(new ShipDebris(this, d.x, d.y, d.driftVx, d.driftVy, color, 20));
      this.salvageSystem.removeDebris(d);
      d.destroy();
    }
    this.debrisList = [];
  }

  /** Flash the board white, clear all entities, then respawn salvage after a delay. */
  private boardWipe(): void {
    this.clearBoard();
    Overlays.bombFlash(this);
    this.time.delayedCall(800, () => {
      if (this.state === GameState.PLAYING || this.state === GameState.COUNTDOWN) {
        this.spawnDebris();
      }
    });
  }

  // --- Debug spawn helpers ---

  private togglePause(): void {
    if (this.state === GameState.PAUSED) {
      this.resumeGame();
      return;
    }

    if (this.state !== GameState.COUNTDOWN && this.state !== GameState.PLAYING) {
      return;
    }

    this.pauseGame();
  }

  private pauseGame(): void {
    this.pausedFromState = this.state;
    this.inputSystem.clear();
    this.state = GameState.PAUSED;
    this.time.timeScale = GameScene.PAUSE_SLOW_SCALE;
    this.tweens.timeScale = GameScene.PAUSE_SLOW_SCALE;
    this.showPauseMenu();
    this.refreshPauseUi();
  }

  private resumeGame(): void {
    if (this.state !== GameState.PAUSED) return;

    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.hidePauseMenu();
    this.inputSystem.clear();
    this.state = this.pausedFromState;
    this.refreshPauseUi();
  }

  private showPauseMenu(): void {
    this.hidePauseMenu();
    const layout = getLayout();
    const centerX = layout.centerX;
    const panelMargin = 16;
    const panelTop = panelMargin;
    const panelHeight = layout.gameHeight - panelMargin * 2;

    const blocker = this.add.zone(0, 0, layout.gameWidth, layout.gameHeight)
      .setOrigin(0, 0)
      .setDepth(218)
      .setInteractive({ useHandCursor: false });
    blocker.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
      },
    );
    this.pauseUi.push(blocker);

    const dim = this.add.graphics().setDepth(217);
    dim.fillStyle(COLORS.BG, 0.78);
    dim.fillRect(0, 0, layout.gameWidth, layout.gameHeight);
    this.pauseUi.push(dim);

    const panel = this.add.graphics().setDepth(220);
    panel.fillStyle(COLORS.BG, 0.92);
    panel.fillRoundedRect(28, panelTop, layout.gameWidth - 56, panelHeight, 16);
    panel.lineStyle(1.5, COLORS.GATE, 0.45);
    panel.strokeRoundedRect(28, panelTop, layout.gameWidth - 56, panelHeight, 16);
    this.pauseUi.push(panel);

    const title = this.add.text(centerX, panelTop + 36, 'PAUSED', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(34),
      color: `#${COLORS.GATE.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(221);
    this.pauseUi.push(title);

    const subtitle = this.add.text(centerX, panelTop + 72, 'RUN AT CRAWL // DANGER LIVE', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(13),
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setAlpha(0.8);
    this.pauseUi.push(subtitle);

    const abandonText = this.add.text(centerX, panelTop + 116, 'ABANDON RUN', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(18),
      color: `#${COLORS.HAZARD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setInteractive({ useHandCursor: true });
    abandonText.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.abandonRun();
      },
    );
    this.pauseUi.push(abandonText);

    const abandonHint = this.add.text(centerX, panelTop + 142, 'RETURN TO MENU WITHOUT BANKING', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(10),
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setAlpha(0.65);
    this.pauseUi.push(abandonHint);

    // Settings section
    const settingsY = panelTop + 188;
    const divider = this.add.graphics().setDepth(221);
    divider.lineStyle(1, COLORS.HUD, 0.2);
    divider.lineBetween(centerX - 100, settingsY - 16, centerX + 100, settingsY - 16);
    this.pauseUi.push(divider);

    const settingsTitle = this.add.text(centerX, settingsY, 'SETTINGS', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(16),
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setAlpha(0.7);
    this.pauseUi.push(settingsTitle);

    const settings = getSettings();
    const hudColor = `#${COLORS.HUD.toString(16).padStart(6, '0')}`;
    const gateColor = `#${COLORS.GATE.toString(16).padStart(6, '0')}`;
    const musicY = settingsY + 90;
    const musicVolumeLabelY = settingsY + 124;
    const musicVolumeY = settingsY + 138;
    const fxVolumeLabelY = settingsY + 156;
    const fxVolumeY = settingsY + 170;

    // Screen shake toggle
    const shakeText = this.add.text(centerX, settingsY + 34, `SCREEN SHAKE: ${settings.screenShake ? 'ON' : 'OFF'}`, {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(14),
      color: settings.screenShake ? gateColor : hudColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setInteractive({ useHandCursor: true });
    shakeText.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        const s = getSettings();
        updateSettings({ screenShake: !s.screenShake });
        const updated = getSettings();
        shakeText.setText(`SCREEN SHAKE: ${updated.screenShake ? 'ON' : 'OFF'}`);
        shakeText.setColor(updated.screenShake ? gateColor : hudColor);
      },
    );
    this.pauseUi.push(shakeText);

    // Scanlines toggle
    const scanText = this.add.text(centerX, settingsY + 62, `SCANLINES: ${settings.scanlines ? 'ON' : 'OFF'}`, {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(14),
      color: settings.scanlines ? gateColor : hudColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setInteractive({ useHandCursor: true });
    scanText.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        const s = getSettings();
        updateSettings({ scanlines: !s.scanlines });
        const updated = getSettings();
        scanText.setText(`SCANLINES: ${updated.scanlines ? 'ON' : 'OFF'}`);
        scanText.setColor(updated.scanlines ? gateColor : hudColor);
        this.hologramOverlay.setEnabled(updated.scanlines);
      },
    );
    this.pauseUi.push(scanText);

    const musicText = this.add.text(centerX, musicY, `MUSIC: ${settings.musicEnabled ? 'ON' : 'OFF'}`, {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(14),
      color: settings.musicEnabled ? gateColor : hudColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setInteractive({ useHandCursor: true });
    musicText.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        const s = getSettings();
        updateSettings({ musicEnabled: !s.musicEnabled });
        const updated = getSettings();
        musicText.setText(`MUSIC: ${updated.musicEnabled ? 'ON' : 'OFF'}`);
        musicText.setColor(updated.musicEnabled ? gateColor : hudColor);
        refreshMusicForSettings(this);
      },
    );
    this.pauseUi.push(musicText);

    const musicBetaText = this.add.text(centerX, musicY + 16, '*BETA*', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(10),
      color: `#${COLORS.HAZARD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setAlpha(0.82);
    this.pauseUi.push(musicBetaText);

    const musicVolumeLabel = this.add.text(centerX, musicVolumeLabelY, 'MUSIC VOL', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(10),
      color: hudColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setAlpha(0.72);
    this.pauseUi.push(musicVolumeLabel);

    const musicVolumeSlider = new SettingsSlider({
      scene: this,
      left: centerX - 56,
      y: musicVolumeY,
      width: 112,
      depth: 221,
      accentColor: COLORS.GATE,
      initialValue: settings.musicVolume,
      onChange: (value) => {
        updateSettings({ musicVolume: value });
        refreshMusicForSettings(this);
      },
    });
    this.pauseUi.push(...musicVolumeSlider.getObjects());

    const fxVolumeLabel = this.add.text(centerX, fxVolumeLabelY, 'FX VOL', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(10),
      color: hudColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setAlpha(0.72);
    this.pauseUi.push(fxVolumeLabel);

    const fxVolumeSlider = new SettingsSlider({
      scene: this,
      left: centerX - 56,
      y: fxVolumeY,
      width: 112,
      depth: 221,
      accentColor: COLORS.SALVAGE,
      initialValue: settings.fxVolume,
      onChange: (value) => {
        updateSettings({ fxVolume: value });
      },
    });
    this.pauseUi.push(...fxVolumeSlider.getObjects());

    // Active missions section
    const activeMissions = this.missionSystem.getActiveMissions();
    if (activeMissions.length > 0) {
      const missionDividerY = settingsY + 196;
      const mDivider = this.add.graphics().setDepth(221);
      mDivider.lineStyle(1, COLORS.HUD, 0.2);
      mDivider.lineBetween(centerX - 100, missionDividerY, centerX + 100, missionDividerY);
      this.pauseUi.push(mDivider);

      const mTitle = this.add.text(centerX, missionDividerY + 16, 'MISSIONS', {
        fontFamily: UI_FONT,
        fontSize: readableFontSize(16),
        color: hudColor,
        align: 'center',
      }).setOrigin(0.5).setDepth(221).setAlpha(0.7);
      this.pauseUi.push(mTitle);

      for (let i = 0; i < activeMissions.length; i++) {
        const m = activeMissions[i];
        const my = missionDividerY + 40 + i * 42;
        const prog = Math.min(Math.floor(m.progress), m.def.target);
        const done = m.completed;

        // Card background
        const cardBg = this.add.graphics().setDepth(220);
        cardBg.fillStyle(COLORS.BG, 0.6);
        cardBg.fillRoundedRect(40, my - 4, layout.gameWidth - 80, 36, 6);
        cardBg.lineStyle(1, done ? COLORS.GATE : COLORS.HUD, done ? 0.5 : 0.15);
        cardBg.strokeRoundedRect(40, my - 4, layout.gameWidth - 80, 36, 6);
        this.pauseUi.push(cardBg);

        const label = this.add.text(50, my + 2, m.def.label, {
          fontFamily: UI_FONT,
          fontSize: readableFontSize(11),
          color: done ? gateColor : hudColor,
        }).setDepth(221).setAlpha(done ? 0.9 : 0.7);
        this.pauseUi.push(label);

        const status = done
          ? `\u2713 DONE  +${m.def.reward}`
          : `${prog}/${m.def.target}`;
        const statusText = this.add.text(layout.gameWidth - 50, my + 2, status, {
          fontFamily: UI_FONT,
          fontSize: readableFontSize(11),
          color: done ? gateColor : hudColor,
          align: 'right',
        }).setOrigin(1, 0).setDepth(221).setAlpha(done ? 0.9 : 0.7);
        this.pauseUi.push(statusText);

        const rewardHint = this.add.text(50, my + 17, `REWARD: +${m.def.reward}`, {
          fontFamily: UI_FONT,
          fontSize: readableFontSize(9),
          color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
        }).setDepth(221).setAlpha(0.5);
        this.pauseUi.push(rewardHint);
      }
    }
  }

  private hidePauseMenu(): void {
    for (const obj of this.pauseUi) {
      obj.destroy();
    }
    this.pauseUi = [];
  }

  private abandonRun(): void {
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.hidePauseMenu();
    this.inputSystem.clear();
    this.scene.start(SCENE_KEYS.MENU);
  }

  private refreshPauseUi(): void {
    const layout = getLayout();
    const buttonWidth = 52;
    const buttonHeight = 34;
    const buttonX = layout.gameWidth - 16 - buttonWidth / 2;
    const buttonY = 44;
    const buttonVisible = (
      this.state === GameState.COUNTDOWN ||
      this.state === GameState.PLAYING ||
      this.state === GameState.PAUSED
    );
    const paused = this.state === GameState.PAUSED;
    const fillColor = paused ? COLORS.GATE : COLORS.BG;
    const lineColor = paused ? COLORS.GATE : COLORS.HUD;
    const textColor = paused ? `#${COLORS.BG.toString(16).padStart(6, '0')}` : `#${COLORS.HUD.toString(16).padStart(6, '0')}`;

    this.pauseButtonBg.clear();
    if (buttonVisible) {
      this.pauseButtonBg.fillStyle(fillColor, paused ? 0.88 : 0.82);
      this.pauseButtonBg.lineStyle(1.25, lineColor, paused ? 0.95 : 0.5);
      this.pauseButtonBg.fillRoundedRect(
        buttonX - buttonWidth / 2,
        buttonY - buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        8,
      );
      this.pauseButtonBg.strokeRoundedRect(
        buttonX - buttonWidth / 2,
        buttonY - buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        8,
      );
    }

    this.pauseButtonBg.setVisible(buttonVisible);
    this.pauseButtonText
      .setVisible(buttonVisible)
      .setPosition(buttonX, buttonY)
      .setText(paused ? '\u25B6' : '||')
      .setColor(textColor);
    this.pauseButtonHit
      .setVisible(buttonVisible)
      .setPosition(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2)
      .setSize(buttonWidth, buttonHeight);

    if (this.pauseButtonHit.input) {
      this.pauseButtonHit.input.enabled = buttonVisible;
    }
  }

  private handlePointerDown(
    _pointer: Phaser.Input.Pointer,
    targets: Phaser.GameObjects.GameObject[],
  ): void {
    if (this.state !== GameState.RESULTS || this.resultInputLocked) return;
    if (targets.length > 0) return;
  }
}
