import Phaser from 'phaser';
import { SCENE_KEYS, COLORS } from '../constants';
import { SaveSystem } from '../systems/SaveSystem';
import { fetchLeaderboard, type LeaderboardEntry } from '../services/LeaderboardService';
import { SalvageDebris } from '../entities/SalvageDebris';
import { DrifterHazard } from '../entities/DrifterHazard';
import { NPCShip } from '../entities/NPCShip';
import { GeoSphere } from '../entities/GeoSphere';
import { HologramOverlay } from '../ui/HologramOverlay';
import { SlickComm } from '../ui/SlickComm';
import { DRIFTER_SPEED_BASE } from '../data/tuning';
import { pickAsteroidSize } from '../data/phaseConfig';
import { getSlickLine } from '../data/slickLines';
import { getLayout, setLayoutSize } from '../layout';
import { getSettings, updateSettings, type GameSettings } from '../systems/SettingsSystem';

type Period = 'daily' | 'weekly';
type MenuButton = {
  bg: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  hit: Phaser.GameObjects.Zone;
  width: number;
  height: number;
};

// Background simulation constants (phase 1 feel)
const BG_MAX_DEBRIS = 2;
const BG_MAX_DRIFTERS = 5;
const BG_MAX_NPCS = 2;
const BG_DRIFTER_SPAWN_MS = 800;
const BG_DEBRIS_SPAWN_MS = 2000;
const BG_NPC_SPAWN_MS = 2500;
const MENU_STARFIELD_OVERSCAN = 96;
const MENU_STARFIELD_COUNT = 170;

export class MenuScene extends Phaser.Scene {
  private leaderboardTexts: Phaser.GameObjects.Text[] = [];
  private dailyTabBg!: Phaser.GameObjects.Graphics;
  private dailyTab!: Phaser.GameObjects.Text;
  private dailyTabHit!: Phaser.GameObjects.Zone;
  private weeklyTabBg!: Phaser.GameObjects.Graphics;
  private weeklyTab!: Phaser.GameObjects.Text;
  private weeklyTabHit!: Phaser.GameObjects.Zone;
  private settingsButton!: MenuButton;
  private settingsPanelUi: Array<Phaser.GameObjects.Graphics | Phaser.GameObjects.Text | Phaser.GameObjects.Zone> = [];
  private shakeOnButton!: MenuButton;
  private shakeOffButton!: MenuButton;
  private scanOnButton!: MenuButton;
  private scanOffButton!: MenuButton;
  private settingsOpen = false;
  private activePeriod: Period = 'daily';
  private leaderboardStartY = 0;
  private leaderboardRowHeight = 22;
  private leaderboardTabWidth = 104;
  private leaderboardTabHeight = 30;
  private leaderboardFontSize = '14px';
  private statusText!: Phaser.GameObjects.Text;
  private pilotText!: Phaser.GameObjects.Text;

  // Background simulation
  private bgDebris: SalvageDebris[] = [];
  private bgDrifters: DrifterHazard[] = [];
  private bgNpcs: NPCShip[] = [];
  private geoSphere!: GeoSphere;
  private hologramOverlay!: HologramOverlay;
  private slickComm!: SlickComm;
  private drifterTimer = 0;
  private debrisTimer = 0;
  private npcTimer = 0;

  constructor() {
    super(SCENE_KEYS.MENU);
  }

