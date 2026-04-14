import Phaser from 'phaser';
import {
  applyColorPalette,
  COLORS,
  getNextPaletteId,
  PALETTE_LABELS,
  SCENE_KEYS,
  TITLE_FONT,
  UI_FONT,
  readableFontSize,
  type PaletteId,
} from '../constants';
import {
  COMPANIES,
  getCompanyAffiliation,
  getSelectableCompanyIds,
  loadCompanyRep,
  saveSelectedCompanyAffiliation,
} from '../data/companyData';
import { SaveSystem } from '../systems/SaveSystem';
import {
  fetchCorporationLeaderboard,
  fetchLeaderboard,
  fetchBiggestLoss,
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
import { DRIFTER_SPEED_BASE } from '../data/tuning';
import { pickAsteroidSize } from '../data/phaseConfig';
import { getSlickLine } from '../data/slickLines';
import { getLayout, isNarrowViewport, isShortViewport, setLayoutSize } from '../layout';
import { getSettings, updateSettings, type GameSettings } from '../systems/SettingsSystem';
import { refreshMusicForSettings, setMenuMusic, warmMusicCache } from '../systems/MusicSystem';
import { playUiSelectSfx } from '../systems/SfxSystem';
import { CustomCursor } from '../ui/CustomCursor';
import { SettingsSlider } from '../ui/SettingsSlider';
import { RunMode } from '../types';

type Period = 'daily' | 'weekly';
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
  private pilotBoardTabBg!: Phaser.GameObjects.Graphics;
  private pilotBoardTab!: Phaser.GameObjects.Text;
  private pilotBoardTabHit!: Phaser.GameObjects.Zone;
  private corpBoardTabBg!: Phaser.GameObjects.Graphics;
  private corpBoardTab!: Phaser.GameObjects.Text;
  private corpBoardTabHit!: Phaser.GameObjects.Zone;
  private dailyTabBg!: Phaser.GameObjects.Graphics;
  private dailyTab!: Phaser.GameObjects.Text;
  private dailyTabHit!: Phaser.GameObjects.Zone;
  private weeklyTabBg!: Phaser.GameObjects.Graphics;
  private weeklyTab!: Phaser.GameObjects.Text;
  private weeklyTabHit!: Phaser.GameObjects.Zone;
  private settingsButton!: MenuButton;
  private settingsPanelUi: Phaser.GameObjects.GameObject[] = [];
  private paletteButton!: MenuButton;
  private shakeOnButton!: MenuButton;
  private shakeOffButton!: MenuButton;
  private scanOnButton!: MenuButton;
  private scanOffButton!: MenuButton;
  private musicOnButton!: MenuButton;
  private musicOffButton!: MenuButton;
  private musicVolumeSlider!: SettingsSlider;
  private fxVolumeSlider!: SettingsSlider;
  private settingsOpen = false;
  private activePeriod: Period = 'daily';
  private activeLeaderboardView: LeaderboardView = 'pilots';
  private leaderboardStartY = 0;
  private leaderboardRowHeight = 22;
  private leaderboardTabWidth = 104;
  private leaderboardTabHeight = 30;
  private leaderboardFontSize = '14px';
  private biggestLossText: Phaser.GameObjects.Text | null = null;
  private statusText!: Phaser.GameObjects.Text;
  private modeStatusText!: Phaser.GameObjects.Text;
  private pilotText!: Phaser.GameObjects.Text;
  private affiliationLabelText!: Phaser.GameObjects.Text;
  private affiliationButton!: MenuButton;

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
    this.saveSystem.setSelectedMode(RunMode.ARCADE);
    const best = this.saveSystem.getBestScore();
    const playerName = this.saveSystem.getPlayerName();
    const affiliationState = getCompanyAffiliation(loadCompanyRep());
    const affiliatedCompanyId = affiliationState.companyId;
    const affiliatedCompany = affiliatedCompanyId ? COMPANIES[affiliatedCompanyId] : null;
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

    this.affiliationLabelText = this.add.text(centerX, this.pilotText.y + this.pilotText.height + 6, compactMenu ? 'AFFILIATION' : 'WORKING WITH', {
      fontFamily: UI_FONT,
      fontSize: hintSize,
      color: affiliatedCompany
        ? `#${affiliatedCompany.color.toString(16).padStart(6, '0')}`
        : `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(uiDepth).setAlpha(0.84);
    const affiliationButtonWidth = Math.min(layout.gameWidth - (veryCompactMenu ? 112 : 136), veryCompactMenu ? 172 : compactMenu ? 228 : 280);
    const affiliationButtonHeight = veryCompactMenu ? 24 : compactMenu ? 28 : 30;
    this.affiliationButton = this.createMenuButton(
      centerX,
      this.affiliationLabelText.y + this.affiliationLabelText.height + affiliationButtonHeight / 2 + 4,
      affiliationButtonWidth,
      affiliationButtonHeight,
      '',
      uiDepth,
      readableFontSize(veryCompactMenu ? 9 : compactMenu ? 10 : 11),
      () => {
        const repSave = loadCompanyRep();
        const options = [null, ...getSelectableCompanyIds(repSave)];
        const currentCompanyId = getCompanyAffiliation(repSave).companyId;
        const currentIndex = Math.max(0, options.findIndex((companyId) => companyId === currentCompanyId));
        const nextCompanyId = options[(currentIndex + 1) % options.length] ?? null;
        saveSelectedCompanyAffiliation(nextCompanyId);
        this.updateAffiliationSelectorUi();
        if (this.activeLeaderboardView === 'corps') {
          this.loadLeaderboard();
        }
      },
    );

    const layoutTitleBlock = () => {
      titlePrimary.setPosition(centerX, titlePrimaryY);
      titleSecondary.setPosition(centerX, titlePrimary.y + titlePrimary.height + titleSecondaryGap);
      titleTertiary.setPosition(centerX, titleSecondary.y + titleSecondary.height + titleTertiaryGap);
      this.pilotText.setPosition(centerX, titleTertiary.y + titleTertiary.height + pilotGap);
      this.affiliationLabelText.setPosition(centerX, this.pilotText.y + this.pilotText.height + 6);
      this.positionMenuButton(
        this.affiliationButton,
        centerX,
        this.affiliationLabelText.y + this.affiliationLabelText.height + affiliationButtonHeight / 2 + 4,
      );
    };
    layoutTitleBlock();
    this.updateAffiliationSelectorUi();
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
        this.updateAffiliationSelectorUi();
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
      this.updateAffiliationSelectorUi();
    });

    const editHint = this.add.text(
      centerX,
      this.affiliationButton.label.y + affiliationButtonHeight / 2 + 4,
      veryCompactMenu ? 'TAP CALLSIGN OR CORP' : 'TAP CALLSIGN TO EDIT // TAP CORP TO SWITCH',
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
    const modeStatusY = leaderboardTitleTop + (veryCompactMenu ? 8 : 10);
    this.modeStatusText = this.add.text(centerX, modeStatusY, '', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(veryCompactMenu ? 10 : 11),
      color: hudColor,
      align: 'center',
      wordWrap: { width: layout.gameWidth - (veryCompactMenu ? 72 : 96), useAdvancedWrap: true },
    }).setOrigin(0.5, 0).setDepth(uiDepth).setAlpha(0.76);
    this.updateModeUi();
    leaderboardTitleTop = this.modeStatusText.y + this.modeStatusText.height + (veryCompactMenu ? 14 : 16);

    // Leaderboard section
    const tabGap = veryCompactMenu ? 12 : 16;
    const tabOffset = this.leaderboardTabWidth / 2 + tabGap / 2;
    const corpTabX = centerX - tabOffset;
    const pilotTabX = centerX + tabOffset;
    const dailyTabX = centerX - tabOffset;
    const weeklyTabX = centerX + tabOffset;

    const leaderboardTitle = this.add.text(centerX, leaderboardTitleTop, 'LEADERBOARD', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(veryCompactMenu ? 12 : 14),
      color: hudColor,
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(uiDepth).setAlpha(0.68);
    const boardTabY = leaderboardTitle.y + leaderboardTitle.height + (veryCompactMenu ? 10 : 14) + this.leaderboardTabHeight / 2;
    const periodTabY = boardTabY + this.leaderboardTabHeight + (veryCompactMenu ? 10 : 14);

    this.pilotBoardTabBg = this.add.graphics().setDepth(uiDepth);
    this.corpBoardTabBg = this.add.graphics().setDepth(uiDepth);
    this.dailyTabBg = this.add.graphics().setDepth(uiDepth);
    this.weeklyTabBg = this.add.graphics().setDepth(uiDepth);

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

    this.dailyTab = this.add.text(dailyTabX, periodTabY, 'DAILY', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(compactMenu ? 15 : 16),
      color: gateColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(uiDepth + 1);

    this.weeklyTab = this.add.text(weeklyTabX, periodTabY, 'WEEKLY', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(compactMenu ? 15 : 16),
      color: hudColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(uiDepth + 1);

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

    this.dailyTabHit = this.add.zone(
      dailyTabX - this.leaderboardTabWidth / 2,
      periodTabY - this.leaderboardTabHeight / 2,
      this.leaderboardTabWidth,
      this.leaderboardTabHeight,
    ).setData('cornerRadius', 8).setOrigin(0, 0).setDepth(uiDepth + 2).setInteractive({ useHandCursor: true });
    this.weeklyTabHit = this.add.zone(
      weeklyTabX - this.leaderboardTabWidth / 2,
      periodTabY - this.leaderboardTabHeight / 2,
      this.leaderboardTabWidth,
      this.leaderboardTabHeight,
    ).setData('cornerRadius', 8).setOrigin(0, 0).setDepth(uiDepth + 2).setInteractive({ useHandCursor: true });

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

    this.dailyTabHit.on('pointerdown', (e: Phaser.Input.Pointer) => {
      e.event.stopPropagation();
      if (this.activePeriod !== 'daily') {
        playUiSelectSfx(this);
        this.activePeriod = 'daily';
        this.updateTabStyles();
        this.loadLeaderboard();
      }
    });

    this.weeklyTabHit.on('pointerdown', (e: Phaser.Input.Pointer) => {
      e.event.stopPropagation();
      if (this.activePeriod !== 'weekly') {
        playUiSelectSfx(this);
        this.activePeriod = 'weekly';
        this.updateTabStyles();
        this.loadLeaderboard();
      }
    });

    this.updateLeaderboardViewStyles();
    this.updateTabStyles();

    // Divider line under tabs
    const divider = this.add.graphics().setDepth(uiDepth);
    divider.lineStyle(1, COLORS.HUD, 0.3);
    const dividerY = periodTabY + this.leaderboardTabHeight / 2 + (veryCompactMenu ? 6 : 10);
    divider.lineBetween(centerX - 120, dividerY, centerX + 120, dividerY);
    this.leaderboardStartY = dividerY + (veryCompactMenu ? 12 : 18);

    // Status text (loading / offline)
    this.statusText = this.add.text(centerX, this.leaderboardStartY + (veryCompactMenu ? 8 : 12), 'LOADING...', {
      fontFamily: UI_FONT,
      fontSize: this.leaderboardFontSize,
      color: hudColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(uiDepth);

    // TAP TO START — anchored from bottom
    const tapY = layout.gameHeight - (shortMenu ? 48 : 60);
    const tapText = this.add.text(centerX, tapY, 'TAP TO START', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(veryCompactMenu ? 22 : 26),
      color: gateColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(uiDepth);

    // How to play — anchored above TAP TO START
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
      this.scene.start(SCENE_KEYS.MISSION_SELECT, {
        ...backgroundHandoff,
        mode: RunMode.ARCADE,
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
    this.titlePilot.update(delta);
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

  private createSettingsUi(uiDepth: number, backingTop: number, compactMenu: boolean, veryCompactMenu: boolean): void {
    const layout = getLayout();
    const hudColor = `#${COLORS.HUD.toString(16).padStart(6, '0')}`;
    const buttonWidth = compactMenu ? 98 : 108;
    const buttonCenterX = layout.gameWidth - (compactMenu ? 76 : 82);
    const buttonCenterY = backingTop + (veryCompactMenu ? 16 : 18);
    const panelWidth = compactMenu ? 214 : 226;
    const settingsRowGap = veryCompactMenu ? 30 : 34;
    const panelHeight = veryCompactMenu ? 236 : 264;
    const panelLeft = layout.gameWidth - panelWidth - 24;
    const panelTop = buttonCenterY + 22;
    const rowPaletteY = panelTop + (veryCompactMenu ? 26 : 30);
    const rowOneY = rowPaletteY + settingsRowGap;
    const rowTwoY = rowOneY + settingsRowGap;
    const rowThreeY = rowTwoY + settingsRowGap;
    const musicVolumeLabelY = rowThreeY + (veryCompactMenu ? 32 : 38);
    const musicVolumeY = musicVolumeLabelY + (veryCompactMenu ? 14 : 18);
    const fxVolumeLabelY = musicVolumeY + (veryCompactMenu ? 18 : 28);
    const fxVolumeY = fxVolumeLabelY + (veryCompactMenu ? 14 : 18);
    const offX = panelLeft + panelWidth - 30;
    const onX = offX - 52;
    const paletteButtonX = panelLeft + panelWidth - 63;
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

    const paletteLabel = this.add.text(panelLeft + 14, rowPaletteY, 'PALETTE', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(10),
      color: hudColor,
      align: 'left',
    }).setOrigin(0, 0.5).setDepth(uiDepth + 3);

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

    this.paletteButton = this.createMenuButton(
      paletteButtonX,
      rowPaletteY,
      94,
      24,
      PALETTE_LABELS[getSettings().paletteId],
      uiDepth + 3,
      readableFontSize(10),
      () => this.applyMenuSettings({ paletteId: getNextPaletteId(getSettings().paletteId) }),
    );
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
      paletteLabel,
      this.paletteButton.bg,
      this.paletteButton.label,
      this.paletteButton.hit,
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

  private positionMenuButton(button: MenuButton, centerX: number, centerY: number): void {
    button.label.setPosition(centerX, centerY);
    button.hit.setPosition(centerX - button.width / 2, centerY - button.height / 2);
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

  private drawPaletteMenuButton(button: MenuButton, paletteId: PaletteId): void {
    const left = button.label.x - button.width / 2;
    const top = button.label.y - button.height / 2;
    const buttonAccent = COLORS.HUD;
    button.bg.clear();
    button.bg.fillStyle(COLORS.BG, 0.92);
    button.bg.lineStyle(1.1, buttonAccent, 0.5);
    button.bg.fillRoundedRect(left, top, button.width, button.height, 8);
    button.bg.strokeRoundedRect(left, top, button.width, button.height, 8);
    button.bg.fillStyle(buttonAccent, 0.08);
    button.bg.fillRoundedRect(left + 4, top + 4, button.width - 8, button.height - 8, 6);
    button.label.setText(PALETTE_LABELS[paletteId]);
    button.label.setColor(`#${buttonAccent.toString(16).padStart(6, '0')}`);
    button.label.setAlpha(0.9);
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
    if (partial.paletteId) {
      applyColorPalette(updated.paletteId);
      this.scene.restart({
        ...this.buildBackgroundHandoff(),
        reopenSettings: this.settingsOpen,
      } satisfies BackgroundHandoffData);
      return;
    }
    this.hologramOverlay.setEnabled(updated.scanlines);
    refreshMusicForSettings(this);
    this.updateSettingsUi();
  }

  private updateSettingsUi(): void {
    this.drawMenuButton(this.settingsButton, this.settingsButton.label.x, this.settingsButton.label.y, this.settingsOpen);

    const settings = getSettings();
    this.drawPaletteMenuButton(this.paletteButton, settings.paletteId);
    this.drawMenuButton(this.shakeOnButton, this.shakeOnButton.label.x, this.shakeOnButton.label.y, settings.screenShake);
    this.drawMenuButton(this.shakeOffButton, this.shakeOffButton.label.x, this.shakeOffButton.label.y, !settings.screenShake);
    this.drawMenuButton(this.scanOnButton, this.scanOnButton.label.x, this.scanOnButton.label.y, settings.scanlines);
    this.drawMenuButton(this.scanOffButton, this.scanOffButton.label.x, this.scanOffButton.label.y, !settings.scanlines);
    this.drawMenuButton(this.musicOnButton, this.musicOnButton.label.x, this.musicOnButton.label.y, settings.musicEnabled);
    this.drawMenuButton(this.musicOffButton, this.musicOffButton.label.x, this.musicOffButton.label.y, !settings.musicEnabled);
    this.musicVolumeSlider.setValue(settings.musicVolume);
    this.fxVolumeSlider.setValue(settings.fxVolume);
  }

  private updateModeUi(): void {
    if (!this.modeStatusText) {
      return;
    }

    const layout = getLayout();
    const compactStatus = isNarrowViewport(layout) || isShortViewport(layout);
    const walletCredits = this.saveSystem.getWalletCredits(RunMode.ARCADE);
    this.modeStatusText
      .setText(`WALLET ${walletCredits}c\n${compactStatus ? 'ARCADE ONLY // LIVE BOARD' : 'ARCADE ONLY // LEADERBOARD LIVE'}`)
      .setColor(`#${COLORS.GATE.toString(16).padStart(6, '0')}`);
  }

  private updateAffiliationSelectorUi(): void {
    if (!this.affiliationLabelText || !this.affiliationButton) {
      return;
    }

    const layout = getLayout();
    const compactMenu = layout.gameHeight <= 720 || layout.gameWidth <= 400;
    const repSave = loadCompanyRep();
    const selectableCompanies = getSelectableCompanyIds(repSave);
    const affiliationState = getCompanyAffiliation(repSave);
    const affiliatedCompany = affiliationState.companyId ? COMPANIES[affiliationState.companyId] : null;
    const accent = affiliatedCompany?.color ?? COLORS.HUD;
    const label = affiliatedCompany
      ? compactMenu
        ? affiliatedCompany.leaderboardTag
        : `${affiliatedCompany.leaderboardTag} // ${affiliatedCompany.name}`
      : selectableCompanies.length > 0
        ? 'FREE AGENT'
        : compactMenu ? 'EARN REP' : 'EARN REP TO UNLOCK';

    this.affiliationLabelText
      .setText(compactMenu ? 'AFFILIATION' : 'WORKING WITH')
      .setColor(`#${accent.toString(16).padStart(6, '0')}`);
    this.affiliationButton.label.setText(label);
    this.drawMenuButton(
      this.affiliationButton,
      this.affiliationButton.label.x,
      this.affiliationButton.label.y,
      true,
      accent,
    );
    this.affiliationButton.label.setColor(`#${accent.toString(16).padStart(6, '0')}`);
    this.affiliationButton.label.setAlpha(0.96);
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

  private updateTabStyles(): void {
    const active = `#${COLORS.HUD.toString(16).padStart(6, '0')}`;
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
    if (this.biggestLossText) { this.biggestLossText.destroy(); this.biggestLossText = null; }
    this.statusText.setText('LOADING...').setVisible(true);
    this.positionMenuComm();

    if (this.activeLeaderboardView === 'corps') {
      fetchCorporationLeaderboard(this.activePeriod).then((entries) => {
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

    Promise.all([
      fetchLeaderboard(this.activePeriod, 10),
      fetchBiggestLoss(this.activePeriod),
    ]).then(([entries, biggestLoss]) => {
      // Scene may have been left while loading
      if (!this.scene.isActive()) return;

      this.statusText.setVisible(false);
      this.renderLeaderboard(entries);
      this.renderBiggestLoss(biggestLoss);
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

  private renderCorporationLeaderboard(entries: CorporationLeaderboardEntry[]): void {
    const layout = getLayout();
    const centerX = layout.centerX;
    const startY = this.leaderboardStartY;
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
    const footerReserve = rowHeight * (compactMenu ? 1.4 : 1.7);
    const maxRows = Math.max(1, Math.min(4, Math.floor((bottomUiTop - startY - footerReserve) / rowHeight)));
    const visibleEntries = entries.slice(0, maxRows);

    for (let i = 0; i < visibleEntries.length; i++) {
      const entry = visibleEntries[i];
      const y = startY + i * rowHeight;
      const company = COMPANIES[entry.companyId];
      const totalScore = Math.floor(entry.totalScore);
      const line = compactMenu
        ? `${i + 1}. ${company.leaderboardTag}  ${totalScore}c // ${entry.runCount} RUNS`
        : `${i + 1}. ${company.leaderboardTag} ${company.name}  ${totalScore}c // ${entry.runCount} RUNS`;

      const text = this.add.text(centerX, y, line, {
        fontFamily: UI_FONT,
        fontSize: this.leaderboardFontSize,
        color: `#${company.color.toString(16).padStart(6, '0')}`,
        align: 'center',
        wordWrap: { width: layout.gameWidth - 72, useAdvancedWrap: true },
      }).setOrigin(0.5).setDepth(uiDepth);

      this.leaderboardTexts.push(text);
    }

    const affiliationState = getCompanyAffiliation(loadCompanyRep());
    const affiliatedCompany = affiliationState.companyId ? COMPANIES[affiliationState.companyId] : null;
    const footerLine = affiliatedCompany
      ? `${compactMenu ? 'FLYING' : 'CURRENT AFFILIATION'}  ${affiliatedCompany.leaderboardTag} // ${affiliationState.source === 'selected' ? 'SELECTED' : 'HIGHEST REP'}`
      : `${compactMenu ? 'FLYING' : 'CURRENT AFFILIATION'}  ${affiliationState.source === 'selected' ? 'FREE AGENT // SELECTED' : 'NONE // EARN REP'}`;
    this.renderLeaderboardFooter(
      footerLine,
      affiliatedCompany
        ? `#${affiliatedCompany.color.toString(16).padStart(6, '0')}`
        : `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      uiDepth,
    );
    this.positionMenuComm();
  }

  private renderBiggestLoss(entry: LeaderboardEntry | null): void {
    if (!entry) return;

    const layout = getLayout();
    const uiDepth = 10;
    const deathColor = '#ff3366';
    const compactMenu = isNarrowViewport(layout) || isShortViewport(layout);
    const company = entry.company_id ? COMPANIES[entry.company_id] : null;
    const companyTag = company ? `${company.leaderboardTag} ` : '';
    const line = `${compactMenu ? 'LOSS' : 'BIGGEST LOSS'}  ${companyTag}${entry.player_name}  ${Math.floor(entry.score)}`;
    this.renderLeaderboardFooter(line, deathColor, uiDepth);
  }

  private renderLeaderboardFooter(line: string, color: string, uiDepth = 10): void {
    const layout = getLayout();
    const centerX = layout.centerX;
    const rowHeight = this.leaderboardRowHeight;

    let topY = this.leaderboardStartY;
    if (this.leaderboardTexts.length > 0) {
      const last = this.leaderboardTexts[this.leaderboardTexts.length - 1];
      topY = last.y + rowHeight;
    } else if (this.statusText?.visible) {
      topY = this.statusText.y + rowHeight;
    }

    const y = topY + rowHeight * 0.4;
    this.biggestLossText = this.add.text(centerX, y, line, {
      fontFamily: UI_FONT,
      fontSize: this.leaderboardFontSize,
      color,
      align: 'center',
      wordWrap: { width: layout.gameWidth - 72, useAdvancedWrap: true },
    }).setOrigin(0.5).setDepth(uiDepth);

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

    if (this.biggestLossText) {
      leaderboardBottom = this.biggestLossText.y + this.biggestLossText.height / 2;
    } else if (this.leaderboardTexts.length > 0) {
      const lastEntry = this.leaderboardTexts[this.leaderboardTexts.length - 1];
      leaderboardBottom = lastEntry.y + lastEntry.height / 2;
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
}
