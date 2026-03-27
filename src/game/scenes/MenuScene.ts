import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT, COLORS } from '../constants';
import { SaveSystem } from '../systems/SaveSystem';
import { fetchLeaderboard, type LeaderboardEntry } from '../services/LeaderboardService';
import { SalvageDebris } from '../entities/SalvageDebris';
import { DrifterHazard } from '../entities/DrifterHazard';
import { HologramOverlay } from '../ui/HologramOverlay';
import { DRIFTER_SPEED_BASE } from '../data/tuning';
import { pickAsteroidSize } from '../data/phaseConfig';

type Period = 'daily' | 'weekly';

// Background simulation constants (phase 1 feel)
const BG_MAX_DEBRIS = 2;
const BG_MAX_DRIFTERS = 5;
const BG_DRIFTER_SPAWN_MS = 800;
const BG_DEBRIS_SPAWN_MS = 2000;

export class MenuScene extends Phaser.Scene {
  private leaderboardTexts: Phaser.GameObjects.Text[] = [];
  private dailyTab!: Phaser.GameObjects.Text;
  private weeklyTab!: Phaser.GameObjects.Text;
  private activePeriod: Period = 'daily';
  private statusText!: Phaser.GameObjects.Text;

  // Background simulation
  private bgDebris: SalvageDebris[] = [];
  private bgDrifters: DrifterHazard[] = [];
  private hologramOverlay!: HologramOverlay;
  private drifterTimer = 0;
  private debrisTimer = 0;

  constructor() {
    super(SCENE_KEYS.MENU);
  }

