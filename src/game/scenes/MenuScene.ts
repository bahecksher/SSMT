import Phaser from 'phaser';
import {
  applyColorPalette,
  COLORS,
  SCENE_KEYS,
  TITLE_FONT,
  UI_FONT,
  readableFontSize,
} from '../constants';
import { COMPANIES } from '../data/companyData';
import { SaveSystem } from '../systems/SaveSystem';
import {
  fetchCorporationLeaderboard,
  fetchLeaderboard,
  isOnline,
  runModeToLeaderboardMode,
  type CorporationLeaderboardEntry,
  type LeaderboardEntry,
} from '../services/LeaderboardService';
import { SalvageDebris } from '../entities/SalvageDebris';
import { DrifterHazard } from '../entities/DrifterHazard';
import { NPCShip } from '../entities/NPCShip';
import { GeoSphere } from '../entities/GeoSphere';
import { HologramOverlay } from '../ui/HologramOverlay';
import { SlickComm } from '../ui/SlickComm';
import { TitlePilotDisplay } from '../ui/TitlePilotDisplay';
import { CorporationScoreGraph } from '../ui/CorporationScoreGraph';
import { DRIFTER_SPEED_BASE } from '../data/tuning';
import { pickAsteroidSize } from '../data/phaseConfig';
import { getSlickLine } from '../data/slickLines';
import { getLayout, isNarrowViewport, isShortViewport, setLayoutSize } from '../layout';
import { getSettings, updateSettings, type GameSettings } from '../systems/SettingsSystem';
import { refreshMusicForSettings, setMenuMusic, warmMusicCache } from '../systems/MusicSystem';
import { playUiSelectSfx } from '../systems/SfxSystem';
import { CustomCursor } from '../ui/CustomCursor';
import { SettingsSlider } from '../ui/SettingsSlider';
import { RunMode, type LocalCampaignLeaderboardEntry } from '../types';

