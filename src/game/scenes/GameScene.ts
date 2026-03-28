import Phaser from 'phaser';
import {
  SCENE_KEYS, COLORS,
} from '../constants';
import { GameState } from '../types';
import { SALVAGE_RESPAWN_DELAY, PLAYER_RADIUS, PLAYER_SHIELD_BREAK_INVULN_MS, NPC_BUMP_FORCE, NPC_BUMP_RADIUS, NPC_BONUS_POINTS } from '../data/tuning';
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
import { RegentComm } from '../ui/RegentComm';
import { getSlickLine } from '../data/slickLines';
import { getRegentLine } from '../data/regentLines';
import { getLayout, setLayoutSize } from '../layout';
import { getSettings, updateSettings } from '../systems/SettingsSystem';

interface MenuHandoff {
  drifterState?: { x: number; y: number; vx: number; vy: number; radiusScale: number }[];
  debrisState?: { x: number; y: number; vx: number; vy: number }[];
  npcState?: { x: number; y: number; vx: number; vy: number }[];
  retryFromDeath?: boolean;
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
}

type DeathCause = 'asteroid' | 'enemy' | 'laser';

export class GameScene extends Phaser.Scene {
  private static readonly COUNTDOWN_PHRASES = ['STAY ALIVE', 'GET PAID', 'GET OUT', 'GO'];
  private static readonly START_COUNTDOWN_MS = GameScene.COUNTDOWN_PHRASES.length * 1000;
  private static readonly PAUSE_SLOW_SCALE = 0.025;
  private static readonly STARFIELD_OVERSCAN = 96;
  private static readonly STARFIELD_COUNT = 170;