  create(): void {
    this.events.once('shutdown', this.cleanup, this);
    setLayoutSize(this.scale.width, this.scale.height);
    const layout = getLayout();
    const centerX = layout.centerX;
    const save = new SaveSystem();
    const best = save.getBestScore();
    const playerName = save.getPlayerName();

    // === Background layer (depth -1 to 5) ===

    // Starfield
    const starfield = this.add.graphics().setDepth(-1);
    starfield.fillStyle(0x020806, 1);
    starfield.fillRect(
      -MENU_STARFIELD_OVERSCAN,
      -MENU_STARFIELD_OVERSCAN,
      layout.gameWidth + MENU_STARFIELD_OVERSCAN * 2,
      layout.gameHeight + MENU_STARFIELD_OVERSCAN * 2,
    );
    for (let i = 0; i < MENU_STARFIELD_COUNT; i++) {
      const sx = Phaser.Math.Between(-MENU_STARFIELD_OVERSCAN, layout.gameWidth + MENU_STARFIELD_OVERSCAN);
      const sy = Phaser.Math.Between(-MENU_STARFIELD_OVERSCAN, layout.gameHeight + MENU_STARFIELD_OVERSCAN);
      const brightness = Phaser.Math.FloatBetween(0.1, 0.4);
      const size = Phaser.Math.FloatBetween(0.5, 1.2);
      const starColor = Math.random() < 0.6 ? COLORS.PLAYER : 0xffffff;
      starfield.fillStyle(starColor, brightness);
      starfield.fillCircle(sx, sy, size);
    }

    // Rotating geo-sphere behind entities
    this.geoSphere = new GeoSphere(this);

    // Seed initial background entities
    for (let i = 0; i < BG_MAX_DEBRIS; i++) {
      this.bgDebris.push(new SalvageDebris(this));
    }
    for (let i = 0; i < 3; i++) {
      const sizeScale = pickAsteroidSize(1);
      const speed = DRIFTER_SPEED_BASE * (1 / Math.sqrt(sizeScale));
      this.bgDrifters.push(new DrifterHazard(this, speed, sizeScale));
    }
    for (let i = 0; i < BG_MAX_NPCS; i++) {
      this.bgNpcs.push(new NPCShip(this));
    }

    // === UI layer (depth 10+) ===
    const uiDepth = 10;
    const backingTop = layout.gameHeight * 0.06;
    const compactMenu = layout.gameHeight <= 720 || layout.gameWidth <= 400;
    const veryCompactMenu = layout.gameHeight <= 560 || layout.gameWidth <= 360;
    const titlePrimarySize = veryCompactMenu ? '32px' : compactMenu ? '36px' : '40px';
    const titleSecondarySize = veryCompactMenu ? '20px' : compactMenu ? '22px' : '24px';
    const titleTertiarySize = veryCompactMenu ? '12px' : '14px';
    const metaSize = compactMenu ? '13px' : '14px';
    const hintSize = veryCompactMenu ? '9px' : '10px';
    const bestSize = compactMenu ? '14px' : '16px';
    this.leaderboardTabWidth = veryCompactMenu ? 88 : compactMenu ? 94 : 104;
    this.leaderboardTabHeight = compactMenu ? 28 : 30;
    this.leaderboardRowHeight = veryCompactMenu ? 20 : 22;
    this.leaderboardFontSize = veryCompactMenu ? '13px' : '14px';

    // Semi-transparent backing so text is readable over the simulation
    const backing = this.add.graphics().setDepth(uiDepth);
    backing.fillStyle(COLORS.BG, 0.7);
    backing.fillRoundedRect(20, backingTop, layout.gameWidth - 40, layout.gameHeight - backingTop - 20, 12);

    // Title block
    const titlePrimary = this.add.text(centerX, backingTop + (veryCompactMenu ? 34 : compactMenu ? 36 : 44), "SLICK'S", {
      fontFamily: 'monospace',
      fontSize: titlePrimarySize,
      color: `#${COLORS.PLAYER.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(uiDepth);

    const titleSecondary = this.add.text(centerX, titlePrimary.y + titlePrimary.height + (veryCompactMenu ? 0 : 2), 'SALVAGE & MINING', {
      fontFamily: 'monospace',
      fontSize: titleSecondarySize,
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(uiDepth);

    const titleTertiary = this.add.text(centerX, titleSecondary.y + titleSecondary.height + (veryCompactMenu ? 2 : 4), 'REMOTE PILOT INTERFACE', {
      fontFamily: 'monospace',
      fontSize: titleTertiarySize,
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(uiDepth);

    // Player name and best score
    this.pilotText = this.add.text(centerX, titleTertiary.y + titleTertiary.height + (veryCompactMenu ? 12 : 16), `PILOT: ${playerName}`, {
      fontFamily: 'monospace',
      fontSize: metaSize,
      color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(uiDepth).setInteractive({ useHandCursor: true });

    this.pilotText.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      const currentInitials = save.getPlayerName().split('-')[0];
      const nextInitials = window.prompt('Choose 3 letters for your callsign', currentInitials);
      if (nextInitials === null) return;

      const updatedName = save.setPlayerInitials(nextInitials);
      if (!updatedName) return;
      this.pilotText.setText(`PILOT: ${updatedName}`);
    });

    const editHint = this.add.text(centerX, this.pilotText.y + this.pilotText.height + 4, 'TAP CALLSIGN TO EDIT 3 LETTERS', {
      fontFamily: 'monospace',
      fontSize: hintSize,
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(uiDepth).setAlpha(0.7);

    let leaderboardTitleTop = editHint.y + editHint.height + (veryCompactMenu ? 10 : 14);
    if (best > 0) {
      const bestText = this.add.text(centerX, editHint.y + editHint.height + (veryCompactMenu ? 6 : 8), `BEST: ${Math.floor(best)}`, {
        fontFamily: 'monospace',
        fontSize: bestSize,
        color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
        align: 'center',
      }).setOrigin(0.5, 0).setDepth(uiDepth);
      leaderboardTitleTop = bestText.y + bestText.height + (veryCompactMenu ? 8 : 12);
    }

    // Leaderboard section
    const hudColor = `#${COLORS.HUD.toString(16).padStart(6, '0')}`;
    const gateColor = `#${COLORS.GATE.toString(16).padStart(6, '0')}`;
    const tabGap = veryCompactMenu ? 12 : 16;
    const tabOffset = this.leaderboardTabWidth / 2 + tabGap / 2;
    const dailyTabX = centerX - tabOffset;
    const weeklyTabX = centerX + tabOffset;

    const leaderboardTitle = this.add.text(centerX, leaderboardTitleTop, 'LEADERBOARD', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: hudColor,
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(uiDepth).setAlpha(0.68);
    const tabY = leaderboardTitle.y + leaderboardTitle.height + (veryCompactMenu ? 14 : 16) + this.leaderboardTabHeight / 2;

    this.dailyTabBg = this.add.graphics().setDepth(uiDepth);
    this.weeklyTabBg = this.add.graphics().setDepth(uiDepth);

    this.dailyTab = this.add.text(dailyTabX, tabY, 'DAILY', {
      fontFamily: 'monospace',
      fontSize: compactMenu ? '13px' : '14px',
      color: gateColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(uiDepth + 1);

    this.weeklyTab = this.add.text(weeklyTabX, tabY, 'WEEKLY', {
      fontFamily: 'monospace',
      fontSize: compactMenu ? '13px' : '14px',
      color: hudColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(uiDepth + 1);

    this.dailyTabHit = this.add.zone(
      dailyTabX - this.leaderboardTabWidth / 2,
      tabY - this.leaderboardTabHeight / 2,
      this.leaderboardTabWidth,
      this.leaderboardTabHeight,
    ).setOrigin(0, 0).setDepth(uiDepth + 2).setInteractive({ useHandCursor: true });
    this.weeklyTabHit = this.add.zone(
      weeklyTabX - this.leaderboardTabWidth / 2,
      tabY - this.leaderboardTabHeight / 2,
      this.leaderboardTabWidth,
      this.leaderboardTabHeight,
    ).setOrigin(0, 0).setDepth(uiDepth + 2).setInteractive({ useHandCursor: true });

    this.dailyTabHit.on('pointerdown', (e: Phaser.Input.Pointer) => {
      e.event.stopPropagation();
      if (this.activePeriod !== 'daily') {
        this.activePeriod = 'daily';
        this.updateTabStyles();
        this.loadLeaderboard();
      }
    });

    this.weeklyTabHit.on('pointerdown', (e: Phaser.Input.Pointer) => {
      e.event.stopPropagation();
      if (this.activePeriod !== 'weekly') {
        this.activePeriod = 'weekly';
        this.updateTabStyles();
        this.loadLeaderboard();
      }
    });

    this.updateTabStyles();

    // Divider line under tabs
    const divider = this.add.graphics().setDepth(uiDepth);
    divider.lineStyle(1, COLORS.HUD, 0.3);
    const dividerY = tabY + this.leaderboardTabHeight / 2 + (veryCompactMenu ? 8 : 10);
    divider.lineBetween(centerX - 120, dividerY, centerX + 120, dividerY);
    this.leaderboardStartY = dividerY + (veryCompactMenu ? 16 : 18);

    // Status text (loading / offline)
    this.statusText = this.add.text(centerX, this.leaderboardStartY + (veryCompactMenu ? 10 : 12), 'LOADING...', {
      fontFamily: 'monospace',
      fontSize: this.leaderboardFontSize,
      color: hudColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(uiDepth);

    // TAP TO START — anchored from bottom
    const tapY = layout.gameHeight - 60;
    const tapText = this.add.text(centerX, tapY, 'TAP TO START', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: gateColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(uiDepth);

    // How to play — anchored above TAP TO START
    this.add.text(centerX, tapY - 52, [
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

    this.createSettingsUi(uiDepth, backingTop, compactMenu, veryCompactMenu);

    this.tweens.add({
      targets: tapText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Hologram overlay on top of everything
    this.hologramOverlay = new HologramOverlay(this);
    this.slickComm = new SlickComm(this, { depth: uiDepth + 1 });
    if (Math.random() < 0.45) {
      this.slickComm.show(getSlickLine('menuIntro'));
    }

    // Start game on tap (ignore tab taps)
    this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer, targets: Phaser.GameObjects.GameObject[]) => {
      if (targets.length > 0) {
        return;
      }

      if (this.settingsOpen) {
        this.setSettingsOpen(false);
        return;
      }

      // Snapshot background entity state for seamless handoff
      const drifterState = this.bgDrifters
        .filter(d => d.active)
        .map(d => ({ x: d.x, y: d.y, vx: d.vx, vy: d.vy, radiusScale: d.radiusScale }));
      const debrisState = this.bgDebris
        .filter(d => d.active)
        .map(d => ({ x: d.x, y: d.y, vx: d.driftVx, vy: d.driftVy }));
      const npcState = this.bgNpcs
        .filter(npc => npc.active)
        .map(npc => ({ x: npc.x, y: npc.y, vx: npc.vx, vy: npc.vy }));
      this.cleanupBackground();
      this.scene.start(SCENE_KEYS.MISSION_SELECT, { drifterState, debrisState, npcState });
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

    for (const npc of this.bgNpcs) {
      if (!npc.active) continue;

      let bestTarget: SalvageDebris | null = null;
      let bestDist = Infinity;
      for (const debris of this.bgDebris) {
        if (!debris.active || debris.depleted) continue;
        const dist = Phaser.Math.Distance.Between(npc.x, npc.y, debris.x, debris.y);
        if (dist < bestDist) {
          bestDist = dist;
          bestTarget = debris;
        }
      }

      if (bestTarget) {
        npc.setTarget(bestTarget.x, bestTarget.y);
      } else {
        npc.clearTarget();
      }
    }

    // Update background NPCs
    for (let i = this.bgNpcs.length - 1; i >= 0; i--) {
      const npc = this.bgNpcs[i];
      npc.update(delta);
      if (!npc.active) {
        npc.destroy();
        this.bgNpcs.splice(i, 1);
      }
    }

    // Menu-only NPC salvage/death simulation: no shield or bonus drops here
    for (const npc of this.bgNpcs) {
      if (!npc.active || !npc.isSalvaging()) continue;
      for (const debris of this.bgDebris) {
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

    for (const npc of this.bgNpcs) {
      if (!npc.active) continue;
      for (const drifter of this.bgDrifters) {
        if (!drifter.active) continue;
        const dx = npc.x - drifter.x;
        const dy = npc.y - drifter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < npc.radius + drifter.radius) {
          npc.active = false;
          npc.killedByHazard = true;
          break;
        }
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

    this.npcTimer += delta;
    if (this.npcTimer >= BG_NPC_SPAWN_MS && this.bgNpcs.length < BG_MAX_NPCS) {
      this.bgNpcs.push(new NPCShip(this));
      this.npcTimer = 0;
    }

    // Hologram flicker
    this.hologramOverlay.update(delta);
    this.geoSphere.update(delta);
  }

  private cleanupBackground(): void {
    for (const d of this.bgDebris) d.destroy();
    this.bgDebris = [];
    for (const d of this.bgDrifters) d.destroy();
    this.bgDrifters = [];
    for (const npc of this.bgNpcs) npc.destroy();
    this.bgNpcs = [];
    this.hologramOverlay.destroy();
    this.geoSphere.destroy();
  }

  private cleanup(): void {
    this.input.removeAllListeners();
    this.cleanupBackground();
    this.slickComm.destroy();
  }

  private createSettingsUi(uiDepth: number, backingTop: number, compactMenu: boolean, veryCompactMenu: boolean): void {
    const layout = getLayout();
    const hudColor = `#${COLORS.HUD.toString(16).padStart(6, '0')}`;
    const buttonWidth = compactMenu ? 84 : 90;
    const buttonCenterX = layout.gameWidth - (compactMenu ? 68 : 72);
    const buttonCenterY = backingTop + (veryCompactMenu ? 14 : 16);
    const panelWidth = compactMenu ? 162 : 170;
    const panelHeight = 92;
    const panelLeft = layout.gameWidth - panelWidth - 24;
    const panelTop = buttonCenterY + 18;
    const rowOneY = panelTop + 26;
    const rowTwoY = panelTop + 58;
    const offX = panelLeft + panelWidth - 26;
    const onX = offX - 44;

    this.settingsButton = this.createMenuButton(
      buttonCenterX,
      buttonCenterY,
      buttonWidth,
      26,
      'SETTINGS',
      uiDepth + 1,
      '10px',
      () => this.setSettingsOpen(!this.settingsOpen),
    );

    const panelBg = this.add.graphics().setDepth(uiDepth + 2);
    panelBg.fillStyle(COLORS.BG, 0.95);
    panelBg.lineStyle(1.1, COLORS.HUD, 0.34);
    panelBg.fillRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 10);
    panelBg.strokeRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 10);
    panelBg.fillStyle(COLORS.HUD, 0.04);
    panelBg.fillRoundedRect(panelLeft + 4, panelTop + 4, panelWidth - 8, panelHeight - 8, 8);

    const panelHit = this.add.zone(panelLeft, panelTop, panelWidth, panelHeight)
      .setOrigin(0, 0)
      .setDepth(uiDepth + 5)
      .setInteractive({ useHandCursor: false });
    panelHit.on('pointerdown', (e: Phaser.Input.Pointer) => {
      e.event.stopPropagation();
    });

    const shakeLabel = this.add.text(panelLeft + 14, rowOneY, 'SHAKE', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: hudColor,
      align: 'left',
    }).setOrigin(0, 0.5).setDepth(uiDepth + 3);

    const scanLabel = this.add.text(panelLeft + 14, rowTwoY, 'SCAN', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: hudColor,
      align: 'left',
    }).setOrigin(0, 0.5).setDepth(uiDepth + 3);

    this.shakeOnButton = this.createMenuButton(onX, rowOneY, 34, 20, 'ON', uiDepth + 3, '10px', () => this.applyMenuSettings({ screenShake: true }));
    this.shakeOffButton = this.createMenuButton(offX, rowOneY, 38, 20, 'OFF', uiDepth + 3, '10px', () => this.applyMenuSettings({ screenShake: false }));
    this.scanOnButton = this.createMenuButton(onX, rowTwoY, 34, 20, 'ON', uiDepth + 3, '10px', () => this.applyMenuSettings({ scanlines: true }));
    this.scanOffButton = this.createMenuButton(offX, rowTwoY, 38, 20, 'OFF', uiDepth + 3, '10px', () => this.applyMenuSettings({ scanlines: false }));

    this.settingsPanelUi = [
      panelBg,
      panelHit,
      shakeLabel,
      scanLabel,
      this.shakeOnButton.bg,
      this.shakeOnButton.label,
      this.shakeOnButton.hit,
      this.shakeOffButton.bg,
      this.shakeOffButton.label,
      this.shakeOffButton.hit,
      this.scanOnButton.bg,
      this.scanOnButton.label,
      this.scanOnButton.hit,
      this.scanOffButton.bg,
      this.scanOffButton.label,
      this.scanOffButton.hit,
    ];

    this.updateSettingsUi();
    this.setSettingsPanelVisible(false);
  }

  private createMenuButton(
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    label: string,
    depth: number,
    fontSize: string,
    onPointerDown: () => void,
  ): MenuButton {
    const bg = this.add.graphics().setDepth(depth);
    const text = this.add.text(centerX, centerY, label, {
      fontFamily: 'monospace',
      fontSize,
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(depth + 1);
    const hit = this.add.zone(centerX - width / 2, centerY - height / 2, width, height)
      .setOrigin(0, 0)
      .setDepth(depth + 2)
      .setInteractive({ useHandCursor: true });

    hit.on('pointerdown', (e: Phaser.Input.Pointer) => {
      e.event.stopPropagation();
      onPointerDown();
    });

    return { bg, label: text, hit, width, height };
  }

  private drawMenuButton(button: MenuButton, centerX: number, centerY: number, active: boolean): void {
    const left = centerX - button.width / 2;
    const top = centerY - button.height / 2;
    button.bg.clear();
    button.bg.fillStyle(COLORS.BG, active ? 0.94 : 0.84);
    button.bg.lineStyle(1.1, active ? COLORS.GATE : COLORS.HUD, active ? 0.9 : 0.34);
    button.bg.fillRoundedRect(left, top, button.width, button.height, 8);
    button.bg.strokeRoundedRect(left, top, button.width, button.height, 8);
    button.bg.fillStyle(active ? COLORS.GATE : COLORS.HUD, active ? 0.14 : 0.04);
    button.bg.fillRoundedRect(left + 4, top + 4, button.width - 8, button.height - 8, 6);
    button.label.setColor(`#${(active ? COLORS.GATE : COLORS.HUD).toString(16).padStart(6, '0')}`);
    button.label.setAlpha(active ? 1 : 0.78);
  }

  private setSettingsPanelVisible(visible: boolean): void {
    for (const obj of this.settingsPanelUi) {
      obj.setVisible(visible);
      if ('input' in obj && obj.input) {
        obj.input.enabled = visible;
      }
    }
  }

  private setSettingsOpen(open: boolean): void {
    this.settingsOpen = open;
    this.setSettingsPanelVisible(open);
    this.updateSettingsUi();
  }

  private applyMenuSettings(partial: Partial<GameSettings>): void {
    const updated = updateSettings(partial);
    this.hologramOverlay.setEnabled(updated.scanlines);
    this.updateSettingsUi();
  }

  private updateSettingsUi(): void {
    this.drawMenuButton(this.settingsButton, this.settingsButton.label.x, this.settingsButton.label.y, this.settingsOpen);

    const settings = getSettings();
    this.drawMenuButton(this.shakeOnButton, this.shakeOnButton.label.x, this.shakeOnButton.label.y, settings.screenShake);
    this.drawMenuButton(this.shakeOffButton, this.shakeOffButton.label.x, this.shakeOffButton.label.y, !settings.screenShake);
    this.drawMenuButton(this.scanOnButton, this.scanOnButton.label.x, this.scanOnButton.label.y, settings.scanlines);
    this.drawMenuButton(this.scanOffButton, this.scanOffButton.label.x, this.scanOffButton.label.y, !settings.scanlines);
  }

  private updateTabStyles(): void {
    const active = `#${COLORS.GATE.toString(16).padStart(6, '0')}`;
    const inactive = `#${COLORS.HUD.toString(16).padStart(6, '0')}`;
    this.drawTabButton(this.dailyTabBg, this.dailyTab.x, this.dailyTab.y, this.activePeriod === 'daily');
    this.drawTabButton(this.weeklyTabBg, this.weeklyTab.x, this.weeklyTab.y, this.activePeriod === 'weekly');
    this.dailyTab.setColor(this.activePeriod === 'daily' ? active : inactive);
    this.dailyTab.setAlpha(this.activePeriod === 'daily' ? 1 : 0.72);
    this.weeklyTab.setColor(this.activePeriod === 'weekly' ? active : inactive);
    this.weeklyTab.setAlpha(this.activePeriod === 'weekly' ? 1 : 0.72);
  }

  private drawTabButton(bg: Phaser.GameObjects.Graphics, centerX: number, centerY: number, active: boolean): void {
    const width = this.leaderboardTabWidth;
    const height = this.leaderboardTabHeight;
    const left = centerX - width / 2;
    const top = centerY - height / 2;
    bg.clear();
    bg.fillStyle(COLORS.BG, active ? 0.92 : 0.8);
    bg.lineStyle(1.3, active ? COLORS.GATE : COLORS.HUD, active ? 0.9 : 0.32);
    bg.fillRoundedRect(left, top, width, height, 8);
    bg.strokeRoundedRect(left, top, width, height, 8);
    bg.fillStyle(active ? COLORS.GATE : COLORS.HUD, active ? 0.14 : 0.04);
    bg.fillRoundedRect(left + 4, top + 4, width - 8, height - 8, 6);
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
    const layout = getLayout();
    const centerX = layout.centerX;
    const startY = this.leaderboardStartY;
    const rowHeight = this.leaderboardRowHeight;
    const hudColor = `#${COLORS.HUD.toString(16).padStart(6, '0')}`;
    const salvageColor = `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`;
    const uiDepth = 10;

    if (entries.length === 0) {
      this.statusText.setText('NO SCORES YET').setVisible(true);
      return;
    }

    // Cap visible rows so they don't overlap the bottom UI (how-to-play + tap to start)
    const bottomUiTop = layout.gameHeight - 120;
    const maxRows = Math.max(3, Math.floor((bottomUiTop - startY) / rowHeight));
    const visibleEntries = entries.slice(0, maxRows);

    for (let i = 0; i < visibleEntries.length; i++) {
      const entry = visibleEntries[i];
      const y = startY + i * rowHeight;
      const rank = `${i + 1}.`.padEnd(4);
      const name = entry.player_name.padEnd(9);
      const score = String(Math.floor(entry.score));
      const line = `${rank}${name}${score}`;

      const text = this.add.text(centerX, y, line, {
        fontFamily: 'monospace',
        fontSize: this.leaderboardFontSize,
        color: i < 3 ? salvageColor : hudColor,
        align: 'center',
      }).setOrigin(0.5).setDepth(uiDepth);

      this.leaderboardTexts.push(text);
    }
  }
}