type LeaderboardView = 'pilots' | 'corps';
interface BackgroundHandoffData {
  drifterState?: { x: number; y: number; vx: number; vy: number; radiusScale: number }[];
  debrisState?: { x: number; y: number; vx: number; vy: number }[];
  npcState?: { x: number; y: number; vx: number; vy: number }[];
  reopenSettings?: boolean;
  mode?: RunMode;
  bootTransition?: boolean;
}

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
  private saveSystem!: SaveSystem;
  private leaderboardTexts: Phaser.GameObjects.Text[] = [];
  private leaderboardSectionUi: Phaser.GameObjects.GameObject[] = [];
  private leaderboardSectionHits: Phaser.GameObjects.Zone[] = [];
  private leaderboardTitle!: Phaser.GameObjects.Text;
  private pilotBoardTabBg!: Phaser.GameObjects.Graphics;
  private pilotBoardTab!: Phaser.GameObjects.Text;
  private pilotBoardTabHit!: Phaser.GameObjects.Zone;
  private corpBoardTabBg!: Phaser.GameObjects.Graphics;
  private corpBoardTab!: Phaser.GameObjects.Text;
  private corpBoardTabHit!: Phaser.GameObjects.Zone;
  private arcadeBoardTabBg!: Phaser.GameObjects.Graphics;
  private arcadeBoardTab!: Phaser.GameObjects.Text;
  private arcadeBoardTabHit!: Phaser.GameObjects.Zone;
  private campaignBoardTabBg!: Phaser.GameObjects.Graphics;
  private campaignBoardTab!: Phaser.GameObjects.Text;
  private campaignBoardTabHit!: Phaser.GameObjects.Zone;
  private settingsButton!: MenuButton;
  private howToPlayButton!: MenuButton;
  private settingsPanelUi: Phaser.GameObjects.GameObject[] = [];
  private shakeOnButton!: MenuButton;
  private shakeOffButton!: MenuButton;
  private scanOnButton!: MenuButton;
  private scanOffButton!: MenuButton;
  private musicOnButton!: MenuButton;
  private musicOffButton!: MenuButton;
  private musicVolumeSlider!: SettingsSlider;
  private fxVolumeSlider!: SettingsSlider;
  private settingsOpen = false;
  private activeLeaderboardView: LeaderboardView = 'pilots';
  private leaderboardStartY = 0;
  private campaignLeaderboardStartY = 0;
  private leaderboardStatusY = 0;
  private leaderboardRowHeight = 22;
  private modeTabWidth = 136;
  private leaderboardTabWidth = 104;
  private leaderboardTabHeight = 30;
  private leaderboardFontSize = '14px';
  private corpScoreGraph: CorporationScoreGraph | null = null;
  private statusText!: Phaser.GameObjects.Text;
  private pilotText!: Phaser.GameObjects.Text;

  // Background simulation
  private bgDebris: SalvageDebris[] = [];
  private bgDrifters: DrifterHazard[] = [];
  private bgNpcs: NPCShip[] = [];
  private geoSphere!: GeoSphere;
  private hologramOverlay!: HologramOverlay;
  private titlePilot!: TitlePilotDisplay;
  private slickComm!: SlickComm;
  private drifterTimer = 0;
  private debrisTimer = 0;
  private npcTimer = 0;
  private cursor!: CustomCursor;

  constructor() {
    super(SCENE_KEYS.MENU);
  }

  create(data?: BackgroundHandoffData): void {
    this.events.once('shutdown', this.cleanup, this);
    setLayoutSize(this.scale.width, this.scale.height);
    applyColorPalette(getSettings().paletteId);
    setMenuMusic(this);
    warmMusicCache(this);
    const layout = getLayout();
    const centerX = layout.centerX;
    this.saveSystem = new SaveSystem();
    const best = this.saveSystem.getBestScore();
    const playerName = this.saveSystem.getPlayerName();
    const handoff = data ?? {};
    this.bgDebris = [];
    this.bgDrifters = [];
    this.bgNpcs = [];
    this.settingsOpen = false;
    this.drifterTimer = 0;
    this.debrisTimer = 0;
    this.npcTimer = 0;

    // === Background layer (depth -1 to 5) ===

    // Starfield
    const starfield = this.add.graphics().setDepth(-1);
    starfield.fillStyle(COLORS.STARFIELD_BG, 1);
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

    this.restoreBackgroundEntities(handoff);

    // === UI layer (depth 10+) ===
    const uiDepth = 10;
    const narrowMenu = isNarrowViewport(layout);
    const shortMenu = isShortViewport(layout);
    const compactMenu = layout.gameHeight <= 720 || layout.gameWidth <= 400;
    const veryCompactMenu = layout.gameHeight <= 560 || layout.gameWidth <= 360 || (narrowMenu && layout.gameHeight <= 700);
    const backingTop = layout.gameHeight * (veryCompactMenu ? 0.045 : 0.06);
    const titlePrimarySize = readableFontSize(veryCompactMenu ? 32 : compactMenu ? 38 : 42);
    const titleSecondarySize = readableFontSize(veryCompactMenu ? 20 : compactMenu ? 24 : 26);
    const titleTertiarySize = readableFontSize(veryCompactMenu ? 12 : 16);
    const metaSize = readableFontSize(veryCompactMenu ? 13 : compactMenu ? 15 : 16);
    const hintSize = readableFontSize(veryCompactMenu ? 10 : 12);
    const bestSize = readableFontSize(veryCompactMenu ? 14 : compactMenu ? 16 : 18);
    this.modeTabWidth = Math.min(layout.gameWidth - 64, veryCompactMenu ? 126 : compactMenu ? 144 : 164);
    this.leaderboardTabWidth = veryCompactMenu ? 96 : compactMenu ? 112 : 122;
    this.leaderboardTabHeight = veryCompactMenu ? 30 : compactMenu ? 34 : 38;
    this.leaderboardRowHeight = veryCompactMenu ? 22 : 28;
    this.leaderboardFontSize = readableFontSize(veryCompactMenu ? 14 : 16);

    // Semi-transparent backing so text is readable over the simulation
    const backing = this.add.graphics().setDepth(uiDepth);
    backing.fillStyle(COLORS.BG, 0.7);
    backing.fillRoundedRect(20, backingTop, layout.gameWidth - 40, layout.gameHeight - backingTop - 20, 12);

    // Title block
    const portraitRadius = veryCompactMenu ? 30 : compactMenu ? 42 : 50;
    const portraitCenterY = backingTop + portraitRadius + (veryCompactMenu ? 8 : compactMenu ? 10 : 14);
    const portraitFrame = this.add.graphics().setDepth(uiDepth);
    portraitFrame.fillStyle(COLORS.BG, 0.88);
    portraitFrame.lineStyle(1.2, COLORS.HUD, 0.36);
    portraitFrame.fillCircle(centerX, portraitCenterY, portraitRadius + 8);
    portraitFrame.strokeCircle(centerX, portraitCenterY, portraitRadius + 8);
    portraitFrame.lineStyle(1, COLORS.PLAYER, 0.18);
    portraitFrame.strokeCircle(centerX, portraitCenterY, portraitRadius + 2);

    this.titlePilot = new TitlePilotDisplay(
      this,
      centerX,
      portraitCenterY,
      portraitRadius * (veryCompactMenu ? 0.56 : compactMenu ? 0.58 : 0.6),
    )
      .setDepth(uiDepth + 1)
      .setAlpha(0.96);

    const titlePrimaryY = portraitCenterY + portraitRadius + (veryCompactMenu ? 8 : compactMenu ? 10 : 14);
    const titleSecondaryGap = veryCompactMenu ? 0 : 2;
    const titleTertiaryGap = veryCompactMenu ? 2 : 4;
    const pilotGap = veryCompactMenu ? 12 : 16;
    const titlePrimary = this.add.text(centerX, titlePrimaryY, "SLICK'S", {
      fontFamily: TITLE_FONT,
      fontSize: titlePrimarySize,
      color: `#${COLORS.PLAYER.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(uiDepth);

    const titleSecondary = this.add.text(centerX, titlePrimary.y + titlePrimary.height + titleSecondaryGap, 'SALVAGE & MINING', {
      fontFamily: TITLE_FONT,
      fontSize: titleSecondarySize,
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(uiDepth);

    const titleTertiary = this.add.text(centerX, titleSecondary.y + titleSecondary.height + titleTertiaryGap, 'REMOTE PILOT INTERFACE', {
      fontFamily: TITLE_FONT,
      fontSize: titleTertiarySize,
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(uiDepth);

    // Player name and best score
    this.pilotText = this.add.text(centerX, titleTertiary.y + titleTertiary.height + pilotGap, `PILOT: ${playerName}`, {
      fontFamily: UI_FONT,
      fontSize: metaSize,
      color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(uiDepth).setInteractive({ useHandCursor: true });

    const layoutTitleBlock = () => {
      titlePrimary.setPosition(centerX, titlePrimaryY);
      titleSecondary.setPosition(centerX, titlePrimary.y + titlePrimary.height + titleSecondaryGap);
      titleTertiary.setPosition(centerX, titleSecondary.y + titleSecondary.height + titleTertiaryGap);
      this.pilotText.setPosition(centerX, titleTertiary.y + titleTertiary.height + pilotGap);
    };
    layoutTitleBlock();
    if (typeof document !== 'undefined' && 'fonts' in document) {
      void document.fonts.load('16px "pixel_lcd"').then(() => {
        if (!this.sys.isActive()) {
          return;
        }

        [titlePrimary, titleSecondary, titleTertiary].forEach((titleText) => {
          titleText.setStyle({ fontFamily: TITLE_FONT });
          titleText.setText(titleText.text);
        });
        layoutTitleBlock();
      });
    }

    this.pilotText.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      const currentInitials = this.saveSystem.getPlayerName().split('-')[0];
      const nextInitials = window.prompt('Choose 3 letters for your callsign', currentInitials);
      if (nextInitials === null) return;

      const updatedName = this.saveSystem.setPlayerInitials(nextInitials);
      if (!updatedName) return;
      playUiSelectSfx(this);
      this.pilotText.setText(`PILOT: ${updatedName}`);
      layoutTitleBlock();
    });

    const editHint = this.add.text(
      centerX,
      this.pilotText.y + this.pilotText.height + 6,
      veryCompactMenu ? 'TAP CALLSIGN' : 'TAP CALLSIGN TO EDIT',
      {
      fontFamily: UI_FONT,
      fontSize: hintSize,
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
      },
    ).setOrigin(0.5, 0).setDepth(uiDepth).setAlpha(0.7);

    let leaderboardTitleTop = editHint.y + editHint.height + (veryCompactMenu ? 10 : 14);
    if (best > 0) {
      const bestText = this.add.text(centerX, editHint.y + editHint.height + (veryCompactMenu ? 6 : 8), `BEST: ${Math.floor(best)}`, {
        fontFamily: UI_FONT,
        fontSize: bestSize,
        color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
        align: 'center',
      }).setOrigin(0.5, 0).setDepth(uiDepth);
      leaderboardTitleTop = bestText.y + bestText.height + (veryCompactMenu ? 8 : 12);
    }

    const hudColor = `#${COLORS.HUD.toString(16).padStart(6, '0')}`;
    const gateColor = `#${COLORS.GATE.toString(16).padStart(6, '0')}`;

    // Leaderboard section
    const tabGap = veryCompactMenu ? 12 : 16;
    const tabOffset = this.leaderboardTabWidth / 2 + tabGap / 2;
    const corpTabX = centerX - tabOffset;
    const pilotTabX = centerX + tabOffset;
    const modeTabX = centerX;

    const campaignTabY = leaderboardTitleTop + this.leaderboardTabHeight / 2;
    const arcadeTabY = campaignTabY + this.leaderboardTabHeight + (veryCompactMenu ? 8 : 10);

    this.arcadeBoardTabBg = this.add.graphics().setDepth(uiDepth);
    this.campaignBoardTabBg = this.add.graphics().setDepth(uiDepth);
    this.pilotBoardTabBg = this.add.graphics().setDepth(uiDepth);
    this.corpBoardTabBg = this.add.graphics().setDepth(uiDepth);

    this.arcadeBoardTab = this.add.text(modeTabX, arcadeTabY, 'ARCADE', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(compactMenu ? 15 : 16),
      color: gateColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(uiDepth + 1);

    this.campaignBoardTab = this.add.text(modeTabX, campaignTabY, 'CAMPAIGN', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(compactMenu ? 15 : 16),
      color: hudColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(uiDepth + 1);

    this.leaderboardTitle = this.add.text(
      centerX,
      arcadeTabY + this.leaderboardTabHeight / 2 + (veryCompactMenu ? 8 : 10),
      'WEEKLY LEADERBOARD',
      {
        fontFamily: UI_FONT,
        fontSize: readableFontSize(veryCompactMenu ? 12 : 14),
        color: hudColor,
        align: 'center',
      },
    ).setOrigin(0.5, 0).setDepth(uiDepth).setAlpha(0.68);
    const boardTabY = this.leaderboardTitle.y + this.leaderboardTitle.height + (veryCompactMenu ? 10 : 14) + this.leaderboardTabHeight / 2;

    this.pilotBoardTab = this.add.text(pilotTabX, boardTabY, 'PILOTS', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(compactMenu ? 15 : 16),
      color: gateColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(uiDepth + 1);

    this.corpBoardTab = this.add.text(corpTabX, boardTabY, 'CORPS', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(compactMenu ? 15 : 16),
      color: hudColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(uiDepth + 1);

    this.arcadeBoardTabHit = this.add.zone(
      modeTabX - this.modeTabWidth / 2,
      arcadeTabY - this.leaderboardTabHeight / 2,
      this.modeTabWidth,
      this.leaderboardTabHeight,
    ).setData('cornerRadius', 8).setOrigin(0, 0).setDepth(uiDepth + 2).setInteractive({ useHandCursor: true });
    this.campaignBoardTabHit = this.add.zone(
      modeTabX - this.modeTabWidth / 2,
      campaignTabY - this.leaderboardTabHeight / 2,
      this.modeTabWidth,
      this.leaderboardTabHeight,
    ).setData('cornerRadius', 8).setOrigin(0, 0).setDepth(uiDepth + 2).setInteractive({ useHandCursor: true });

    this.pilotBoardTabHit = this.add.zone(
      pilotTabX - this.leaderboardTabWidth / 2,
      boardTabY - this.leaderboardTabHeight / 2,
      this.leaderboardTabWidth,
      this.leaderboardTabHeight,
    ).setData('cornerRadius', 8).setOrigin(0, 0).setDepth(uiDepth + 2).setInteractive({ useHandCursor: true });
    this.corpBoardTabHit = this.add.zone(
      corpTabX - this.leaderboardTabWidth / 2,
      boardTabY - this.leaderboardTabHeight / 2,
      this.leaderboardTabWidth,
      this.leaderboardTabHeight,
    ).setData('cornerRadius', 8).setOrigin(0, 0).setDepth(uiDepth + 2).setInteractive({ useHandCursor: true });

    this.arcadeBoardTabHit.on('pointerdown', (e: Phaser.Input.Pointer) => {
      e.event.stopPropagation();
      if (this.saveSystem.getSelectedMode() !== RunMode.ARCADE) {
        playUiSelectSfx(this);
        this.saveSystem.setSelectedMode(RunMode.ARCADE);
        this.updateModeTabStyles();
        this.loadLeaderboard();
      }
    });

    this.campaignBoardTabHit.on('pointerdown', (e: Phaser.Input.Pointer) => {
      e.event.stopPropagation();
      if (this.saveSystem.getSelectedMode() !== RunMode.CAMPAIGN) {
        playUiSelectSfx(this);
        this.saveSystem.setSelectedMode(RunMode.CAMPAIGN);
        this.updateModeTabStyles();
        this.loadLeaderboard();
      }
    });

    this.pilotBoardTabHit.on('pointerdown', (e: Phaser.Input.Pointer) => {
      e.event.stopPropagation();
      if (this.activeLeaderboardView !== 'pilots') {
        playUiSelectSfx(this);
        this.activeLeaderboardView = 'pilots';
        this.updateLeaderboardViewStyles();
        this.loadLeaderboard();
      }
    });

    this.corpBoardTabHit.on('pointerdown', (e: Phaser.Input.Pointer) => {
      e.event.stopPropagation();
      if (this.activeLeaderboardView !== 'corps') {
        playUiSelectSfx(this);
        this.activeLeaderboardView = 'corps';
        this.updateLeaderboardViewStyles();
        this.loadLeaderboard();
      }
    });

    this.updateModeTabStyles();
    this.updateLeaderboardViewStyles();

    // Divider line under tabs
    const divider = this.add.graphics().setDepth(uiDepth);
    divider.lineStyle(1, COLORS.HUD, 0.3);
    const dividerY = boardTabY + this.leaderboardTabHeight / 2 + (veryCompactMenu ? 6 : 10);
    divider.lineBetween(centerX - 120, dividerY, centerX + 120, dividerY);
    this.campaignLeaderboardStartY = boardTabY;
    this.leaderboardStartY = dividerY + (veryCompactMenu ? 12 : 18);

    // Status text (loading / offline)
    this.statusText = this.add.text(centerX, this.leaderboardStartY + (veryCompactMenu ? 8 : 12), 'LOADING...', {
      fontFamily: UI_FONT,
      fontSize: this.leaderboardFontSize,
      color: hudColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(uiDepth);
    this.leaderboardStatusY = this.statusText.y;
    this.leaderboardSectionUi = [
      this.pilotBoardTabBg,
      this.pilotBoardTab,
      this.corpBoardTabBg,
      this.corpBoardTab,
    ];
    this.leaderboardSectionHits = [
      this.pilotBoardTabHit,
      this.corpBoardTabHit,
    ];
    this.updateLeaderboardSectionVisibility();

    // TAP TO START — anchored from bottom
    const tapY = layout.gameHeight - (shortMenu ? 48 : 60);
    const tapText = this.add.text(centerX, tapY, 'TAP TO START', {
      fontFamily: TITLE_FONT,
      fontSize: readableFontSize(veryCompactMenu ? 22 : 26),
      color: gateColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(uiDepth);

    this.createHowToPlayButton(uiDepth, backingTop, compactMenu, veryCompactMenu);
    this.createSettingsUi(uiDepth, backingTop, compactMenu, veryCompactMenu);
    if (handoff.reopenSettings) {
      this.setSettingsOpen(true);
    }

    this.tweens.add({
      targets: tapText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Hologram overlay on top of everything
    this.hologramOverlay = new HologramOverlay(this);
    this.cursor = new CustomCursor(this);
    this.slickComm = new SlickComm(this, { depth: uiDepth + 1 });
    if (Math.random() < 0.45) {
      this.slickComm.show(getSlickLine('menuIntro'));
    }
    this.positionMenuComm();

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
      playUiSelectSfx(this);
      const backgroundHandoff = this.buildBackgroundHandoff();
      this.cleanupBackground();
      const selectedMode = this.saveSystem.getSelectedMode();
      if (selectedMode === RunMode.CAMPAIGN) {
        this.saveSystem.ensureCampaignSession();
      }
      this.scene.start(SCENE_KEYS.MISSION_SELECT, {
        ...backgroundHandoff,
        mode: selectedMode,
      } satisfies BackgroundHandoffData);
    });

    // Load initial leaderboard
    this.loadLeaderboard();
    if (handoff.bootTransition) {
      this.playBootCrtTransition();
    }
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
    this.cursor.update(this);
    this.geoSphere.update(delta);
    this.corpScoreGraph?.update(delta);
    this.titlePilot.update(delta);
  }

  private cleanupBackground(): void {
    for (const d of this.bgDebris) d.destroy();
    this.bgDebris = [];
    for (const d of this.bgDrifters) d.destroy();
    this.bgDrifters = [];
    for (const npc of this.bgNpcs) npc.destroy();
    this.bgNpcs = [];
    this.clearCorporationGraph();
    this.hologramOverlay.destroy();
    this.geoSphere.destroy();
  }

  private restoreBackgroundEntities(handoff: BackgroundHandoffData): void {
    if (handoff.debrisState) {
      for (const debris of handoff.debrisState) {
        this.bgDebris.push(SalvageDebris.createAt(this, debris.x, debris.y, debris.vx, debris.vy));
      }
    } else {
      for (let i = 0; i < BG_MAX_DEBRIS; i++) {
        this.bgDebris.push(new SalvageDebris(this));
      }
    }

    if (handoff.drifterState) {
      for (const drifter of handoff.drifterState) {
        this.bgDrifters.push(
          DrifterHazard.createFragment(this, drifter.x, drifter.y, drifter.vx, drifter.vy, drifter.radiusScale),
        );
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const sizeScale = pickAsteroidSize(1);
        const speed = DRIFTER_SPEED_BASE * (1 / Math.sqrt(sizeScale));
        this.bgDrifters.push(new DrifterHazard(this, speed, sizeScale));
      }
    }

    if (handoff.npcState) {
      for (const npc of handoff.npcState) {
        this.bgNpcs.push(NPCShip.createAt(this, npc.x, npc.y, npc.vx, npc.vy));
      }
    } else {
      for (let i = 0; i < BG_MAX_NPCS; i++) {
        this.bgNpcs.push(new NPCShip(this));
      }
    }
  }

  private buildBackgroundHandoff(): BackgroundHandoffData {
    return {
      drifterState: this.bgDrifters
        .filter((drifter) => drifter.active)
        .map((drifter) => ({
          x: drifter.x,
          y: drifter.y,
          vx: drifter.vx,
          vy: drifter.vy,
          radiusScale: drifter.radiusScale,
        })),
      debrisState: this.bgDebris
        .filter((debris) => debris.active)
        .map((debris) => ({
          x: debris.x,
          y: debris.y,
          vx: debris.driftVx,
          vy: debris.driftVy,
        })),
      npcState: this.bgNpcs
        .filter((npc) => npc.active)
        .map((npc) => ({
          x: npc.x,
          y: npc.y,
          vx: npc.vx,
          vy: npc.vy,
        })),
    };
  }

  private cleanup(): void {
    this.input.removeAllListeners();
    this.cleanupBackground();
    this.cursor.destroy(this);
    this.titlePilot.destroy();
    this.slickComm.destroy();
  }

  private playBootCrtTransition(): void {
    const layout = getLayout();
    const depth = 140;
    const centerX = layout.centerX;
    const centerY = layout.centerY;
    const slitHeight = 10;
    const shutterHeight = Math.max(1, centerY - slitHeight / 2);
    const closeDuration = 150;
    const holdDuration = 45;
    const openDuration = 240;
    this.input.enabled = false;

    const topShutter = this.add.rectangle(centerX, 0, layout.gameWidth + 4, shutterHeight, COLORS.HUD, 1)
      .setOrigin(0.5, 0)
      .setDepth(depth)
      .setScale(1, 0)
      .setAlpha(0);
    const bottomShutter = this.add.rectangle(centerX, layout.gameHeight, layout.gameWidth + 4, shutterHeight, COLORS.HUD, 1)
      .setOrigin(0.5, 1)
      .setDepth(depth)
      .setScale(1, 0)
      .setAlpha(0);
    const glowLine = this.add.rectangle(centerX, centerY, layout.gameWidth * 0.42, 6, COLORS.HUD, 1)
      .setDepth(depth + 1)
      .setScale(0.24, 1)
      .setAlpha(0);
    const coreLine = this.add.rectangle(centerX, centerY, layout.gameWidth * 0.22, 2, 0xffffff, 1)
      .setDepth(depth + 2)
      .setScale(0.12, 1)
      .setAlpha(0);
    const flash = this.add.rectangle(centerX, centerY, layout.gameWidth, layout.gameHeight, COLORS.HUD, 1)
      .setDepth(depth + 3)
      .setAlpha(0);

    this.tweens.add({
      targets: [topShutter, bottomShutter],
      scaleY: 1,
      alpha: 0.3,
      duration: closeDuration,
      ease: 'Cubic.easeIn',
    });

    this.tweens.add({
      targets: [topShutter, bottomShutter],
      scaleY: 0,
      alpha: 0,
      delay: closeDuration + holdDuration,
      duration: openDuration,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        topShutter.destroy();
        bottomShutter.destroy();
        this.input.enabled = true;
      },
    });

    this.tweens.add({
      targets: glowLine,
      scaleX: 0.82,
      alpha: 0.54,
      duration: closeDuration,
      ease: 'Sine.easeOut',
    });

    this.tweens.add({
      targets: glowLine,
      scaleX: 2.4,
      alpha: 0,
      delay: closeDuration + holdDuration,
      duration: openDuration,
      ease: 'Quad.easeOut',
      onComplete: () => glowLine.destroy(),
    });

    this.tweens.add({
      targets: coreLine,
      scaleX: 1,
      alpha: 0.88,
      duration: closeDuration,
      ease: 'Sine.easeOut',
    });

    this.tweens.add({
      targets: coreLine,
      scaleX: 3.2,
      alpha: 0,
      delay: closeDuration + holdDuration,
      duration: openDuration - 20,
      ease: 'Cubic.easeOut',
      onComplete: () => coreLine.destroy(),
    });

    this.tweens.add({
      targets: flash,
      alpha: 0.12,
      duration: closeDuration - 20,
      yoyo: true,
      hold: holdDuration + 30,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });
  }

  private createHowToPlayButton(uiDepth: number, backingTop: number, compactMenu: boolean, veryCompactMenu: boolean): void {
    const buttonWidth = compactMenu ? 98 : 108;
    const buttonHeight = 32;
    const buttonCenterX = compactMenu ? 76 : 82;
    const buttonCenterY = backingTop + (veryCompactMenu ? 16 : 18);
    this.howToPlayButton = this.createMenuButton(
      buttonCenterX,
      buttonCenterY,
      buttonWidth,
      buttonHeight,
      compactMenu ? 'GUIDE' : 'HOW TO PLAY',
      uiDepth + 1,
      readableFontSize(10),
      () => {
        this.cleanupBackground();
        this.scene.start(SCENE_KEYS.TUTORIAL_ARENA);
      },
    );
    this.drawMenuButton(this.howToPlayButton, buttonCenterX, buttonCenterY, false);
  }

  private createSettingsUi(uiDepth: number, backingTop: number, compactMenu: boolean, veryCompactMenu: boolean): void {
    const layout = getLayout();
    const hudColor = `#${COLORS.HUD.toString(16).padStart(6, '0')}`;
    const buttonWidth = compactMenu ? 98 : 108;
    const buttonCenterX = layout.gameWidth - (compactMenu ? 76 : 82);
    const buttonCenterY = backingTop + (veryCompactMenu ? 16 : 18);
    const panelWidth = compactMenu ? 214 : 226;
    const settingsRowGap = veryCompactMenu ? 30 : 34;
    const panelHeight = veryCompactMenu ? 206 : 230;
    const panelLeft = layout.gameWidth - panelWidth - 24;
    const panelTop = buttonCenterY + 22;
    const rowOneY = panelTop + (veryCompactMenu ? 26 : 30);
    const rowTwoY = rowOneY + settingsRowGap;
    const rowThreeY = rowTwoY + settingsRowGap;
    const musicVolumeLabelY = rowThreeY + (veryCompactMenu ? 32 : 38);
    const musicVolumeY = musicVolumeLabelY + (veryCompactMenu ? 14 : 18);
    const fxVolumeLabelY = musicVolumeY + (veryCompactMenu ? 18 : 28);
    const fxVolumeY = fxVolumeLabelY + (veryCompactMenu ? 14 : 18);
    const offX = panelLeft + panelWidth - 30;
    const onX = offX - 52;
    const sliderLeft = panelLeft + 80;
    const sliderWidth = panelWidth - 122;

    this.settingsButton = this.createMenuButton(
      buttonCenterX,
      buttonCenterY,
      buttonWidth,
      32,
      'SETTINGS',
      uiDepth + 1,
      readableFontSize(10),
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
      fontFamily: UI_FONT,
      fontSize: readableFontSize(10),
      color: hudColor,
      align: 'left',
    }).setOrigin(0, 0.5).setDepth(uiDepth + 3);

    const scanLabel = this.add.text(panelLeft + 14, rowTwoY, 'SCAN', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(10),
      color: hudColor,
      align: 'left',
    }).setOrigin(0, 0.5).setDepth(uiDepth + 3);

    const musicLabel = this.add.text(panelLeft + 14, rowThreeY, 'MUSIC', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(10),
      color: hudColor,
      align: 'left',
    }).setOrigin(0, 0.5).setDepth(uiDepth + 3);

    const musicBetaLabel = this.add.text(panelLeft + 48, rowThreeY, '*BETA*', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(9),
      color: `#${COLORS.HAZARD.toString(16).padStart(6, '0')}`,
      align: 'left',
    }).setOrigin(0, 0.5).setDepth(uiDepth + 3).setAlpha(0.9);

    const musicVolumeLabel = this.add.text(panelLeft + 14, musicVolumeLabelY, 'MUSIC VOL', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(9),
      color: hudColor,
      align: 'left',
    }).setOrigin(0, 0.5).setDepth(uiDepth + 3).setAlpha(0.72);

    const fxVolumeLabel = this.add.text(panelLeft + 14, fxVolumeLabelY, 'FX VOL', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(9),
      color: hudColor,
      align: 'left',
    }).setOrigin(0, 0.5).setDepth(uiDepth + 3).setAlpha(0.72);

    this.shakeOnButton = this.createMenuButton(onX, rowOneY, 42, 24, 'ON', uiDepth + 3, readableFontSize(10), () => this.applyMenuSettings({ screenShake: true }));
    this.shakeOffButton = this.createMenuButton(offX, rowOneY, 46, 24, 'OFF', uiDepth + 3, readableFontSize(10), () => this.applyMenuSettings({ screenShake: false }));
    this.scanOnButton = this.createMenuButton(onX, rowTwoY, 42, 24, 'ON', uiDepth + 3, readableFontSize(10), () => this.applyMenuSettings({ scanlines: true }));
    this.scanOffButton = this.createMenuButton(offX, rowTwoY, 46, 24, 'OFF', uiDepth + 3, readableFontSize(10), () => this.applyMenuSettings({ scanlines: false }));
    this.musicOnButton = this.createMenuButton(onX, rowThreeY, 42, 24, 'ON', uiDepth + 3, readableFontSize(10), () => this.applyMenuSettings({ musicEnabled: true }));
    this.musicOffButton = this.createMenuButton(offX, rowThreeY, 46, 24, 'OFF', uiDepth + 3, readableFontSize(10), () => this.applyMenuSettings({ musicEnabled: false }));
    this.musicVolumeSlider = new SettingsSlider({
      scene: this,
      left: sliderLeft,
      y: musicVolumeY,
      width: sliderWidth,
      depth: uiDepth + 3,
      accentColor: COLORS.GATE,
      initialValue: getSettings().musicVolume,
      onChange: (value) => this.applyMenuSettings({ musicVolume: value }),
    });
    this.fxVolumeSlider = new SettingsSlider({
      scene: this,
      left: sliderLeft,
      y: fxVolumeY,
      width: sliderWidth,
      depth: uiDepth + 3,
      accentColor: COLORS.SALVAGE,
      initialValue: getSettings().fxVolume,
      onChange: (value) => this.applyMenuSettings({ fxVolume: value }),
    });

    this.settingsPanelUi = [
      panelBg,
      panelHit,
      shakeLabel,
      scanLabel,
      musicLabel,
      musicBetaLabel,
      musicVolumeLabel,
      fxVolumeLabel,
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
      this.musicOnButton.bg,
      this.musicOnButton.label,
      this.musicOnButton.hit,
      this.musicOffButton.bg,
      this.musicOffButton.label,
      this.musicOffButton.hit,
      ...this.musicVolumeSlider.getObjects(),
      ...this.fxVolumeSlider.getObjects(),
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
      fontFamily: UI_FONT,
      fontSize,
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(depth + 1);
    const hit = this.add.zone(centerX - width / 2, centerY - height / 2, width, height)
      .setData('cornerRadius', 8)
      .setOrigin(0, 0)
      .setDepth(depth + 2)
      .setInteractive({ useHandCursor: true });

    hit.on('pointerdown', (e: Phaser.Input.Pointer) => {
      e.event.stopPropagation();
      playUiSelectSfx(this);
      onPointerDown();
    });

    return { bg, label: text, hit, width, height };
  }

  private drawMenuButton(
    button: MenuButton,
    centerX: number,
    centerY: number,
    active: boolean,
    accent = COLORS.HUD,
  ): void {
    const left = centerX - button.width / 2;
    const top = centerY - button.height / 2;
    const buttonAccent = accent;
    button.bg.clear();
    button.bg.fillStyle(COLORS.BG, active ? 0.94 : 0.84);
    button.bg.lineStyle(1.1, buttonAccent, active ? 0.9 : 0.34);
    button.bg.fillRoundedRect(left, top, button.width, button.height, 8);
    button.bg.strokeRoundedRect(left, top, button.width, button.height, 8);
    button.bg.fillStyle(buttonAccent, active ? 0.14 : 0.04);
    button.bg.fillRoundedRect(left + 4, top + 4, button.width - 8, button.height - 8, 6);
    button.label.setColor(`#${buttonAccent.toString(16).padStart(6, '0')}`);
    button.label.setAlpha(active ? 1 : 0.78);
  }

  private setSettingsPanelVisible(visible: boolean): void {
    for (const obj of this.settingsPanelUi) {
      (obj as Phaser.GameObjects.GameObject & { visible: boolean }).visible = visible;
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
    refreshMusicForSettings(this);
    this.updateSettingsUi();
  }

  private updateSettingsUi(): void {
    this.drawMenuButton(this.settingsButton, this.settingsButton.label.x, this.settingsButton.label.y, this.settingsOpen);

    const settings = getSettings();
    this.drawMenuButton(this.shakeOnButton, this.shakeOnButton.label.x, this.shakeOnButton.label.y, settings.screenShake);
    this.drawMenuButton(this.shakeOffButton, this.shakeOffButton.label.x, this.shakeOffButton.label.y, !settings.screenShake);
    this.drawMenuButton(this.scanOnButton, this.scanOnButton.label.x, this.scanOnButton.label.y, settings.scanlines);
    this.drawMenuButton(this.scanOffButton, this.scanOffButton.label.x, this.scanOffButton.label.y, !settings.scanlines);
    this.drawMenuButton(this.musicOnButton, this.musicOnButton.label.x, this.musicOnButton.label.y, settings.musicEnabled);
    this.drawMenuButton(this.musicOffButton, this.musicOffButton.label.x, this.musicOffButton.label.y, !settings.musicEnabled);
    this.musicVolumeSlider.setValue(settings.musicVolume);
    this.fxVolumeSlider.setValue(settings.fxVolume);
  }

  private updateLeaderboardViewStyles(): void {
    const active = `#${COLORS.HUD.toString(16).padStart(6, '0')}`;
    const inactive = active;
    this.drawTabButton(this.pilotBoardTabBg, this.pilotBoardTab.x, this.pilotBoardTab.y, this.activeLeaderboardView === 'pilots');
    this.drawTabButton(this.corpBoardTabBg, this.corpBoardTab.x, this.corpBoardTab.y, this.activeLeaderboardView === 'corps');
    this.pilotBoardTab.setColor(this.activeLeaderboardView === 'pilots' ? active : inactive);
    this.pilotBoardTab.setAlpha(this.activeLeaderboardView === 'pilots' ? 1 : 0.72);
    this.corpBoardTab.setColor(this.activeLeaderboardView === 'corps' ? active : inactive);
    this.corpBoardTab.setAlpha(this.activeLeaderboardView === 'corps' ? 1 : 0.72);
  }

  private updateModeTabStyles(): void {
    const active = `#${COLORS.HUD.toString(16).padStart(6, '0')}`;
    const inactive = active;
    const mode = this.saveSystem.getSelectedMode();
    this.drawTabButton(this.arcadeBoardTabBg, this.arcadeBoardTab.x, this.arcadeBoardTab.y, mode === RunMode.ARCADE, this.modeTabWidth);
    this.drawTabButton(this.campaignBoardTabBg, this.campaignBoardTab.x, this.campaignBoardTab.y, mode === RunMode.CAMPAIGN, this.modeTabWidth);
    this.arcadeBoardTab.setColor(mode === RunMode.ARCADE ? active : inactive);
    this.arcadeBoardTab.setAlpha(mode === RunMode.ARCADE ? 1 : 0.72);
    this.campaignBoardTab.setColor(mode === RunMode.CAMPAIGN ? active : inactive);
    this.campaignBoardTab.setAlpha(mode === RunMode.CAMPAIGN ? 1 : 0.72);
    this.updateLeaderboardSectionVisibility();
  }

  private drawTabButton(
    bg: Phaser.GameObjects.Graphics,
    centerX: number,
    centerY: number,
    active: boolean,
    width = this.leaderboardTabWidth,
  ): void {
    const height = this.leaderboardTabHeight;
    const left = centerX - width / 2;
    const top = centerY - height / 2;
    const buttonAccent = COLORS.HUD;
    bg.clear();
    bg.fillStyle(COLORS.BG, active ? 0.92 : 0.8);
    bg.lineStyle(1.3, buttonAccent, active ? 0.9 : 0.32);
    bg.fillRoundedRect(left, top, width, height, 8);
    bg.strokeRoundedRect(left, top, width, height, 8);
    bg.fillStyle(buttonAccent, active ? 0.14 : 0.04);
    bg.fillRoundedRect(left + 4, top + 4, width - 8, height - 8, 6);
  }

  private loadLeaderboard(): void {
    // Clear existing entries
    for (const t of this.leaderboardTexts) t.destroy();
    this.leaderboardTexts = [];
    this.clearCorporationGraph();
    this.updateLeaderboardSectionVisibility();
    this.statusText.setPosition(getLayout().centerX, this.leaderboardStatusY);

    if (this.saveSystem.getSelectedMode() === RunMode.CAMPAIGN) {
      this.renderCampaignLeaderboard(this.saveSystem.getCampaignLeaderboard());
      return;
    }

    if (!isOnline()) {
      this.statusText.setText('OFFLINE — GLOBAL BOARDS UNAVAILABLE').setVisible(true);
      this.positionMenuComm();
      return;
    }

    this.statusText.setText('LOADING...').setVisible(true);
    this.positionMenuComm();

    if (this.activeLeaderboardView === 'corps') {
      fetchCorporationLeaderboard('weekly', runModeToLeaderboardMode(RunMode.ARCADE)).then((entries) => {
        if (!this.scene.isActive()) return;

        this.statusText.setVisible(false);
        this.renderCorporationLeaderboard(entries);
      }).catch(() => {
        if (!this.scene.isActive()) return;
        this.statusText.setText('OFFLINE').setVisible(true);
        this.positionMenuComm();
      });
      return;
    }

    fetchLeaderboard('weekly', 10, runModeToLeaderboardMode(RunMode.ARCADE)).then((entries) => {
      if (!this.scene.isActive()) return;
      this.statusText.setVisible(false);
      this.renderLeaderboard(entries);
    }).catch(() => {
      if (!this.scene.isActive()) return;
      this.statusText.setText('OFFLINE').setVisible(true);
      this.positionMenuComm();
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
      this.positionMenuComm();
      return;
    }

    // Cap visible rows so the leaderboard leaves clean space for Slick below it.
    const compactMenu = isNarrowViewport(layout) || isShortViewport(layout);
    const tapY = layout.gameHeight - (compactMenu ? 48 : 60);
    const reservedCommHeight = compactMenu ? 64 : this.slickComm.getPanelHeight();
    const bottomUiTop = tapY - reservedCommHeight - (compactMenu ? 28 : 44);
    const maxRows = Math.max(1, Math.min(compactMenu ? 4 : 6, Math.floor((bottomUiTop - startY) / rowHeight)));
    const visibleEntries = entries.slice(0, maxRows);

    for (let i = 0; i < visibleEntries.length; i++) {
      const entry = visibleEntries[i];
      const y = startY + i * rowHeight;
      const company = entry.company_id ? COMPANIES[entry.company_id] : null;
      const rank = `${i + 1}.`.padEnd(4);
      const companyTag = company ? `${company.leaderboardTag}`.padEnd(4) : ''.padEnd(4);
      const name = entry.player_name.padEnd(8);
      const score = String(Math.floor(entry.score)).padStart(6);
      const line = `${rank}${companyTag}${name}${score}`;
      const rowColor = company
        ? `#${company.color.toString(16).padStart(6, '0')}`
        : i < 3 ? salvageColor : hudColor;

      const text = this.add.text(centerX, y, line, {
        fontFamily: UI_FONT,
        fontSize: this.leaderboardFontSize,
        color: rowColor,
        align: 'center',
      }).setOrigin(0.5).setDepth(uiDepth);

      this.leaderboardTexts.push(text);
    }

    this.positionMenuComm();
  }

  private renderCampaignLeaderboard(entries: LocalCampaignLeaderboardEntry[]): void {
    const layout = getLayout();
    const centerX = layout.centerX;
    const startY = this.campaignLeaderboardStartY;
    const rowHeight = this.leaderboardRowHeight;
    const compactMenu = isNarrowViewport(layout) || isShortViewport(layout);
    const hudColor = `#${COLORS.HUD.toString(16).padStart(6, '0')}`;
    const gateColor = `#${COLORS.GATE.toString(16).padStart(6, '0')}`;
    const salvageColor = `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`;
    const uiDepth = 10;
    const bestScore = this.saveSystem.getCampaignBestScore();

    if (entries.length === 0) {
      this.statusText
        .setPosition(centerX, startY)
        .setText('NO LOCAL CAMPAIGN RUNS YET')
        .setVisible(true);
      this.positionMenuComm();
      return;
    }

    this.statusText.setVisible(false);
    const highScoreText = this.add.text(
      centerX,
      startY,
      compactMenu ? `HIGH SCORE // ${bestScore}c` : `LOCAL HIGH SCORE // ${bestScore}c`,
      {
        fontFamily: UI_FONT,
        fontSize: this.leaderboardFontSize,
        color: salvageColor,
        align: 'center',
      },
    ).setOrigin(0.5).setDepth(uiDepth);
    this.leaderboardTexts.push(highScoreText);

    const tapY = layout.gameHeight - (compactMenu ? 48 : 60);
    const reservedCommHeight = compactMenu ? 64 : this.slickComm.getPanelHeight();
    const bottomUiTop = tapY - reservedCommHeight - (compactMenu ? 28 : 44);
    const rowsStartY = highScoreText.y + highScoreText.height / 2 + (compactMenu ? 14 : 18);
    const footerReserve = rowHeight * (compactMenu ? 1.1 : 1.4);
    const maxRows = Math.max(1, Math.min(compactMenu ? 4 : 6, Math.floor((bottomUiTop - rowsStartY - footerReserve) / rowHeight)));
    const visibleEntries = entries.slice(0, maxRows);

    for (let i = 0; i < visibleEntries.length; i++) {
      const entry = visibleEntries[i];
      const y = rowsStartY + i * rowHeight;
      const line = compactMenu
        ? `${i + 1}. ${entry.playerName}  ${Math.floor(entry.score)}c`
        : `${i + 1}. ${entry.playerName}  ${Math.floor(entry.score)}c // ${entry.missionsCompleted} MISS`;
      const rowColor = i === 0
        ? gateColor
        : i < 3 ? salvageColor : hudColor;
      const text = this.add.text(centerX, y, line, {
        fontFamily: UI_FONT,
        fontSize: this.leaderboardFontSize,
        color: rowColor,
        align: 'center',
        wordWrap: { width: layout.gameWidth - 72, useAdvancedWrap: true },
      }).setOrigin(0.5).setDepth(uiDepth);
      this.leaderboardTexts.push(text);
    }

    this.positionMenuComm();
  }

  private renderCorporationLeaderboard(entries: CorporationLeaderboardEntry[]): void {
    const layout = getLayout();
    const centerX = layout.centerX;
    const rowHeight = this.leaderboardRowHeight;
    const uiDepth = 10;

    if (entries.length === 0) {
      this.statusText.setText('NO CORP SCORES').setVisible(true);
      this.positionMenuComm();
      return;
    }

    const compactMenu = isNarrowViewport(layout) || isShortViewport(layout);
    const tapY = layout.gameHeight - (compactMenu ? 48 : 60);
    const reservedCommHeight = compactMenu ? 64 : this.slickComm.getPanelHeight();
    const bottomUiTop = tapY - reservedCommHeight - (compactMenu ? 28 : 44);
    const graphRadius = Phaser.Math.Clamp(
      Math.round(Math.min(layout.gameWidth * 0.16, (bottomUiTop - this.leaderboardStartY) * 0.18)),
      compactMenu ? 42 : 52,
      compactMenu ? 60 : 74,
    );
    const graphCenterY = this.leaderboardStartY + graphRadius + (compactMenu ? 8 : 12);
    this.corpScoreGraph = new CorporationScoreGraph(this, {
      x: centerX,
      y: graphCenterY,
      radius: graphRadius,
      depth: uiDepth,
      entries,
    });

    const startY = this.corpScoreGraph.getBottomY() + (compactMenu ? 14 : 18);
    const footerReserve = rowHeight * (compactMenu ? 1.1 : 1.4);
    const maxRows = Math.max(1, Math.min(4, Math.floor((bottomUiTop - startY - footerReserve) / rowHeight)));
    const visibleEntries = entries.slice(0, maxRows);

    for (let i = 0; i < visibleEntries.length; i++) {
      const entry = visibleEntries[i];
      const y = startY + i * rowHeight;
      const company = COMPANIES[entry.companyId];
      const rank = `${i + 1}.`.padEnd(4);
      const tag = company.leaderboardTag.padEnd(4);
      const score = `${Math.floor(entry.totalScore)}c`.padStart(7);
      const line = compactMenu
        ? `${rank}${tag}${score}`
        : `${rank}${tag}${company.name.padEnd(16)}${score}`;

      const text = this.add.text(centerX, y, line, {
        fontFamily: UI_FONT,
        fontSize: this.leaderboardFontSize,
        color: `#${company.color.toString(16).padStart(6, '0')}`,
        align: 'center',
      }).setOrigin(0.5).setDepth(uiDepth);

      this.leaderboardTexts.push(text);
    }

    this.positionMenuComm();
  }

  private positionMenuComm(): void {
    if (!this.slickComm) return;

    const layout = getLayout();
    const compactMenu = isNarrowViewport(layout) || isShortViewport(layout);
    const tapY = layout.gameHeight - (compactMenu ? 48 : 60);
    if (compactMenu) {
      this.slickComm.setPinnedCompactLayout(0, 11);
    } else {
      this.slickComm.setPinnedLayout(0, 11);
    }
    const commHeight = this.slickComm.getPanelHeight();
    const topGap = compactMenu ? 12 : 18;
    const bottomGap = compactMenu ? 12 : 18;

    let leaderboardBottom = this.statusText?.visible
      ? this.statusText.y + this.statusText.height / 2
      : this.leaderboardStartY;

    if (this.leaderboardTexts.length > 0) {
      const lastEntry = this.leaderboardTexts[this.leaderboardTexts.length - 1];
      leaderboardBottom = lastEntry.y + lastEntry.height / 2;
    }
    if (this.corpScoreGraph) {
      leaderboardBottom = Math.max(leaderboardBottom, this.corpScoreGraph.getBottomY());
    }

    const availableTop = leaderboardBottom + topGap;
    const availableBottom = tapY - bottomGap;
    const commY = Phaser.Math.Clamp(
      availableTop + Math.max(0, availableBottom - availableTop - commHeight) * 0.5,
      availableTop,
      Math.max(availableTop, availableBottom - commHeight),
    );

    if (compactMenu) {
      this.slickComm.setPinnedCompactLayout(commY, 11);
    } else {
      this.slickComm.setPinnedLayout(commY, 11);
    }
  }

  private updateLeaderboardSectionVisibility(): void {
    const visible = this.saveSystem.getSelectedMode() !== RunMode.CAMPAIGN;
    this.leaderboardTitle.setText(visible ? 'WEEKLY LEADERBOARD' : 'LOCAL CAMPAIGN BOARD');
    for (const obj of this.leaderboardSectionUi) {
      (obj as Phaser.GameObjects.Graphics | Phaser.GameObjects.Text).setVisible(visible);
    }
    for (const hit of this.leaderboardSectionHits) {
      hit.setVisible(visible);
      if (hit.input) {
        hit.input.enabled = visible;
      }
    }
    for (const text of this.leaderboardTexts) {
      text.setVisible(visible);
    }
    if (!visible) {
      this.clearCorporationGraph();
    }
  }

  private clearCorporationGraph(): void {
    this.corpScoreGraph?.destroy();
    this.corpScoreGraph = null;
  }
}