  private inputSystem!: InputSystem;
  private scoreSystem!: ScoreSystem;
  private salvageSystem!: SalvageSystem;
  private collisionSystem!: CollisionSystem;
  private extractionSystem!: ExtractionSystem;
  private bankingSystem!: BankingSystem;
  private difficultySystem!: DifficultySystem;
  private saveSystem!: SaveSystem;
  private player!: Player;
  private debrisList: SalvageDebris[] = [];
  private shields: ShieldPickup[] = [];
  private bonusPickups: BonusPickup[] = [];
  private bombPickups: BombPickup[] = [];
  private playerHasBomb = false;
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
  private playerDebris: ShipDebris[] = [];
  private invulnerableTimer = 0;
  private countdownText: Phaser.GameObjects.Text | null = null;
  private resultData: ResultData | null = null;
  private resultUi: Phaser.GameObjects.GameObject[] = [];
  private resultInputLocked = false;
  private lastGateActive = false;
  private pauseButtonBg!: Phaser.GameObjects.Graphics;
  private pauseButtonText!: Phaser.GameObjects.Text;
  private pauseButtonHit!: Phaser.GameObjects.Zone;
  private bombButtonBg!: Phaser.GameObjects.Graphics;
  private bombButtonText!: Phaser.GameObjects.Text;
  private bombButtonHit!: Phaser.GameObjects.Zone;
  private pauseUi: Phaser.GameObjects.GameObject[] = [];
  private pausedFromState: GameState = GameState.PLAYING;

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  create(data?: MenuHandoff): void {
    this.events.once('shutdown', this.cleanup, this);
    setLayoutSize(this.scale.width, this.scale.height);
    const layout = getLayout();
    this.state = GameState.COUNTDOWN;
    this.rareSalvageTimer = 0;
    this.countdownTimer = GameScene.START_COUNTDOWN_MS;
    this.resultData = null;
    this.resultUi = [];
    this.resultInputLocked = false;
    this.lastGateActive = false;
    this.pauseUi = [];
    this.pausedFromState = GameState.COUNTDOWN;
    this.regentIntroduced = false;
    this.regentEnemyAnnounced = false;
    this.regentBeamAnnounced = false;
    this.regentLastPhase = 0;
    this.invulnerableTimer = 2000;
    this.playerHasBomb = false;
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
    this.slickComm = new SlickComm(this);
    this.regentComm = new RegentComm(this);

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
    const handoff = data ?? {};
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

    // Only spawn fresh debris if none carried over
    if (this.debrisList.length === 0) {
      this.spawnDebris();
    }

    this.hud = new Hud(this);
    this.createPauseButton();
    this.createBombButton();
    this.countdownText = this.add.text(
      layout.centerX,
      layout.centerY,
      GameScene.COUNTDOWN_PHRASES[0],
      {
        fontFamily: 'monospace',
        fontSize: '44px',
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
    const openingLineKey = handoff.retryFromDeath && Math.random() < 0.45 ? 'gameOverRetry' : 'runStart';
    this.showSlickExclusive(getSlickLine(openingLineKey));
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
          this.tryShowSlick('shieldPickup', 0.4);
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

      if (gameplayActive && !this.playerHasBomb && bomb.isCollectable()) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, bomb.x, bomb.y);
        if (dist < PLAYER_RADIUS + bomb.radius) {
          this.playerHasBomb = true;
          bomb.active = false;
          bomb.destroy();
          this.bombPickups.splice(i, 1);
          this.tryShowSlick('shieldPickup', 0.5);
          continue;
        }
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
      this.difficultySystem.setPhase(currentPhase);
      const slickPhaseLine = Math.random() < 0.28 ? getSlickLine('phaseAdvance') : null;
      let regentPhaseLine: string | null = null;

      if (currentPhase === 2 && !this.regentIntroduced && Math.random() < 0.5) {
        regentPhaseLine = getRegentLine('threatDetected');
      } else if (currentPhase >= 3 && !this.regentIntroduced) {
        this.regentIntroduced = true;
        regentPhaseLine = getRegentLine('gateClose');
      } else if (this.regentIntroduced) {
        if (currentPhase > 7 && currentPhase > this.regentLastPhase) {
          regentPhaseLine = Math.random() < 0.45 ? getRegentLine('whyWontYouDie') : null;
        } else if (currentPhase >= 3) {
          regentPhaseLine = Math.random() < 0.3 ? getRegentLine('gateClose') : null;
        }
      }

      if (regentPhaseLine) {
        this.showRegentExclusive(regentPhaseLine, 2600);
      } else if (slickPhaseLine) {
        this.showSlickExclusive(slickPhaseLine);
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
      this.showRegentExclusive(getRegentLine('enemyEnter'));
    }
    // Regent: announce first beam activation (phase 7)
    if (!runFrozen && this.regentIntroduced && !this.regentBeamAnnounced && beamsBefore === 0 && this.difficultySystem.getBeams().length > 0) {
      this.regentBeamAnnounced = true;
      this.showRegentExclusive(getRegentLine('beamUnlock'));
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

    // Player-NPC bump physics — push NPCs away, can't destroy them
    const invulnerable = this.invulnerableTimer > 0;

    for (const npc of npcs) {
      if (!npc.active) continue;
      const dx = npc.x - this.player.x;
      const dy = npc.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < NPC_BUMP_RADIUS && dist > 0.1) {
        if (gameplayActive && !invulnerable && npc.hasShield && !this.player.hasShield) {
          this.handleDeath('asteroid');
          return;
        }
        if (gameplayActive && this.player.hasShield && !npc.hasShield) {
          this.player.hasShield = false;
          this.invulnerableTimer = Math.max(this.invulnerableTimer, PLAYER_SHIELD_BREAK_INVULN_MS);
          npc.active = false;
          npc.killedByHazard = false;
          this.playerDebris.push(new ShipDebris(this, npc.x, npc.y, npc.vx, npc.vy, 0xffcc44, npc.radius));
          this.bonusPickups.push(new BonusPickup(this, npc.x, npc.y, NPC_BONUS_POINTS, npc.vx * 0.5, npc.vy * 0.5));
          Overlays.shieldBreakFlash(this);
          continue;
        }
        const nx = dx / dist;
        const ny = dy / dist;
        npc.applyImpulse(nx * NPC_BUMP_FORCE, ny * NPC_BUMP_FORCE);
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
        this.bonusPickups.push(new BonusPickup(this, drop.x, drop.y, drop.points, drop.vx, drop.vy));
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

    // HUD — comm triggers keyed to extractable transitions
    const gateExtractable = this.extractionSystem.isGateActive();
    const gate = this.extractionSystem.getGate();
    if (!runFrozen && !paused && gate?.justBecameExtractable && Math.random() < 0.55) {
      this.showSlickExclusive(getSlickLine('gateOpen'));
    }
    if (!runFrozen && !paused && !gateExtractable && this.lastGateActive && Math.random() < 0.5) {
      this.showSlickExclusive(getSlickLine('gateClose'), 2400);
    }
    if (!runFrozen) {
      this.lastGateActive = gateExtractable;
    }

    this.hud.update(
      this.scoreSystem.getUnbanked(),
      this.scoreSystem.getBest(),
      currentPhase,
      this.player.hasShield,
      this.playerHasBomb,
    );
    this.refreshBombButton();
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
      radiusScale: 0.6,
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
    this.resultData = { score: lostScore, cause: 'death' };
    this.state = GameState.DEAD;
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.hidePauseMenu();
    this.refreshPauseUi();
    if (cause === 'enemy' || cause === 'laser') {
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
    const score = this.scoreSystem.getBanked();
    this.resultData = { score, cause: 'extract' };
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
    this.showSlickExclusive(getSlickLine(key), autoHideMs);
  }

  private showSlickExclusive(message: string, autoHideMs?: number): void {
    this.regentComm.hide();
    this.slickComm.show(message, autoHideMs);
  }

  private showRegentExclusive(message: string, autoHideMs?: number): void {
    this.slickComm.hide();
    this.regentComm.show(message, autoHideMs);
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
    this.bombButtonBg.destroy();
    this.bombButtonText.destroy();
    this.bombButtonHit.destroy();
    this.clearResultUi();
    this.hud.destroy();
    this.slickComm.destroy();
    this.regentComm.destroy();
    this.hologramOverlay.destroy();
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

    const centerX = layout.centerX;
    const cause = data.cause;
    const isDeath = cause === 'death';
    const deathCommY = layout.gameHeight * 0.48;
    const panelTop = layout.gameHeight * 0.18;
    const panelBottom = layout.gameHeight - 50;
    const panelHeight = panelBottom - panelTop;
    const titleColor = isDeath ? COLORS.HAZARD : COLORS.GATE;
    const titleText = isDeath ? 'DESTROYED' : 'EXTRACTED';

    const backing = this.add.graphics().setDepth(205);
    backing.fillStyle(COLORS.BG, 0.78);
    backing.fillRoundedRect(28, panelTop, layout.gameWidth - 56, panelHeight, 16);
    backing.lineStyle(1.5, titleColor, 0.4);
    backing.strokeRoundedRect(28, panelTop, layout.gameWidth - 56, panelHeight, 16);
    this.resultUi.push(backing);

    const title = this.add.text(centerX, layout.gameHeight * 0.29, titleText, {
      fontFamily: 'monospace',
      fontSize: '40px',
      color: `#${titleColor.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(210);
    this.resultUi.push(title);

    const scoreText = this.add.text(
      centerX,
      layout.gameHeight * 0.40,
      isDeath ? `CREDITS LOST: ${Math.floor(data.score)}` : `SCORE: ${Math.floor(data.score)}`,
      {
        fontFamily: 'monospace',
        fontSize: isDeath ? '24px' : '28px',
        color: `#${(isDeath ? COLORS.HAZARD : COLORS.SALVAGE).toString(16).padStart(6, '0')}`,
        align: 'center',
      },
    ).setOrigin(0.5).setDepth(210);
    this.resultUi.push(scoreText);

    if (isDeath) {
      this.slickComm.setPinnedLayout(deathCommY, 212);
      this.regentComm.setPinnedLayout(deathCommY, 212);
    } else {
      this.slickComm.resetLayout();
      this.regentComm.resetLayout();
    }

    const retryText = this.add.text(centerX, panelBottom - 68, 'TAP TO RETRY', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: `#${COLORS.GATE.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(210);
    this.resultUi.push(retryText);

    this.tweens.add({
      targets: retryText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    const menuText = this.add.text(centerX, panelBottom - 30, 'MENU', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(210).setInteractive({ useHandCursor: true });
    menuText.on('pointerdown', (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      if (this.resultInputLocked) return;
      this.scene.start(SCENE_KEYS.MENU);
    });
    this.resultUi.push(menuText);
  }

  private clearResultUi(): void {
    for (const obj of this.resultUi) {
      obj.destroy();
    }
    this.resultUi = [];
  }

  private createPauseButton(): void {
    const layout = getLayout();
    const buttonWidth = 44;
    const buttonHeight = 28;
    const buttonX = layout.gameWidth - 16 - buttonWidth / 2;
    const buttonY = 42;

    this.pauseButtonBg = this.add.graphics().setDepth(230);
    this.pauseButtonText = this.add.text(buttonX, buttonY, '||', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(231);

    this.pauseButtonHit = this.add.zone(
      buttonX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
    ).setOrigin(0, 0).setDepth(232).setInteractive({ useHandCursor: true });
    this.pauseButtonHit.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.togglePause();
      },
    );
  }

  private createBombButton(): void {
    const layout = getLayout();
    const buttonWidth = 64;
    const buttonHeight = 28;
    const buttonX = layout.gameWidth - 16 - buttonWidth / 2;
    const buttonY = layout.gameHeight - 42;

    this.bombButtonBg = this.add.graphics().setDepth(230);
    this.bombButtonText = this.add.text(buttonX, buttonY, 'BOMB', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ff8800',
      align: 'center',
    }).setOrigin(0.5).setDepth(231);

    this.bombButtonHit = this.add.zone(
      buttonX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
    ).setOrigin(0, 0).setDepth(232).setInteractive({ useHandCursor: true });
    this.bombButtonHit.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.detonateBomb();
      },
    );

    this.refreshBombButton();
  }

  private refreshBombButton(): void {
    const layout = getLayout();
    const buttonWidth = 64;
    const buttonHeight = 28;
    const buttonX = layout.gameWidth - 16 - buttonWidth / 2;
    const buttonY = layout.gameHeight - 42;
    const visible = this.playerHasBomb && (
      this.state === GameState.PLAYING || this.state === GameState.COUNTDOWN
    );

    this.bombButtonBg.clear();
    if (visible) {
      this.bombButtonBg.fillStyle(0x331100, 0.88);
      this.bombButtonBg.lineStyle(1.25, 0xff8800, 0.7);
      this.bombButtonBg.fillRoundedRect(
        buttonX - buttonWidth / 2, buttonY - buttonHeight / 2,
        buttonWidth, buttonHeight, 8,
      );
      this.bombButtonBg.strokeRoundedRect(
        buttonX - buttonWidth / 2, buttonY - buttonHeight / 2,
        buttonWidth, buttonHeight, 8,
      );
    }

    this.bombButtonBg.setVisible(visible);
    this.bombButtonText.setVisible(visible).setPosition(buttonX, buttonY);
    this.bombButtonHit.setVisible(visible)
      .setPosition(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2)
      .setSize(buttonWidth, buttonHeight);
    if (this.bombButtonHit.input) {
      this.bombButtonHit.input.enabled = visible;
    }
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

  private detonateBomb(): void {
    if (!this.playerHasBomb) return;
    if (this.state !== GameState.PLAYING && this.state !== GameState.COUNTDOWN) return;

    this.playerHasBomb = false;
    this.refreshBombButton();
    this.boardWipe();
  }

  // --- Debug spawn helpers ---

  private debugCenterOffset(): { x: number; y: number } {
    const layout = getLayout();
    const cx = layout.arenaLeft + layout.arenaWidth / 2;
    const cy = layout.arenaTop + layout.arenaHeight / 2;
    return {
      x: cx + Phaser.Math.Between(-60, 60),
      y: cy + Phaser.Math.Between(-60, 60),
    };
  }

  private debugSpawnShield(): void {
    const { x, y } = this.debugCenterOffset();
    this.shields.push(new ShieldPickup(this, x, y));
  }

  private debugSpawnBonus(): void {
    const { x, y } = this.debugCenterOffset();
    this.bonusPickups.push(new BonusPickup(this, x, y, 100, 0, 0, 0));
  }

  private debugSpawnBomb(): void {
    const { x, y } = this.debugCenterOffset();
    this.bombPickups.push(new BombPickup(this, x, y));
  }

  private debugSpawnSalvage(isRare: boolean): void {
    const layout = getLayout();
    const cx = layout.arenaLeft + layout.arenaWidth / 2 + Phaser.Math.Between(-40, 40);
    const cy = layout.arenaTop + layout.arenaHeight / 2 + Phaser.Math.Between(-40, 40);
    const debris = SalvageDebris.createAt(this, cx, cy, 0, 0);
    if (isRare) {
      (debris as unknown as { isRare: boolean }).isRare = true;
    }
    this.debrisList.push(debris);
    this.salvageSystem.addDebris(debris);
  }

  private debugSpawnAsteroid(scale: number, isMineable: boolean): void {
    const layout = getLayout();
    const cx = layout.arenaLeft + layout.arenaWidth / 2;
    const cy = layout.arenaTop + layout.arenaHeight / 2;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const speed = 30;
    const drifter = DrifterHazard.createFragment(
      this,
      cx + Phaser.Math.Between(-40, 40),
      cy + Phaser.Math.Between(-40, 40),
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      scale,
      isMineable,
    );
    this.difficultySystem.getDrifters().push(drifter);
  }

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
    const panelTop = layout.gameHeight * 0.08;
    const panelHeight = layout.gameHeight * 0.84;

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
      fontFamily: 'monospace',
      fontSize: '34px',
      color: `#${COLORS.GATE.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(221);
    this.pauseUi.push(title);

    const subtitle = this.add.text(centerX, panelTop + 72, 'RUN AT CRAWL // DANGER LIVE', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setAlpha(0.8);
    this.pauseUi.push(subtitle);

    const resumeText = this.add.text(centerX, panelTop + 116, 'RESUME', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: `#${COLORS.GATE.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setInteractive({ useHandCursor: true });
    resumeText.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.resumeGame();
      },
    );
    this.pauseUi.push(resumeText);

    const abandonText = this.add.text(centerX, panelTop + 158, 'ABANDON RUN', {
      fontFamily: 'monospace',
      fontSize: '18px',
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

    const abandonHint = this.add.text(centerX, panelTop + 184, 'RETURN TO MENU WITHOUT BANKING', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setAlpha(0.65);
    this.pauseUi.push(abandonHint);

    // Settings section
    const settingsY = panelTop + 230;
    const divider = this.add.graphics().setDepth(221);
    divider.lineStyle(1, COLORS.HUD, 0.2);
    divider.lineBetween(centerX - 100, settingsY - 16, centerX + 100, settingsY - 16);
    this.pauseUi.push(divider);

    const settingsTitle = this.add.text(centerX, settingsY, 'SETTINGS', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setAlpha(0.7);
    this.pauseUi.push(settingsTitle);

    const settings = getSettings();
    const hudColor = `#${COLORS.HUD.toString(16).padStart(6, '0')}`;
    const gateColor = `#${COLORS.GATE.toString(16).padStart(6, '0')}`;

    // Screen shake toggle
    const shakeText = this.add.text(centerX, settingsY + 34, `SCREEN SHAKE: ${settings.screenShake ? 'ON' : 'OFF'}`, {
      fontFamily: 'monospace',
      fontSize: '14px',
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
      fontFamily: 'monospace',
      fontSize: '14px',
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

    // Debug spawn section
    const debugY = settingsY + 110;
    const debugDivider = this.add.graphics().setDepth(221);
    debugDivider.lineStyle(1, COLORS.HUD, 0.2);
    debugDivider.lineBetween(centerX - 100, debugY - 16, centerX + 100, debugY - 16);
    this.pauseUi.push(debugDivider);

    const debugTitle = this.add.text(centerX, debugY, 'DEBUG SPAWN', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ff8800',
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setAlpha(0.7);
    this.pauseUi.push(debugTitle);

    const debugBtnStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ff8800',
      align: 'center',
      backgroundColor: '#331100',
      padding: { x: 6, y: 4 },
    };

    const debugButtons: { label: string; action: () => void }[] = [
      { label: 'SHIELD', action: () => this.debugSpawnShield() },
      { label: 'POINTS', action: () => this.debugSpawnBonus() },
      { label: 'BOMB', action: () => this.debugSpawnBomb() },
      { label: 'SALVAGE', action: () => this.debugSpawnSalvage(false) },
      { label: 'RARE SALVAGE', action: () => this.debugSpawnSalvage(true) },
      { label: 'ASTEROID SM', action: () => this.debugSpawnAsteroid(0.5, false) },
      { label: 'ASTEROID LG', action: () => this.debugSpawnAsteroid(1.5, false) },
      { label: 'MINEABLE AST', action: () => this.debugSpawnAsteroid(1.0, true) },
    ];

    const cols = 2;
    const colWidth = (layout.gameWidth - 80) / cols;
    const rowHeight = 30;
    const gridLeft = 40 + colWidth / 2;

    for (let i = 0; i < debugButtons.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx = gridLeft + col * colWidth;
      const by = debugY + 30 + row * rowHeight;
      const btn = this.add.text(bx, by, debugButtons[i].label, debugBtnStyle)
        .setOrigin(0.5).setDepth(221).setInteractive({ useHandCursor: true });
      const action = debugButtons[i].action;
      btn.on(
        'pointerdown',
        (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
          event.stopPropagation();
          action();
        },
      );
      this.pauseUi.push(btn);
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
    const buttonWidth = 44;
    const buttonHeight = 28;
    const buttonX = layout.gameWidth - 16 - buttonWidth / 2;
    const buttonY = 42;
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
      .setText(paused ? 'RESUME' : '||')
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
    this.scene.start(SCENE_KEYS.GAME, {
      retryFromDeath: this.resultData?.cause === 'death',
    } satisfies MenuHandoff);
  }
}
