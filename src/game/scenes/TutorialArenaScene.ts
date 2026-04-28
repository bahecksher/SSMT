import Phaser from 'phaser';
import {
  applyColorPalette,
  COLORS,
  getPaletteColors,
  SCENE_KEYS,
  TITLE_FONT,
  UI_FONT,
  readableFontSize,
} from '../constants';
import { getLayout, isNarrowViewport, isShortViewport, setLayoutSize } from '../layout';
import { getSettings } from '../systems/SettingsSystem';
import { playSfx, playUiSelectSfx } from '../systems/SfxSystem';
import { HologramOverlay } from '../ui/HologramOverlay';
import { CustomCursor } from '../ui/CustomCursor';
import { Overlays } from '../ui/Overlays';
import { GeoSphere } from '../entities/GeoSphere';
import { Player } from '../entities/Player';
import { SalvageDebris } from '../entities/SalvageDebris';
import { DrifterHazard } from '../entities/DrifterHazard';
import { ShieldPickup } from '../entities/ShieldPickup';
import type { NPCShip } from '../entities/NPCShip';
import { EnemyShip } from '../entities/EnemyShip';
import { ExitGate } from '../entities/ExitGate';
import { InputSystem } from '../systems/InputSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { SalvageSystem } from '../systems/SalvageSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import {
  EXIT_GATE_HITBOX,
  EXIT_GATE_DURATION,
  NPC_BUMP_RADIUS,
  PLAYER_RADIUS,
} from '../data/tuning';
import { SlickComm } from '../ui/SlickComm';
import { getSlickLine, type SlickLineKey } from '../data/slickLines';

type SectionId = 'move' | 'score' | 'danger' | 'shield' | 'extract';

type SceneButton = {
  bg: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  hit: Phaser.GameObjects.Zone;
  width: number;
  height: number;
};

type OverlayUi = {
  bg: Phaser.GameObjects.Graphics;
  title: Phaser.GameObjects.Text;
  body: Phaser.GameObjects.Text;
  back: SceneButton;
};

const SECTIONS: SectionId[] = ['move', 'score', 'danger', 'shield', 'extract'];

const STARFIELD_OVERSCAN = 96;
const STARFIELD_COUNT = 170;

const NUDGE_DELAY_MS = 3500;
const ADVANCE_DELAY_MS = 1100;
const RESET_DELAY_MS = 900;

const MOVE_MIN_DISTANCE = 240;
const MOVE_MIN_TIME_MS = 4000;

const SCORE_MIN_CARRY = 30;
const SCORE_MIN_TIME_MS = 1500;

const DANGER_SURVIVE_MS = 7500;
const SHIELD_RESPAWN_CAP = 2;
const SHIELD_LOSS_TRIGGER = 2;
const SHIELD_TIMEOUT_MS = 10000;

const EXTRACT_PRELOAD = 60;
const EXTRACT_PREVIEW_MS = 2200;
const EXTRACT_DURATION_MS = 60000;

// Match the live-game entry cadence, but without rendering countdown text.
const ENTRY_WARP_MS = 4000;

const SECTION_COPY: Record<SectionId, { title: string; objective: string }> = {
  move: {
    title: 'MOVE',
    objective: 'MOVE THE SHIP',
  },
  score: {
    title: 'SCORE',
    objective: 'TOUCH BOTH CREDIT RINGS',
  },
  danger: {
    title: 'DANGERS',
    objective: 'SURVIVE THE HAZARD WINDOW',
  },
  shield: {
    title: 'SHIELDS',
    objective: 'SPEND TWO SHIELDS ON IMPACT',
  },
  extract: {
    title: 'EXTRACT',
    objective: 'BANK THE CARRY AT THE GATE',
  },
};

interface StarfieldStar {
  x: number;
  y: number;
  alpha: number;
  size: number;
  color: number;
}

