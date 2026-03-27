import Phaser from 'phaser';
import {
  SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT,
  ARENA_LEFT, ARENA_TOP, ARENA_RIGHT, ARENA_BOTTOM,
  ARENA_WIDTH, ARENA_HEIGHT,
} from '../constants';
import { GameState } from '../types';
import { SALVAGE_RESPAWN_DELAY, PLAYER_RADIUS, NPC_BUMP_FORCE, NPC_BUMP_RADIUS } from '../data/tuning';
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
import { ShieldPickup } from '../entities/ShieldPickup';
import { ExitGate } from '../entities/ExitGate';
import { Hud } from '../ui/Hud';
import { Overlays } from '../ui/Overlays';
import { HologramOverlay } from '../ui/HologramOverlay';

export class GameScene extends Phaser.Scene {
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
  private hud!: Hud;
  private state: GameState = GameState.PLAYING;
  private debrisRespawnTimer: Phaser.Time.TimerEvent | null = null;
  private rareSalvageTimer = 0;
  private deathFreezeTimer = 0;
  private starfield!: Phaser.GameObjects.Graphics;
  private arenaBorder!: Phaser.GameObjects.Graphics;
  private hologramOverlay!: HologramOverlay;
  private entryGate: ExitGate | null = null;

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  create(): void {
    this.state = GameState.PLAYING;
    this.rareSalvageTimer = 0;

    this.saveSystem = new SaveSystem();
    this.inputSystem = new InputSystem(this);
    this.scoreSystem = new ScoreSystem();
    this.scoreSystem.setBest(this.saveSystem.getBestScore());

    // Starfield background (hologram-tinted)
    this.starfield = this.add.graphics().setDepth(-1);
    for (let i = 0; i < 120; i++) {
      const sx = Phaser.Math.Between(0, GAME_WIDTH);
      const sy = Phaser.Math.Between(0, GAME_HEIGHT);
      const brightness = Phaser.Math.FloatBetween(0.1, 0.4);
      const size = Phaser.Math.FloatBetween(0.5, 1.2);
      // Mix of green-tinted and white stars
      const starColor = Math.random() < 0.6 ? COLORS.PLAYER : 0xffffff;
      this.starfield.fillStyle(starColor, brightness);
      this.starfield.fillCircle(sx, sy, size);
    }

    // Draw arena boundary (hologram style)
    this.arenaBorder = this.add.graphics().setDepth(0);

    // Subtle grid inside arena
    this.arenaBorder.lineStyle(1, COLORS.GRID, 0.04);
    for (let x = ARENA_LEFT + 40; x < ARENA_RIGHT; x += 40) {
      this.arenaBorder.lineBetween(x, ARENA_TOP, x, ARENA_BOTTOM);
    }
    for (let y = ARENA_TOP + 40; y < ARENA_BOTTOM; y += 40) {
      this.arenaBorder.lineBetween(ARENA_LEFT, y, ARENA_RIGHT, y);
    }

    // Arena border
    this.arenaBorder.lineStyle(1, COLORS.HUD, 0.12);
    this.arenaBorder.strokeRect(ARENA_LEFT, ARENA_TOP, ARENA_WIDTH, ARENA_HEIGHT);
    const cm = 12;
    this.arenaBorder.lineStyle(1.5, COLORS.HUD, 0.3);
    for (const [cx, cy] of [[ARENA_LEFT, ARENA_TOP], [ARENA_RIGHT, ARENA_TOP], [ARENA_LEFT, ARENA_BOTTOM], [ARENA_RIGHT, ARENA_BOTTOM]]) {
      const sx = cx === ARENA_LEFT ? 1 : -1;
      const sy = cy === ARENA_TOP ? 1 : -1;
      this.arenaBorder.lineBetween(cx, cy, cx + cm * sx, cy);
      this.arenaBorder.lineBetween(cx, cy, cx, cy + cm * sy);
    }

    // Hologram scanline overlay
    this.hologramOverlay = new HologramOverlay(this);

    const spawnX = ARENA_LEFT + ARENA_WIDTH / 2;
    const spawnY = ARENA_TOP + ARENA_HEIGHT * 0.75;
    this.player = new Player(this, spawnX, spawnY);

    // Entry gate — player appears inside a closing gate
    this.entryGate = new ExitGate(this, { x: spawnX, y: spawnY });

    this.salvageSystem = new SalvageSystem(this, this.player, this.scoreSystem);
    this.collisionSystem = new CollisionSystem(this.player);
    this.extractionSystem = new ExtractionSystem(this);
    this.bankingSystem = new BankingSystem(this.player, this.scoreSystem, this.saveSystem);
    this.difficultySystem = new DifficultySystem(this, 1);

    this.spawnDebris();

    this.hud = new Hud(this);
  }