  create(): void {
    const centerX = GAME_WIDTH / 2;
    const save = new SaveSystem();
    const best = save.getBestScore();
    const playerName = save.getPlayerName();

    // === Background layer (depth -1 to 5) ===

    // Starfield
    const starfield = this.add.graphics().setDepth(-1);
    for (let i = 0; i < 120; i++) {
      const sx = Phaser.Math.Between(0, GAME_WIDTH);
      const sy = Phaser.Math.Between(0, GAME_HEIGHT);
      const brightness = Phaser.Math.FloatBetween(0.1, 0.4);
      const size = Phaser.Math.FloatBetween(0.5, 1.2);
      const starColor = Math.random() < 0.6 ? COLORS.PLAYER : 0xffffff;
      starfield.fillStyle(starColor, brightness);
      starfield.fillCircle(sx, sy, size);
    }

    // Seed initial background entities
    for (let i = 0; i < BG_MAX_DEBRIS; i++) {
      this.bgDebris.push(new SalvageDebris(this));
    }
    for (let i = 0; i < 3; i++) {
      const sizeScale = pickAsteroidSize(1);
      const speed = DRIFTER_SPEED_BASE * (1 / Math.sqrt(sizeScale));
      this.bgDrifters.push(new DrifterHazard(this, speed, sizeScale));
    }

    // === UI layer (depth 10+) ===
    const uiDepth = 10;

    // Semi-transparent backing so text is readable over the simulation
    const backing = this.add.graphics().setDepth(uiDepth);
    backing.fillStyle(COLORS.BG, 0.7);
    backing.fillRoundedRect(20, GAME_HEIGHT * 0.06, GAME_WIDTH - 40, GAME_HEIGHT * 0.88, 12);

    // Title block
    this.add.text(centerX, GAME_HEIGHT * 0.12, "SLICK'S", {
      fontFamily: 'monospace',
      fontSize: '40px',
      color: `#${COLORS.PLAYER.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(uiDepth);

    this.add.text(centerX, GAME_HEIGHT * 0.19, 'SALVAGE & MINING', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(uiDepth);

    this.add.text(centerX, GAME_HEIGHT * 0.24, 'OPERATION TRAINING MODULE', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(uiDepth);

    // Player name and best score
    this.add.text(centerX, GAME_HEIGHT * 0.30, `PILOT: ${playerName}`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(uiDepth);

    if (best > 0) {
      this.add.text(centerX, GAME_HEIGHT * 0.34, `BEST: ${Math.floor(best)}`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
        align: 'center',
      }).setOrigin(0.5).setDepth(uiDepth);
    }

    // Leaderboard section
    const lbTop = GAME_HEIGHT * 0.40;
    const tabY = lbTop;
    const hudColor = `#${COLORS.HUD.toString(16).padStart(6, '0')}`;
    const gateColor = `#${COLORS.GATE.toString(16).padStart(6, '0')}`;

    this.dailyTab = this.add.text(centerX - 60, tabY, 'DAILY', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: gateColor,
      align: 'center',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(uiDepth);

    this.weeklyTab = this.add.text(centerX + 60, tabY, 'WEEKLY', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: hudColor,
      align: 'center',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(uiDepth);

    this.dailyTab.on('pointerdown', (e: Phaser.Input.Pointer) => {
      e.event.stopPropagation();
      if (this.activePeriod !== 'daily') {
        this.activePeriod = 'daily';
        this.updateTabStyles();
        this.loadLeaderboard();
      }
    });

    this.weeklyTab.on('pointerdown', (e: Phaser.Input.Pointer) => {
      e.event.stopPropagation();
      if (this.activePeriod !== 'weekly') {
        this.activePeriod = 'weekly';
        this.updateTabStyles();
        this.loadLeaderboard();
      }
    });

    // Divider line under tabs
    const divider = this.add.graphics().setDepth(uiDepth);
    divider.lineStyle(1, COLORS.HUD, 0.3);
    divider.lineBetween(centerX - 120, tabY + 14, centerX + 120, tabY + 14);

    // Status text (loading / offline)
    this.statusText = this.add.text(centerX, GAME_HEIGHT * 0.55, 'LOADING...', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: hudColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(uiDepth);

    // How to play
    this.add.text(centerX, GAME_HEIGHT * 0.78, [
      'COLLECT SALVAGE FOR CREDITS',
      'DODGE ASTEROIDS & HAZARDS',
      'EXTRACT AT THE GATE TO BANK',
    ].join('\n'), {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: hudColor,
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5).setDepth(uiDepth);

    // TAP TO START
    const tapText = this.add.text(centerX, GAME_HEIGHT * 0.88, 'TAP TO START', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: gateColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(uiDepth);

    this.tweens.add({
      targets: tapText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Hologram overlay on top of everything
    this.hologramOverlay = new HologramOverlay(this);

    // Start game on tap (ignore tab taps)
    this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer, targets: Phaser.GameObjects.GameObject[]) => {
      if (targets.length === 0) {
        // Snapshot background entity state for seamless handoff
        const drifterState = this.bgDrifters
          .filter(d => d.active)
          .map(d => ({ x: d.x, y: d.y, vx: d.vx, vy: d.vy, radiusScale: d.radiusScale }));
        const debrisState = this.bgDebris
          .filter(d => d.active)
          .map(d => ({ x: d.x, y: d.y, vx: d.driftVx, vy: d.driftVy }));
        this.cleanupBackground();
        this.scene.start(SCENE_KEYS.GAME, { drifterState, debrisState });
      }
    });

    // Load initial leaderboard
    this.loadLeaderboard();
  }

  update(_time: number, delta: number): void {
    // Update background debris
    for (let i = this.bgDebris.length - 1; i >= 0; i--) {
      this.bgDebris[i].update(delta);
      if (!this.bgDebris[i].active) {
        this.bgDebris[i].destroy();
        this.bgDebris.splice(i, 1);
      }
    }

    // Update background drifters
    for (let i = this.bgDrifters.length - 1; i >= 0; i--) {
      this.bgDrifters[i].update(delta);
      if (!this.bgDrifters[i].active) {
        this.bgDrifters[i].destroy();
        this.bgDrifters.splice(i, 1);
      }
    }

    // Spawn replacement debris
    this.debrisTimer += delta;
    if (this.debrisTimer >= BG_DEBRIS_SPAWN_MS && this.bgDebris.length < BG_MAX_DEBRIS) {
      this.bgDebris.push(new SalvageDebris(this));
      this.debrisTimer = 0;
    }

    // Spawn replacement drifters
    this.drifterTimer += delta;
    if (this.drifterTimer >= BG_DRIFTER_SPAWN_MS && this.bgDrifters.length < BG_MAX_DRIFTERS) {
      const sizeScale = pickAsteroidSize(1);
      const speed = DRIFTER_SPEED_BASE * (1 / Math.sqrt(sizeScale));
      this.bgDrifters.push(new DrifterHazard(this, speed, sizeScale));
      this.drifterTimer = 0;
    }

    // Hologram flicker
    this.hologramOverlay.update(delta);
  }

  private cleanupBackground(): void {
    for (const d of this.bgDebris) d.destroy();
    this.bgDebris = [];
    for (const d of this.bgDrifters) d.destroy();
    this.bgDrifters = [];
    this.hologramOverlay.destroy();
  }

  private updateTabStyles(): void {
    const active = `#${COLORS.GATE.toString(16).padStart(6, '0')}`;
    const inactive = `#${COLORS.HUD.toString(16).padStart(6, '0')}`;
    this.dailyTab.setColor(this.activePeriod === 'daily' ? active : inactive);
    this.weeklyTab.setColor(this.activePeriod === 'weekly' ? active : inactive);
  }

  private loadLeaderboard(): void {
    // Clear existing entries
    for (const t of this.leaderboardTexts) t.destroy();
    this.leaderboardTexts = [];
    this.statusText.setText('LOADING...').setVisible(true);

    fetchLeaderboard(this.activePeriod, 10).then((entries) => {
      // Scene may have been left while loading
      if (!this.scene.isActive()) return;

      this.statusText.setVisible(false);
      this.renderLeaderboard(entries);
    }).catch(() => {
      if (!this.scene.isActive()) return;
      this.statusText.setText('OFFLINE').setVisible(true);
    });
  }

  private renderLeaderboard(entries: LeaderboardEntry[]): void {
    const centerX = GAME_WIDTH / 2;
    const startY = GAME_HEIGHT * 0.45;
    const rowHeight = 22;
    const hudColor = `#${COLORS.HUD.toString(16).padStart(6, '0')}`;
    const salvageColor = `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`;
    const uiDepth = 10;

    if (entries.length === 0) {
      this.statusText.setText('NO SCORES YET').setVisible(true);
      return;
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const y = startY + i * rowHeight;
      const rank = `${i + 1}.`.padEnd(4);
      const name = entry.player_name.padEnd(9);
      const score = String(Math.floor(entry.score));
      const line = `${rank}${name}${score}`;

      const text = this.add.text(centerX, y, line, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: i < 3 ? salvageColor : hudColor,
        align: 'center',
      }).setOrigin(0.5).setDepth(uiDepth);

      this.leaderboardTexts.push(text);
    }
  }
}