export class TutorialArenaScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private scoreSystem!: ScoreSystem;
  private salvageSystem!: SalvageSystem;
  private collisionSystem!: CollisionSystem;
  private player!: Player;
  private geoSphere!: GeoSphere;
  private hologramOverlay!: HologramOverlay;
  private cursor!: CustomCursor;
  private arenaBorder!: Phaser.GameObjects.Graphics;
  private creditsText!: Phaser.GameObjects.Text;
  private shieldText!: Phaser.GameObjects.Text;
  private sectionText!: Phaser.GameObjects.Text;
  private objectiveText!: Phaser.GameObjects.Text;
  private backButton!: SceneButton;
  private overlayUi: OverlayUi | null = null;
  private starfield!: Phaser.GameObjects.Graphics;
  private starfieldStars: StarfieldStar[] = [];
  private slickComm!: SlickComm;

  private debrisList: SalvageDebris[] = [];
  private drifters: DrifterHazard[] = [];
  private shields: ShieldPickup[] = [];
  private npcs: NPCShip[] = [];
  private enemies: EnemyShip[] = [];
  private gate: ExitGate | null = null;

  private sectionIndex = 0;
  private sectionLocked = false;
  private tutorialComplete = false;
  private sectionTime = 0;
  private nudgeFired = false;
  private movementDistance = 0;
  private lastPlayerX = 0;
  private lastPlayerY = 0;

  // SCORE state
  private salvageTouched = false;
  private miningTouched = false;
  private scoreReadyTime = 0;

  // SHIELD state — count of shield losses this section. Auto-advance at SHIELD_LOSS_TRIGGER or SHIELD_TIMEOUT_MS.
  private shieldLossCount = 0;

  // EXTRACT state
  private extractLiveAnnounced = false;

  private entryWarpActive = false;
  private entryWarpTimer = 0;

  // Respawn-fallback timer (ms)
  private respawnCheckTimer = 0;
  private playerSoftDown = false;

  // SHIELD section: how many extra shields the fallback has spawned (cap = SHIELD_RESPAWN_CAP).
  private shieldRespawnCount = 0;

  constructor() {
    super(SCENE_KEYS.TUTORIAL_ARENA);
  }

  create(): void {
    this.events.once('shutdown', this.cleanup, this);
    setLayoutSize(this.scale.width, this.scale.height);
    applyColorPalette(getSettings().paletteId);
    // Tutorial-only environmental green wash: keeps interactable colors (player, salvage,
    // hazards, asteroid, enemy, gate, npc, shield, bomb, beam) on the user's chosen palette
    // so the lessons taught here read identically to live runs.
    const greenEnv = getPaletteColors('green');
    COLORS.STARFIELD_BG = greenEnv.STARFIELD_BG;
    COLORS.BG = greenEnv.BG;
    COLORS.ARENA_BORDER = greenEnv.ARENA_BORDER;
    COLORS.GRID = greenEnv.GRID;
    COLORS.GLOBE = greenEnv.GLOBE;
    COLORS.HUD = greenEnv.HUD;

    const layout = getLayout();
    const compact = isNarrowViewport(layout) || isShortViewport(layout);
    const topInset = compact ? 18 : 22;
    const buttonY = topInset + (compact ? 14 : 16);
    const buttonWidth = compact ? 86 : 110;

    this.starfield = this.add.graphics().setDepth(-1);
    this.starfieldStars = [];
    for (let i = 0; i < STARFIELD_COUNT; i += 1) {
      this.starfieldStars.push({
        x: Phaser.Math.Between(-STARFIELD_OVERSCAN, layout.gameWidth + STARFIELD_OVERSCAN),
        y: Phaser.Math.Between(-STARFIELD_OVERSCAN, layout.gameHeight + STARFIELD_OVERSCAN),
        alpha: Phaser.Math.FloatBetween(0.1, 0.4),
        size: Phaser.Math.FloatBetween(0.5, 1.2),
        color: Math.random() < 0.6 ? COLORS.PLAYER : 0xffffff,
      });
    }
    this.drawStarfield();

    this.geoSphere = new GeoSphere(this);

    this.arenaBorder = this.add.graphics().setDepth(0);
    this.redrawArenaBorder();

    this.hologramOverlay = new HologramOverlay(this);
    this.cursor = new CustomCursor(this);

    // HUD-styled credits + shield indicator (matches live-game placement / typography).
    const scoreLeftX = compact ? 12 : 16;
    const topMargin = compact ? 12 : 16;
    const scoreFontSize = compact ? 13 : 16;
    const shieldFontSize = compact ? 11 : 14;
    this.creditsText = this.add.text(scoreLeftX, topMargin, 'CREDITS 0', {
      fontFamily: TITLE_FONT,
      fontSize: readableFontSize(scoreFontSize),
      color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
    }).setDepth(100);
    this.shieldText = this.add.text(scoreLeftX, topMargin + (compact ? 18 : 24), '', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(shieldFontSize),
      color: `#${COLORS.SHIELD.toString(16).padStart(6, '0')}`,
    }).setDepth(100);
    this.sectionText = this.add.text(layout.centerX, compact ? 14 : 18, '', {
      fontFamily: TITLE_FONT,
      fontSize: readableFontSize(compact ? 12 : 14),
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(100);
    this.objectiveText = this.add.text(layout.centerX, compact ? 30 : 36, '', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(compact ? 10 : 11),
      color: `#${COLORS.GATE.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(100).setAlpha(0.9);

    // Only a BACK button in-world — RESET STEP collapsed onto the R key for cleaner chrome.
    this.backButton = this.createButton(
      layout.gameWidth - 28 - buttonWidth / 2,
      buttonY,
      buttonWidth,
      compact ? 28 : 32,
      'BACK',
      () => {
        playUiSelectSfx(this);
        this.scene.start(SCENE_KEYS.MENU);
      },
    );

    const spawnX = layout.arenaLeft + layout.arenaWidth / 2;
    const spawnY = layout.arenaTop + layout.arenaHeight * 0.75;
    this.player = new Player(this, spawnX, spawnY);
    this.inputSystem = new InputSystem(this);
    this.scoreSystem = new ScoreSystem();
    this.salvageSystem = new SalvageSystem(this, this.player, this.scoreSystem);
    this.collisionSystem = new CollisionSystem(this.player);

    this.slickComm = new SlickComm(this, { width: Math.min(layout.gameWidth - 40, 420), autoHideMs: 5500 });
    this.slickComm.setBottomPinnedLayout(8, 200);

    this.startEntryWarp(spawnX, spawnY);

    this.input.keyboard?.on('keydown-ESC', () => {
      playUiSelectSfx(this);
      this.scene.start(SCENE_KEYS.MENU);
    });
    this.input.keyboard?.on('keydown-R', () => {
      playUiSelectSfx(this);
      this.requestHardRestart();
    });
  }

  update(_time: number, delta: number): void {
    this.geoSphere.update(delta);
    this.hologramOverlay.update(delta);
    this.cursor.update(this);
    this.updateScoreReadout();

    if (this.entryWarpActive) {
      this.entryWarpTimer = Math.max(0, this.entryWarpTimer - delta);
      if (this.entryWarpTimer <= 0) {
        this.entryWarpActive = false;
        playSfx(this, 'bomb');
        Overlays.bombFlash(this);
        this.enterSection(0);
      }
    }

    // World keeps simulating even during section advance / reset locks so the
    // player doesn't see the arena freeze for 1+ seconds at every transition.
    // Player input is frozen only during death visuals or after tutorial completion.
    const worldFrozen = this.tutorialComplete && !!this.overlayUi;
    const playerFrozen = this.entryWarpActive || this.playerSoftDown || this.tutorialComplete;

    if (!worldFrozen) {
      if (!this.entryWarpActive && !this.sectionLocked && !this.tutorialComplete) {
        this.sectionTime += delta;
      }

      if (!playerFrozen) {
        this.inputSystem.update();
        this.player.update(delta, this.inputSystem.getTarget(), this.inputSystem.getSwipe());

        const moveDelta = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.lastPlayerX, this.lastPlayerY);
        this.movementDistance += moveDelta;
      }
      this.lastPlayerX = this.player.x;
      this.lastPlayerY = this.player.y;

      for (let i = this.debrisList.length - 1; i >= 0; i -= 1) {
        const debris = this.debrisList[i];
        debris.update(delta);
        if (!debris.active) {
          this.salvageSystem.removeDebris(debris);
          debris.destroy();
          this.debrisList.splice(i, 1);
        }
      }

      for (let i = this.drifters.length - 1; i >= 0; i -= 1) {
        const drifter = this.drifters[i];
        drifter.update(delta);
        if (!drifter.active) {
          drifter.destroy();
          this.drifters.splice(i, 1);
        }
      }

      this.salvageSystem.update(delta, this.drifters);

      if (!this.sectionLocked && !this.tutorialComplete) {
        if (this.salvageSystem.getLastFrameSalvageIncome() > 0) this.salvageTouched = true;
        if (this.salvageSystem.getLastFrameMiningIncome() > 0) this.miningTouched = true;
      }

      this.updateShields(delta);
      this.updateNpcs(delta);
      this.updateEnemies(delta);
      this.updateGate(delta);
    }

    if (this.entryWarpActive || this.tutorialComplete || this.sectionLocked) {
      return;
    }

    this.handlePlayerNpcCollisions();
    this.handlePlayerHazardCollisions();
    this.processSection(delta);
  }

  // ---------------------------------------------------------------------
  // Section orchestration
  // ---------------------------------------------------------------------

  private startEntryWarp(spawnX: number, spawnY: number): void {
    this.entryWarpActive = true;
    this.entryWarpTimer = ENTRY_WARP_MS;
    this.playerSoftDown = false;
    this.inputSystem.clear();
    this.spawnGate(spawnX, spawnY, ENTRY_WARP_MS, EXIT_GATE_DURATION);
  }

  /** Enter a section without clearing arena state — preserves continuous play across advances. */
  private enterSection(index: number): void {
    this.sectionLocked = false;
    this.sectionIndex = Phaser.Math.Clamp(index, 0, SECTIONS.length - 1);

    this.sectionTime = 0;
    this.nudgeFired = false;
    this.respawnCheckTimer = 0;
    this.movementDistance = 0;
    this.salvageTouched = false;
    this.miningTouched = false;
    this.scoreReadyTime = 0;
    this.shieldLossCount = 0;
    this.shieldRespawnCount = 0;
    this.extractLiveAnnounced = false;

    this.lastPlayerX = this.player.x;
    this.lastPlayerY = this.player.y;

    const sectionId = SECTIONS[this.sectionIndex];
    this.applySectionCopy(sectionId);

    switch (sectionId) {
      case 'move':
        this.speak('tutMove');
        break;
      case 'score':
        this.spawnSalvageFromEdge();
        this.spawnDrifterFromEdge(35, 1.65, true);
        this.speak('tutScore');
        break;
      case 'danger':
        this.player.hasShield = false;
        this.spawnDrifterFromEdge(45, 1.4, false);
        this.spawnEnemy();
        playSfx(this, 'enemyEntrance');
        this.speak('tutDanger');
        break;
      case 'shield':
        this.spawnShieldFromEdge();
        this.spawnDrifterFromEdge(40, 1.55, false);
        this.speak('tutShield');
        break;
      case 'extract': {
        if (this.scoreSystem.getUnbanked() < EXTRACT_PRELOAD) {
          this.scoreSystem.addUnbanked(EXTRACT_PRELOAD - this.scoreSystem.getUnbanked());
        }
        const layout = getLayout();
        this.spawnGate(layout.arenaRight - 74, layout.centerY + 18, EXTRACT_PREVIEW_MS, EXTRACT_DURATION_MS);
        this.speak('tutExtract');
        break;
      }
    }
  }

  /** Hard restart: clear all actors and respawn the player. Used by the RESET STEP button. */
  private hardRestartSection(index: number): void {
    this.clearActors();
    const layout = getLayout();
    const spawnX = layout.arenaLeft + layout.arenaWidth / 2;
    const spawnY = layout.arenaTop + layout.arenaHeight * 0.75;
    this.player.respawn(spawnX, spawnY);
    this.playerSoftDown = false;
    this.enterSection(index);
  }

  private processSection(delta: number): void {
    const sectionId = SECTIONS[this.sectionIndex];

    this.runRespawnFallback(delta);

    if (sectionId === 'move') {
      this.maybeNudge('tutMoveNudge');
      if (this.movementDistance >= MOVE_MIN_DISTANCE && this.sectionTime >= MOVE_MIN_TIME_MS) {
        this.advanceSection('tutMoveDone');
      }
      return;
    }

    if (sectionId === 'score') {
      this.maybeNudge('tutScoreNudge', 5000);
      const bothTouched = this.salvageTouched && this.miningTouched;
      const carryReady = this.scoreSystem.getUnbanked() >= SCORE_MIN_CARRY;
      if (bothTouched && carryReady) {
        this.scoreReadyTime += delta;
        if (this.scoreReadyTime >= SCORE_MIN_TIME_MS) {
          this.advanceSection('tutScoreDone');
        }
      } else {
        this.scoreReadyTime = 0;
      }
      return;
    }

    if (sectionId === 'danger') {
      this.maybeNudge('tutDangerNudge', 4000);
      if (this.sectionTime >= DANGER_SURVIVE_MS) {
        this.advanceSection('tutDangerDone');
      }
      return;
    }

    if (sectionId === 'shield') {
      this.maybeNudge('tutShieldNudge', 4500);
      if (this.shieldLossCount >= SHIELD_LOSS_TRIGGER || this.sectionTime >= SHIELD_TIMEOUT_MS) {
        this.advanceSection('tutShieldDone');
      }
      return;
    }

    if (sectionId === 'extract') {
      if (this.gate?.justBecameExtractable && !this.extractLiveAnnounced) {
        this.extractLiveAnnounced = true;
        this.speak('tutExtractLive');
      }
      if (this.gate && this.gate.active && this.gate.extractable) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.gate.x, this.gate.y);
        if (dist <= EXIT_GATE_HITBOX + PLAYER_RADIUS) {
          this.scoreSystem.bankScore();
          this.finishTutorial();
        }
      }
    }
  }

  private maybeNudge(key: SlickLineKey, after = NUDGE_DELAY_MS): void {
    if (this.nudgeFired) return;
    if (this.sectionTime < after) return;
    this.nudgeFired = true;
    this.speak(key);
  }

  private runRespawnFallback(delta: number): void {
    this.respawnCheckTimer += delta;
    if (this.respawnCheckTimer < 1500) return;
    this.respawnCheckTimer = 0;
    if (this.playerSoftDown) return;

    const layout = getLayout();
    const margin = 80;
    const inArena = (x: number, y: number) =>
      x > layout.arenaLeft - margin && x < layout.arenaRight + margin
      && y > layout.arenaTop - margin && y < layout.arenaBottom + margin;

    const sectionId = SECTIONS[this.sectionIndex];

    if (sectionId === 'score') {
      if (!this.salvageTouched) {
        const has = this.debrisList.some(d => d.active && !d.depleted && inArena(d.x, d.y));
        if (!has) this.spawnSalvageFromEdge();
      }
      if (!this.miningTouched) {
        const has = this.drifters.some(d => d.active && !d.depleted && d.isMineable && inArena(d.x, d.y));
        if (!has) this.spawnDrifterFromEdge(35, 1.65, true);
      }
      return;
    }

    if (sectionId === 'danger') {
      const hasDrifter = this.drifters.some(d => d.active && !d.depleted && !d.isMineable && inArena(d.x, d.y));
      if (!hasDrifter) this.spawnDrifterFromEdge(45, 1.4, false);
      const hasEnemy = this.enemies.some(e => e.active && inArena(e.x, e.y));
      if (!hasEnemy) {
        this.spawnEnemy();
        playSfx(this, 'enemyEntrance');
      }
      return;
    }

    if (sectionId === 'shield') {
      // Keep a shield available if the player has none — capped so they can't farm forever.
      if (!this.player.hasShield) {
        const has = this.shields.some(s => s.active && inArena(s.x, s.y));
        if (!has && this.shieldRespawnCount < SHIELD_RESPAWN_CAP) {
          this.spawnShieldFromEdge();
          this.shieldRespawnCount += 1;
        }
      }
      // Keep a drifter on the board so the player has something to ram while shielded.
      const hasDrifter = this.drifters.some(d => d.active && !d.depleted && !d.isMineable && inArena(d.x, d.y));
      if (!hasDrifter) this.spawnDrifterFromEdge(40, 1.55, false);
    }
  }

  private advanceSection(doneKey: SlickLineKey): void {
    if (this.sectionLocked || this.tutorialComplete) return;
    this.sectionLocked = true;
    this.speak(doneKey);
    this.time.delayedCall(ADVANCE_DELAY_MS, () => {
      if (!this.sys.isActive()) return;
      const nextIndex = this.sectionIndex + 1;
      if (nextIndex >= SECTIONS.length) {
        this.finishTutorial();
        return;
      }
      this.enterSection(nextIndex);
    });
  }

  /** Soft death: visually destroy the player, respawn after a short delay, keep arena state. */
  private softRespawnPlayer(speakKey?: SlickLineKey): void {
    if (this.sectionLocked || this.tutorialComplete || this.playerSoftDown) return;
    this.playerSoftDown = true;
    this.player.setDestroyedVisual(true);
    playSfx(this, 'playerDeath');
    if (speakKey) this.speak(speakKey);
    // Reset section dwell so the player has to redo the time-based portion of the lesson.
    this.sectionTime = 0;
    this.nudgeFired = false;
    this.scoreReadyTime = 0;
    this.time.delayedCall(RESET_DELAY_MS, () => {
      if (!this.sys.isActive()) return;
      const safe = this.findSafeRespawnPoint(getLayout());
      this.player.respawn(safe.x, safe.y);
      this.lastPlayerX = this.player.x;
      this.lastPlayerY = this.player.y;
      this.playerSoftDown = false;
    });
  }

  /** RESET STEP button / R key: clear all actors and respawn the player at the section opener. */
  private requestHardRestart(): void {
    if (this.entryWarpActive || this.sectionLocked || this.tutorialComplete) return;
    this.sectionLocked = true;
    this.player.setDestroyedVisual(true);
    playSfx(this, 'playerDeath');
    this.time.delayedCall(RESET_DELAY_MS, () => {
      if (!this.sys.isActive()) return;
      this.hardRestartSection(this.sectionIndex);
    });
  }

  private findSafeRespawnPoint(layout: ReturnType<typeof getLayout>): { x: number; y: number } {
    const candidates: Array<{ x: number; y: number }> = [
      { x: layout.arenaLeft + layout.arenaWidth / 2, y: layout.arenaTop + layout.arenaHeight * 0.75 },
      { x: layout.arenaLeft + layout.arenaWidth * 0.25, y: layout.arenaTop + layout.arenaHeight * 0.5 },
      { x: layout.arenaLeft + layout.arenaWidth * 0.75, y: layout.arenaTop + layout.arenaHeight * 0.5 },
      { x: layout.arenaLeft + layout.arenaWidth / 2, y: layout.arenaTop + layout.arenaHeight * 0.35 },
    ];
    let best = candidates[0];
    let bestScore = -Infinity;
    for (const c of candidates) {
      let minDist = Infinity;
      for (const e of this.enemies) {
        if (!e.active) continue;
        minDist = Math.min(minDist, Phaser.Math.Distance.Between(c.x, c.y, e.x, e.y));
      }
      for (const d of this.drifters) {
        if (!d.active || d.isMineable) continue;
        minDist = Math.min(minDist, Phaser.Math.Distance.Between(c.x, c.y, d.x, d.y));
      }
      if (minDist > bestScore) {
        bestScore = minDist;
        best = c;
      }
    }
    return best;
  }

  private finishTutorial(): void {
    if (this.tutorialComplete) return;
    this.tutorialComplete = true;
    this.sectionLocked = true;
    this.speak('tutComplete', 9000);
    this.showCompletionOverlay();
  }

  // ---------------------------------------------------------------------
  // Per-entity update loops
  // ---------------------------------------------------------------------

  private updateShields(delta: number): void {
    for (let i = this.shields.length - 1; i >= 0; i -= 1) {
      const shield = this.shields[i];
      shield.update(delta);
      if (!shield.active) {
        shield.destroy();
        this.shields.splice(i, 1);
        continue;
      }

      if (!this.player.hasShield) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, shield.x, shield.y);
        if (dist < PLAYER_RADIUS + shield.radius) {
          this.player.hasShield = true;
          playSfx(this, 'pickup');
          shield.active = false;
          shield.destroy();
          this.shields.splice(i, 1);
        }
      }
    }
  }

  private updateNpcs(delta: number): void {
    for (const npc of this.npcs) {
      if (!npc.active) continue;
      let target: SalvageDebris | null = null;
      let bestDist = Infinity;
      for (const debris of this.debrisList) {
        if (!debris.active || debris.depleted) continue;
        const dist = Phaser.Math.Distance.Between(npc.x, npc.y, debris.x, debris.y);
        if (dist < bestDist) {
          bestDist = dist;
          target = debris;
        }
      }
      if (target) npc.setTarget(target.x, target.y);
      else npc.clearTarget();
    }

    for (let i = this.npcs.length - 1; i >= 0; i -= 1) {
      const npc = this.npcs[i];
      npc.update(delta);
      if (!npc.active) {
        npc.destroy();
        this.npcs.splice(i, 1);
      }
    }

    for (const npc of this.npcs) {
      if (!npc.active || !npc.isSalvaging()) continue;
      for (const debris of this.debrisList) {
        if (!debris.active || debris.depleted) continue;
        const dist = Phaser.Math.Distance.Between(npc.x, npc.y, debris.x, debris.y);
        if (dist < debris.salvageRadius) {
          debris.hp -= delta / 1000;
          if (debris.hp <= 0) {
            debris.hp = 0;
            debris.depleted = true;
          }
        }
      }
    }
  }

  private updateEnemies(delta: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      enemy.update(delta, this.player.x, this.player.y);
      if (!enemy.active) {
        enemy.destroy();
        this.enemies.splice(i, 1);
      }
    }
  }

  private updateGate(delta: number): void {
    if (!this.gate) return;
    this.gate.update(delta);
    if (!this.gate.active) {
      this.gate.destroy();
      this.gate = null;
    }
  }

  // ---------------------------------------------------------------------
  // Collision handling
  // ---------------------------------------------------------------------

  private handlePlayerNpcCollisions(): void {
    for (let i = this.npcs.length - 1; i >= 0; i -= 1) {
      const npc = this.npcs[i];
      if (!npc.active) continue;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (dist >= NPC_BUMP_RADIUS || dist <= 0.1) continue;

      const sectionId = SECTIONS[this.sectionIndex];

      if (this.player.hasShield) {
        this.player.hasShield = false;
        playSfx(this, 'shieldLoss');
        playSfx(this, 'playerDeath');
        this.cameras.main.shake(160, 0.004);
        npc.active = false;
        npc.destroy();
        this.npcs.splice(i, 1);
        if (sectionId === 'shield') this.shieldLossCount += 1;
      } else {
        this.softRespawnPlayer('tutDangerReset');
      }
      return;
    }
  }

  private handlePlayerHazardCollisions(): void {
    const hitDrifter = this.collisionSystem.checkDrifters(this.drifters);
    const hitEnemy = this.collisionSystem.checkEnemies(this.enemies);
    if (!hitDrifter && !hitEnemy) return;

    const sectionId = SECTIONS[this.sectionIndex];

    if (this.player.hasShield) {
      this.player.hasShield = false;
      playSfx(this, 'shieldLoss');
      if (hitDrifter) {
        playSfx(this, 'asteroidCollision');
        this.destroyDrifter(hitDrifter);
      }
      if (hitEnemy) {
        hitEnemy.active = false;
        hitEnemy.destroy();
        this.enemies = this.enemies.filter((enemy) => enemy !== hitEnemy);
      }
      if (sectionId === 'shield') {
        this.shieldLossCount += 1;
        if (this.shieldLossCount === 1) this.speak('tutShieldHit');
      }
      this.cameras.main.shake(140, 0.004);
      return;
    }

    if (hitDrifter) playSfx(this, 'asteroidCollision');
    this.softRespawnPlayer(sectionId === 'danger' || sectionId === 'shield' ? 'tutDangerReset' : undefined);
  }

  private destroyDrifter(drifter: DrifterHazard): void {
    drifter.active = false;
    drifter.destroy();
    this.drifters = this.drifters.filter((entry) => entry !== drifter);
  }

  // ---------------------------------------------------------------------
  // UI / overlay
  // ---------------------------------------------------------------------

  private showCompletionOverlay(): void {
    const layout = getLayout();
    const compact = isNarrowViewport(layout) || isShortViewport(layout);
    const panelWidth = Math.min(layout.gameWidth - 44, compact ? 320 : 380);
    const panelHeight = compact ? 170 : 188;
    const panelLeft = layout.centerX - panelWidth / 2;
    const panelTop = layout.centerY - panelHeight / 2 - (compact ? 20 : 28);

    const bg = this.add.graphics().setDepth(40);
    bg.fillStyle(COLORS.BG, 0.9);
    bg.fillRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 16);
    bg.lineStyle(1.5, COLORS.GATE, 0.42);
    bg.strokeRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 16);

    const title = this.add.text(layout.centerX, panelTop + 28, 'TUTORIAL COMPLETE', {
      fontFamily: TITLE_FONT,
      fontSize: readableFontSize(compact ? 20 : 24),
      color: `#${COLORS.GATE.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(41);

    const body = this.add.text(layout.centerX, panelTop + 70, [
      'MOVE. SCORE. DODGE. SHIELD. EXTRACT.',
      '',
      'NOW GO FLY FOR REAL.',
    ].join('\n'), {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(compact ? 10 : 11),
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
      wordWrap: { width: panelWidth - 36, useAdvancedWrap: true },
    }).setOrigin(0.5, 0).setDepth(41).setAlpha(0.9);

    const back = this.createButton(
      layout.centerX,
      panelTop + panelHeight - (compact ? 26 : 30),
      compact ? 166 : 196,
      compact ? 34 : 38,
      compact ? 'MENU' : 'BACK TO MENU',
      () => {
        playUiSelectSfx(this);
        this.scene.start(SCENE_KEYS.MENU);
      },
      41,
    );

    this.overlayUi = { bg, title, body, back };
  }

  private hideCompletionOverlay(): void {
    if (!this.overlayUi) return;
    this.overlayUi.bg.destroy();
    this.overlayUi.title.destroy();
    this.overlayUi.body.destroy();
    this.destroyButton(this.overlayUi.back);
    this.overlayUi = null;
  }

  private applySectionCopy(sectionId: SectionId): void {
    const copy = SECTION_COPY[sectionId];
    this.sectionText.setText(`STEP ${this.sectionIndex + 1}/${SECTIONS.length} // ${copy.title}`);
    this.objectiveText.setText(copy.objective);
  }

  private updateScoreReadout(): void {
    this.creditsText.setText(`CREDITS ${Math.floor(this.scoreSystem.getUnbanked())}`);
    this.shieldText.setText(`SHIELD ${this.player.hasShield ? 'ON' : 'OFF'}`);
  }

  private speak(key: SlickLineKey, autoHideMs?: number): void {
    this.slickComm.show(getSlickLine(key), autoHideMs);
  }

  // ---------------------------------------------------------------------
  // Spawn helpers
  // ---------------------------------------------------------------------

  private spawnSalvageFromEdge(): void {
    const debris = new SalvageDebris(this);
    this.debrisList.push(debris);
    this.salvageSystem.addDebris(debris);
  }

  private spawnDrifterFromEdge(speed: number, radiusScale: number, isMineable: boolean): void {
    this.drifters.push(new DrifterHazard(this, speed, radiusScale, isMineable));
  }

  private spawnShieldFromEdge(): void {
    const layout = getLayout();
    const margin = 24;
    const speed = Phaser.Math.FloatBetween(40, 65);
    const edge = Phaser.Math.Between(0, 3);
    let x: number;
    let y: number;
    let targetX: number;
    let targetY: number;
    switch (edge) {
      case 0:
        x = Phaser.Math.Between(layout.arenaLeft + 40, layout.arenaRight - 40);
        y = layout.arenaTop - margin;
        targetX = layout.centerX;
        targetY = layout.centerY;
        break;
      case 1:
        x = Phaser.Math.Between(layout.arenaLeft + 40, layout.arenaRight - 40);
        y = layout.arenaBottom + margin;
        targetX = layout.centerX;
        targetY = layout.centerY;
        break;
      case 2:
        x = layout.arenaLeft - margin;
        y = Phaser.Math.Between(layout.arenaTop + 40, layout.arenaBottom - 40);
        targetX = layout.centerX;
        targetY = layout.centerY;
        break;
      default:
        x = layout.arenaRight + margin;
        y = Phaser.Math.Between(layout.arenaTop + 40, layout.arenaBottom - 40);
        targetX = layout.centerX;
        targetY = layout.centerY;
        break;
    }
    const angle = Math.atan2(targetY - y, targetX - x);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    this.shields.push(new ShieldPickup(this, x, y, vx, vy));
  }

  private spawnEnemy(): void {
    this.enemies.push(new EnemyShip(this));
  }

  private spawnGate(x: number, y: number, previewTime: number, extractDuration: number): void {
    this.gate?.destroy();
    this.gate = new ExitGate(this, { x, y }, previewTime, extractDuration);
  }

  private clearActors(recreateSalvageSystem = true): void {
    for (const debris of this.debrisList) debris.destroy();
    for (const drifter of this.drifters) drifter.destroy();
    for (const shield of this.shields) shield.destroy();
    for (const npc of this.npcs) npc.destroy();
    for (const enemy of this.enemies) enemy.destroy();
    this.gate?.destroy();
    this.debrisList = [];
    this.drifters = [];
    this.shields = [];
    this.npcs = [];
    this.enemies = [];
    this.gate = null;
    this.salvageSystem.destroy();
    if (recreateSalvageSystem) {
      this.salvageSystem = new SalvageSystem(this, this.player, this.scoreSystem);
    }
  }

  // ---------------------------------------------------------------------
  // Background + button helpers
  // ---------------------------------------------------------------------

  private drawStarfield(): void {
    const layout = getLayout();
    this.starfield.clear();
    this.starfield.fillStyle(COLORS.STARFIELD_BG, 1);
    this.starfield.fillRect(
      -STARFIELD_OVERSCAN,
      -STARFIELD_OVERSCAN,
      layout.gameWidth + STARFIELD_OVERSCAN * 2,
      layout.gameHeight + STARFIELD_OVERSCAN * 2,
    );
    for (const star of this.starfieldStars) {
      this.starfield.fillStyle(star.color, star.alpha);
      this.starfield.fillCircle(star.x, star.y, star.size);
    }
  }

  private redrawArenaBorder(): void {
    const layout = getLayout();
    this.arenaBorder.clear();
    this.arenaBorder.lineStyle(2, COLORS.ARENA_BORDER, 0.65);
    this.arenaBorder.strokeRect(
      layout.arenaLeft,
      layout.arenaTop,
      layout.arenaWidth,
      layout.arenaHeight,
    );
    this.arenaBorder.lineStyle(1, COLORS.GRID, 0.22);
    this.arenaBorder.strokeRect(
      layout.arenaLeft + 8,
      layout.arenaTop + 8,
      layout.arenaWidth - 16,
      layout.arenaHeight - 16,
    );
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onClick: () => void,
    depth = 30,
  ): SceneButton {
    const bg = this.add.graphics().setDepth(depth);
    const text = this.add.text(x, y, label, {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(11),
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(depth + 1);
    const hit = this.add.zone(x - width / 2, y - height / 2, width, height)
      .setData('cornerRadius', 8)
      .setOrigin(0, 0)
      .setDepth(depth + 2)
      .setInteractive({ useHandCursor: true });

    hit.on('pointerdown', (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      onClick();
    });

    this.drawButton(bg, x, y, width, height);
    return { bg, label: text, hit, width, height };
  }

  private drawButton(bg: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number): void {
    bg.clear();
    bg.fillStyle(COLORS.BG, 0.8);
    bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
    bg.lineStyle(1.2, COLORS.HUD, 0.52);
    bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 8);
    bg.fillStyle(COLORS.HUD, 0.06);
    bg.fillRoundedRect(x - width / 2 + 4, y - height / 2 + 4, width - 8, height - 8, 6);
  }

  private destroyButton(button: SceneButton): void {
    button.bg.destroy();
    button.label.destroy();
    button.hit.destroy();
  }

  private cleanup(): void {
    this.clearActors(false);
    this.hideCompletionOverlay();
    this.inputSystem?.destroy();
    this.collisionSystem?.destroy();
    this.player?.destroy();
    this.geoSphere?.destroy();
    this.hologramOverlay?.destroy();
    this.cursor?.destroy(this);
    this.arenaBorder?.destroy();
    this.creditsText?.destroy();
    this.shieldText?.destroy();
    this.sectionText?.destroy();
    this.objectiveText?.destroy();
    this.slickComm?.destroy();
    this.destroyButton(this.backButton);
    this.starfield?.destroy();
    this.input.keyboard?.removeAllListeners();
  }
}