  update(_time: number, delta: number): void {
    // During death freeze, count down then play red wipe transition
    if (this.state === GameState.DEATH_FREEZE) {
      this.deathFreezeTimer -= delta;
      if (this.deathFreezeTimer <= 0) {
        this.state = GameState.DEAD;
        Overlays.screenWipe(this, 0xff3366, 0.55, () => {
          this.cleanup();
          this.scene.start(SCENE_KEYS.GAME_OVER, { score: 0, cause: 'death' });
        });
      }
      return;
    }

    if (this.state !== GameState.PLAYING) return;

    // Update entry gate (cosmetic only)
    if (this.entryGate) {
      this.entryGate.update(delta);
      if (!this.entryGate.active) {
        this.entryGate.destroy();
        this.entryGate = null;
      }
    }

    this.inputSystem.update();
    const target = this.inputSystem.getTarget();
    const swipe = this.inputSystem.getSwipe();
    this.player.update(delta, target, swipe);

    // Update all debris
    for (let i = this.debrisList.length - 1; i >= 0; i--) {
      const d = this.debrisList[i];
      d.update(delta);
      if (!d.active) {
        this.salvageSystem.removeDebris(d);
        d.destroy();
        this.debrisList.splice(i, 1);
        if (!d.isRare) {
          this.scheduleDebrisRespawn();
        }
      }
    }

    // Ensure at least one normal debris exists or is scheduled
    const hasNormal = this.debrisList.some(d => !d.isRare);
    if (!hasNormal && !this.debrisRespawnTimer) {
      this.scheduleDebrisRespawn();
    }

    // Update shield pickups
    for (let i = this.shields.length - 1; i >= 0; i--) {
      const s = this.shields[i];
      s.update(delta);
      if (!s.active) {
        s.destroy();
        this.shields.splice(i, 1);
        continue;
      }
      // Check pickup collision
      if (!this.player.hasShield) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, s.x, s.y);
        if (dist < PLAYER_RADIUS + s.radius) {
          this.player.hasShield = true;
          s.active = false;
          s.destroy();
          this.shields.splice(i, 1);
        }
      }
    }

    // Track phase before extraction update
    const prevPhase = this.extractionSystem.getPhaseCount();

    // Extraction
    this.extractionSystem.update(delta);

    // Phase advanced — update difficulty
    const currentPhase = this.extractionSystem.getPhaseCount();
    if (currentPhase !== prevPhase) {
      this.difficultySystem.setPhase(currentPhase);
    }

    // Rare salvage spawning (phase 2+)
    if (currentPhase >= 2) {
      this.rareSalvageTimer += delta;
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

      // Find closest active, non-depleted salvage
      let bestDebris: SalvageDebris | null = null;
      let bestDist = Infinity;
      for (const d of this.debrisList) {
        if (!d.active || d.depleted) continue;
        const dist = Phaser.Math.Distance.Between(npc.x, npc.y, d.x, d.y);
        if (dist < bestDist) {
          bestDist = dist;
          bestDebris = d;
        }
      }
      if (bestDebris) {
        npc.setTarget(bestDebris.x, bestDebris.y);
      } else {
        npc.clearTarget();
      }
    }

    // Difficulty system manages hazard spawning + updating
    this.difficultySystem.update(delta, this.player.x, this.player.y);

    // NPC salvage depletion — NPCs drain salvage HP when close
    for (const npc of npcs) {
      if (!npc.active || !npc.isSalvaging()) continue;
      for (const d of this.debrisList) {
        if (!d.active || d.depleted) continue;
        const dist = Phaser.Math.Distance.Between(npc.x, npc.y, d.x, d.y);
        if (dist < d.salvageRadius) {
          d.hp -= delta / 1000;
          if (d.hp <= 0) {
            d.hp = 0;
            d.depleted = true;
          }
        }
      }
    }

    // Player-NPC bump physics — push NPCs away, can't destroy them
    for (const npc of npcs) {
      if (!npc.active) continue;
      const dx = npc.x - this.player.x;
      const dy = npc.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < NPC_BUMP_RADIUS && dist > 0.1) {
        const nx = dx / dist;
        const ny = dy / dist;
        npc.applyImpulse(nx * NPC_BUMP_FORCE, ny * NPC_BUMP_FORCE);
      }
    }

    // Spawn shields from dead NPCs
    const deadNPCs = this.difficultySystem.consumeDeadNPCs();
    for (const pos of deadNPCs) {
      if (this.shields.length < 3) {
        const shield = new ShieldPickup(this, pos.x, pos.y, 0, 0);
        this.shields.push(shield);
      }
    }

    // Check extraction — player can extract any time they enter the active gate
    const activeGate = this.extractionSystem.getGate();
    if (activeGate && this.bankingSystem.checkExtraction(activeGate)) {
      this.handleExtraction();
      return;
    }

    // Check collisions — shield absorbs one hit and destroys/splits the asteroid
    const hitDrifter = this.collisionSystem.checkDrifters(this.difficultySystem.getDrifters());
    const hitBeam = this.collisionSystem.checkBeams(this.difficultySystem.getBeams());
    const hitSalvage = this.collisionSystem.checkSalvage(this.debrisList);
    const hitEnemy = this.collisionSystem.checkEnemies(this.difficultySystem.getEnemies());
    if (hitDrifter || hitBeam || hitSalvage || hitEnemy) {
      if (this.player.hasShield) {
        this.player.hasShield = false;
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
        this.handleDeath();
        return;
      }
    }

    this.salvageSystem.update(delta, this.difficultySystem.getDrifters());

    // Hologram overlay
    this.hologramOverlay.update(delta);

    // HUD
    const timeToGate = this.extractionSystem.getTimeToGate();
    const gateActive = this.extractionSystem.isGateActive();
    let gateText: string;
    if (gateActive) {
      gateText = 'GATE OPEN';
    } else {
      gateText = `GATE: ${Math.ceil(timeToGate / 1000)}s`;
    }

    this.hud.update(
      this.scoreSystem.getUnbanked(),
      this.scoreSystem.getBest(),
      gateText,
      currentPhase,
      this.player.hasShield,
    );
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
      lifetime: 10000,
      pointsMultiplier: 2 + phase * 0.5,
      radiusScale: 0.6,
    });
    this.debrisList.push(debris);
    this.salvageSystem.addDebris(debris);
  }

  private scheduleDebrisRespawn(): void {
    this.debrisRespawnTimer = this.time.delayedCall(SALVAGE_RESPAWN_DELAY, () => {
      if (this.state === GameState.PLAYING) {
        this.spawnDebris();
      }
      this.debrisRespawnTimer = null;
    });
  }

  private handleDeath(): void {
    this.state = GameState.DEATH_FREEZE;
    this.deathFreezeTimer = 250; // brief freeze to see what killed you
  }

  private handleExtraction(): void {
    this.state = GameState.EXTRACTING;
    const score = this.scoreSystem.getBanked();
    Overlays.screenWipe(this, 0x44ff88, 0.5, () => {
      this.cleanup();
      this.scene.start(SCENE_KEYS.GAME_OVER, { score, cause: 'extract' });
    });
  }

  private cleanup(): void {
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
    if (this.debrisRespawnTimer) {
      this.debrisRespawnTimer.destroy();
      this.debrisRespawnTimer = null;
    }
    if (this.entryGate) {
      this.entryGate.destroy();
      this.entryGate = null;
    }
    this.hud.destroy();
    this.hologramOverlay.destroy();
    this.starfield.destroy();
    this.arenaBorder.destroy();
  }
}
