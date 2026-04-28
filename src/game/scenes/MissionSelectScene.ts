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
import { colorStr } from '../utils/geometry';
import { getLayout, isNarrowViewport, isShortViewport, setLayoutSize } from '../layout';
import { loadOrGenerateMissions, loadMissionSave, MAX_REROLLS, saveMissionSelection } from '../systems/MissionSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { generateMission } from '../data/missionCatalog';
import {
  COMPANIES,
  COMPANY_IDS,
  getCompanyAffiliation,
  getRepStanding,
  getRunBoostsFromAffiliation,
  loadCompanyRep,
  REP_PER_TIER,
  saveSelectedCompanyAffiliation,
} from '../data/companyData';
import { CompanyId, RunMode } from '../types';
import type { ActiveMission } from '../types';
import { refreshMusicForSettings, setMissionMusic, warmMusicCache } from '../systems/MusicSystem';
import { playUiSelectSfx } from '../systems/SfxSystem';
import { getSettings, updateSettings, type GameSettings } from '../systems/SettingsSystem';
import { CustomCursor } from '../ui/CustomCursor';
import { HologramOverlay } from '../ui/HologramOverlay';
import { SettingsSlider } from '../ui/SettingsSlider';
import { SalvageDebris } from '../entities/SalvageDebris';
import { DrifterHazard } from '../entities/DrifterHazard';
import { NPCShip } from '../entities/NPCShip';
import { GeoSphere } from '../entities/GeoSphere';
import { DRIFTER_SPEED_BASE } from '../data/tuning';
import { pickAsteroidSize } from '../data/phaseConfig';

interface HandoffData {
  drifterState?: { x: number; y: number; vx: number; vy: number; radiusScale: number }[];
  debrisState?: { x: number; y: number; vx: number; vy: number }[];
  npcState?: { x: number; y: number; vx: number; vy: number }[];
  mode?: RunMode;
  reopenSettings?: boolean;
  rerollsUsedThisVisit?: number;
}

interface BriefingLayoutConfig {
  compact: boolean;
  narrow: boolean;
  veryCompact: boolean;
  titleY: number;
  subtitleY: number;
  instructionY: number;
  cardMarginX: number;
  cardWidth: number;
  cardTop: number;
  cardHeight: number;
  cardGap: number;
  rerollY: number;
  rerollHeight: number;
  repHeaderY: number;
  repGridTop: number;
  repRowWidth: number;
  repRowHeight: number;
  repRowGap: number;
  deployY: number;
  deployButtonWidth: number;
  deployButtonHeight: number;
}

type MissionButton = {
  bg: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  hit: Phaser.GameObjects.Zone;
  width: number;
  height: number;
};

const CARD_HEIGHT = 68;
const CARD_GAP = 8;
const CARD_MARGIN_X = 32;
const REP_ROW_GAP = 6;
const REP_SECTION_GAP = 10;
const REROLL_BASE_COST = 200;
const BG_MAX_DEBRIS = 2;
const BG_MAX_DRIFTERS = 5;
const BG_MAX_NPCS = 2;
const BG_DRIFTER_SPAWN_MS = 800;
const BG_DEBRIS_SPAWN_MS = 2000;
const BG_NPC_SPAWN_MS = 2500;
const BACKGROUND_STARFIELD_OVERSCAN = 96;
const BACKGROUND_STARFIELD_COUNT = 170;

export class MissionSelectScene extends Phaser.Scene {
  private saveSystem!: SaveSystem;
  private handoff: HandoffData = {};
  private runMode: RunMode = RunMode.ARCADE;
  private missions: ActiveMission[] = [];
  private cardUi: Phaser.GameObjects.GameObject[][] = [];
  private navUi: Phaser.GameObjects.GameObject[] = [];
  private deployUi: Phaser.GameObjects.GameObject[] = [];
  private rerollUi: Phaser.GameObjects.GameObject[] = [];
  private repPanelUi: Phaser.GameObjects.GameObject[] = [];
  private rerollsRemaining = MAX_REROLLS;
  private rerollsUsedThisVisit = 0;
  private cursor!: CustomCursor;
  private hologramOverlay!: HologramOverlay;
  private settingsButton!: MissionButton;
  private settingsPanelUi: Phaser.GameObjects.GameObject[] = [];
  private paletteButton!: MissionButton;
  private shakeOnButton!: MissionButton;
  private shakeOffButton!: MissionButton;
  private scanOnButton!: MissionButton;
  private scanOffButton!: MissionButton;
  private musicOnButton!: MissionButton;
  private musicOffButton!: MissionButton;
  private musicVolumeSlider!: SettingsSlider;
  private fxVolumeSlider!: SettingsSlider;
  private settingsOpen = false;
  private bgDebris: SalvageDebris[] = [];
  private bgDrifters: DrifterHazard[] = [];
  private bgNpcs: NPCShip[] = [];
  private geoSphere!: GeoSphere;
  private drifterTimer = 0;
  private debrisTimer = 0;
  private npcTimer = 0;

  constructor() {
    super(SCENE_KEYS.MISSION_SELECT);
  }

  create(data?: HandoffData): void {
    this.events.once('shutdown', this.cleanup, this);
    this.cursor = new CustomCursor(this);
    setLayoutSize(this.scale.width, this.scale.height);
    applyColorPalette(getSettings().paletteId);
    setMissionMusic(this);
    warmMusicCache(this);
    const layout = getLayout();
    const briefing = this.getBriefingLayoutConfig();

    this.saveSystem = new SaveSystem();
    this.handoff = data ?? {};
    this.runMode = this.handoff.mode ?? this.saveSystem.getSelectedMode();
    this.saveSystem.setSelectedMode(this.runMode);
    if (this.runMode === RunMode.CAMPAIGN) {
      this.saveSystem.ensureCampaignSession();
    }
    this.missions = loadOrGenerateMissions();
    this.rerollsUsedThisVisit = this.handoff.rerollsUsedThisVisit ?? 0;
    this.bgDebris = [];
    this.bgDrifters = [];
    this.bgNpcs = [];
    this.settingsOpen = false;
    this.drifterTimer = 0;
    this.debrisTimer = 0;
    this.npcTimer = 0;

    const saved = loadMissionSave();
    this.rerollsRemaining = saved.rerollsRemaining ?? MAX_REROLLS;

    const starfield = this.add.graphics().setDepth(-1);
    starfield.fillStyle(COLORS.STARFIELD_BG, 1);
    starfield.fillRect(
      -BACKGROUND_STARFIELD_OVERSCAN,
      -BACKGROUND_STARFIELD_OVERSCAN,
      layout.gameWidth + BACKGROUND_STARFIELD_OVERSCAN * 2,
      layout.gameHeight + BACKGROUND_STARFIELD_OVERSCAN * 2,
    );
    for (let i = 0; i < BACKGROUND_STARFIELD_COUNT; i++) {
      const sx = Phaser.Math.Between(-BACKGROUND_STARFIELD_OVERSCAN, layout.gameWidth + BACKGROUND_STARFIELD_OVERSCAN);
      const sy = Phaser.Math.Between(-BACKGROUND_STARFIELD_OVERSCAN, layout.gameHeight + BACKGROUND_STARFIELD_OVERSCAN);
      const brightness = Phaser.Math.FloatBetween(0.1, 0.4);
      const size = Phaser.Math.FloatBetween(0.5, 1.2);
      const starColor = Math.random() < 0.6 ? COLORS.PLAYER : 0xffffff;
      starfield.fillStyle(starColor, brightness);
      starfield.fillCircle(sx, sy, size);
    }
    this.geoSphere = new GeoSphere(this);
    this.restoreBackgroundEntities();

    this.hologramOverlay = new HologramOverlay(this);
    this.hologramOverlay.setEnabled(getSettings().scanlines);

    this.add.text(layout.centerX, briefing.titleY, 'JOB BOARD', {
      fontFamily: TITLE_FONT,
      fontSize: readableFontSize(briefing.veryCompact ? 15 : briefing.compact ? 17 : 19),
      color: colorStr(COLORS.HUD),
      align: 'center',
    }).setOrigin(0.5).setDepth(10);

    this.add.text(layout.centerX, briefing.subtitleY, this.getModeSubtitle(), {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(briefing.veryCompact ? 8 : briefing.compact ? 9 : 10),
      color: colorStr(COLORS.GATE),
      align: 'center',
    }).setOrigin(0.5).setDepth(10).setAlpha(0.72);

    for (let i = 0; i < 3; i++) {
      this.drawCard(i);
    }

    this.drawRerollButton();
    this.drawRepPanel();
    this.drawMenuButton();
    this.createSettingsUi();
    this.drawDeployButton();
    if (this.handoff.reopenSettings) {
      this.setSettingsOpen(true);
    }
  }

  private getBriefingLayoutConfig(): BriefingLayoutConfig {
    const layout = getLayout();
    const narrow = isNarrowViewport(layout);
    const shortHeight = isShortViewport(layout);
    const compact = layout.gameHeight <= 860 || narrow;
    const veryCompact = layout.gameHeight <= 640 || (narrow && shortHeight);
    const tight = layout.gameHeight <= 640 || shortHeight;
    const cardMarginX = Phaser.Math.Clamp(Math.round(layout.gameWidth * (veryCompact ? 0.045 : 0.05)), veryCompact ? 16 : 20, CARD_MARGIN_X);
    const cardWidth = layout.gameWidth - cardMarginX * 2;
    const titleY = Phaser.Math.Clamp(Math.round(layout.gameHeight * (veryCompact ? 0.062 : 0.075)), veryCompact ? 38 : compact ? 46 : 50, 72);
    const subtitleY = titleY + (veryCompact ? 16 : compact ? 18 : 22);
    const instructionY = subtitleY + (veryCompact ? 12 : compact ? 14 : 16);
    const cardHeight = Phaser.Math.Clamp(Math.round(layout.gameHeight * (veryCompact ? 0.068 : 0.075)), veryCompact ? 54 : 58, CARD_HEIGHT);
    const cardGap = veryCompact ? 6 : compact ? 8 : CARD_GAP;
    const cardTop = instructionY + (veryCompact ? 12 : compact ? 14 : 18);
    const missionToRerollGap = veryCompact ? 6 : tight ? 8 : compact ? 12 : 14;
    const rerollHeight = veryCompact ? 26 : compact ? 28 : 32;
    const rerollY = cardTop + cardHeight * 3 + cardGap * 2 + missionToRerollGap;
    const repRowGap = veryCompact ? 4 : tight ? 4 : compact ? 5 : REP_ROW_GAP;
    const rerollToHeaderGap = veryCompact ? 8 : tight ? 9 : compact ? 12 : REP_SECTION_GAP + 4;
    const headerOffset = veryCompact ? 6 : compact ? 8 : 10;
    const headerToGridGap = (veryCompact ? 10 : tight ? 12 : compact ? 16 : 18) + headerOffset;
    const repHeaderY = rerollY + rerollHeight + rerollToHeaderGap;
    const repGridTop = repHeaderY + headerToGridGap;
    const deployButtonWidth = veryCompact ? 170 : compact ? 184 : 200;
    const deployButtonHeight = veryCompact ? 36 : compact ? 40 : 46;
    const deployY = layout.gameHeight - (veryCompact ? 26 : compact ? 34 : 50);
    const repRowWidth = cardWidth;
    const repToDeployGap = veryCompact ? 8 : tight ? 10 : compact ? 14 : 16;
    const repRowsAvailableHeight = Math.floor((deployY - deployButtonHeight / 2) - repToDeployGap - repGridTop);
    const repRowHeightMax = veryCompact ? 44 : compact ? 50 : 56;
    const repRowHeight = Math.max(28, Math.min(
      repRowHeightMax,
      Math.floor((repRowsAvailableHeight - repRowGap * (COMPANY_IDS.length - 1)) / COMPANY_IDS.length),
    ));

    return {
      compact,
      narrow,
      veryCompact,
      titleY,
      subtitleY,
      instructionY,
      cardMarginX,
      cardWidth,
      cardTop,
      cardHeight,
      cardGap,
      rerollY,
      rerollHeight,
      repHeaderY,
      repGridTop,
      repRowWidth,
      repRowHeight,
      repRowGap,
      deployY,
      deployButtonWidth,
      deployButtonHeight,
    };
  }

  private drawCard(index: number): void {
    if (this.cardUi[index]) {
      for (const obj of this.cardUi[index]) obj.destroy();
    }
    this.cardUi[index] = [];

    const briefing = this.getBriefingLayoutConfig();
    const mission = this.missions[index];
    const cardTop = briefing.cardTop + index * (briefing.cardHeight + briefing.cardGap);
    const cardLeft = briefing.cardMarginX;
    const cardWidth = briefing.cardWidth;
    const isAccepted = mission.accepted;
    const borderColor = isAccepted ? COLORS.GATE : COLORS.HUD;
    const depth = 10;

    const companyDef = COMPANIES[mission.def.company];
    const companyColor = companyDef.color;
    const missionRepGain = REP_PER_TIER[mission.def.tier];

    const bg = this.add.graphics().setDepth(depth);
    bg.fillStyle(COLORS.BG, 0.9);
    bg.fillRoundedRect(cardLeft, cardTop, cardWidth, briefing.cardHeight, 8);
    if (isAccepted) {
      bg.fillStyle(companyColor, 0.14);
      bg.fillRoundedRect(cardLeft + 1, cardTop + 1, cardWidth - 2, briefing.cardHeight - 2, 8);
    }
    bg.lineStyle(isAccepted ? 2 : 1.35, borderColor, isAccepted ? 0.88 : 0.26);
    bg.strokeRoundedRect(cardLeft, cardTop, cardWidth, briefing.cardHeight, 8);
    bg.fillStyle(companyColor, isAccepted ? 0.96 : 0.58);
    bg.fillRoundedRect(cardLeft + 5, cardTop + 5, 5, briefing.cardHeight - 10, 2);
    this.cardUi[index].push(bg);

    const hitZone = this.add.zone(cardLeft, cardTop, cardWidth, briefing.cardHeight)
      .setData('cornerRadius', 8)
      .setOrigin(0, 0)
      .setDepth(depth + 3)
      .setInteractive({ useHandCursor: true });

    hitZone.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      playUiSelectSfx(this);
      const wasAccepted = this.missions[index].accepted;
      this.missions[index].accepted = !wasAccepted;
      this.saveMissions();
      this.drawCard(index);
    });

    this.cardUi[index].push(hitZone);

    if (isAccepted) {
      const check = this.add.text(cardLeft + cardWidth - 14, cardTop + 7, '\u2713', {
        fontFamily: UI_FONT,
        fontSize: readableFontSize(briefing.veryCompact ? 14 : briefing.compact ? 16 : 18),
        color: colorStr(companyColor),
      }).setOrigin(1, 0).setDepth(depth + 1);
      this.cardUi[index].push(check);
    }

    const labelWidth = cardWidth - (isAccepted ? 52 : 28);
    const label = this.add.text(cardLeft + 14, cardTop + (briefing.compact ? 13 : 14), mission.def.label, {
      fontFamily: TITLE_FONT,
      fontSize: readableFontSize(briefing.veryCompact ? 12 : briefing.compact ? 14 : 16),
      color: colorStr(companyColor),
      wordWrap: { width: labelWidth },
    }).setDepth(depth + 1);
    label.setLineSpacing(briefing.veryCompact ? -3 : briefing.compact ? -2 : -1);
    this.cardUi[index].push(label);

    const footerY = cardTop + briefing.cardHeight - (briefing.veryCompact ? 6 : briefing.compact ? 8 : 9);

    const payoutFontSize = readableFontSize(briefing.veryCompact ? 9 : briefing.compact ? 10 : 11);
    const creditRewardText = this.add.text(cardLeft + cardWidth - 14, footerY - (briefing.veryCompact ? 11 : 12), `+${mission.def.reward}c`, {
      fontFamily: UI_FONT,
      fontSize: payoutFontSize,
      fontStyle: 'bold',
      color: colorStr(companyColor),
      align: 'right',
    }).setOrigin(1, 1).setDepth(depth + 1).setAlpha(0.78);
    this.cardUi[index].push(creditRewardText);

    const repRewardText = this.add.text(cardLeft + cardWidth - 14, footerY, `+${missionRepGain} REP`, {
      fontFamily: UI_FONT,
      fontSize: payoutFontSize,
      fontStyle: 'bold',
      color: colorStr(companyColor),
    }).setOrigin(1, 1).setDepth(depth + 1);
    this.cardUi[index].push(repRewardText);
  }

  private drawRerollButton(): void {
    for (const obj of this.rerollUi) obj.destroy();
    this.rerollUi = [];

    const layout = getLayout();
    const briefing = this.getBriefingLayoutConfig();
    const rerollY = this.getRerollY();
    const rerollCost = this.getCurrentRerollCost();
    const availableWallet = this.saveSystem.getWalletCredits(this.runMode);
    const hasRerolls = this.rerollsRemaining > 0;
    const canAfford = availableWallet >= rerollCost;
    const canReroll = hasRerolls && canAfford;
    const btnWidth = briefing.veryCompact ? 152 : briefing.compact ? 164 : 178;
    const btnHeight = briefing.rerollHeight;
    const btnX = layout.centerX - btnWidth / 2;

    const btnGfx = this.add.graphics().setDepth(10);
    btnGfx.fillStyle(canReroll ? COLORS.HUD : COLORS.HAZARD, canReroll ? 0.08 : 0.04);
    btnGfx.fillRoundedRect(btnX, rerollY, btnWidth, btnHeight, 8);
    btnGfx.lineStyle(1.5, canReroll ? COLORS.HUD : COLORS.HAZARD, canReroll ? 0.4 : 0.2);
    btnGfx.strokeRoundedRect(btnX, rerollY, btnWidth, btnHeight, 8);
    this.rerollUi.push(btnGfx);

    const labelStr = hasRerolls ? `REROLL ${rerollCost}c (${this.rerollsRemaining})` : 'NO REROLLS';
    const color = canReroll ? COLORS.HUD : COLORS.HAZARD;
    const label = this.add.text(layout.centerX, rerollY + btnHeight / 2, labelStr, {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(briefing.veryCompact ? 10 : briefing.compact ? 11 : 12),
      color: colorStr(color),
      align: 'center',
    }).setOrigin(0.5).setDepth(11).setAlpha(canReroll ? 0.8 : 0.4);
    this.rerollUi.push(label);

    if (canReroll) {
      const rerollHit = this.add.zone(btnX, rerollY, btnWidth, btnHeight)
        .setData('cornerRadius', 8)
        .setOrigin(0, 0)
        .setDepth(12)
        .setInteractive({ useHandCursor: true });
      rerollHit.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        playUiSelectSfx(this);
        this.executeReroll();
      });
      this.rerollUi.push(rerollHit);
    }
  }

  private drawMenuButton(): void {
    for (const obj of this.navUi) obj.destroy();
    this.navUi = [];

    const briefing = this.getBriefingLayoutConfig();
    const btnWidth = briefing.veryCompact ? 60 : briefing.compact ? 68 : 76;
    const btnHeight = briefing.veryCompact ? 26 : briefing.compact ? 28 : 30;
    const btnX = briefing.cardMarginX + btnWidth / 2 - 4;
    const btnY = briefing.veryCompact ? 22 : briefing.compact ? 24 : 28;

    const bg = this.add.graphics().setDepth(10);
    bg.fillStyle(COLORS.BG, 0.84);
    bg.fillRoundedRect(btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 8);
    bg.lineStyle(1.2, COLORS.HUD, 0.42);
    bg.strokeRoundedRect(btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 8);
    this.navUi.push(bg);

    const label = this.add.text(btnX, btnY, 'MENU', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(briefing.veryCompact ? 9 : briefing.compact ? 10 : 11),
      color: colorStr(COLORS.HUD),
      align: 'center',
    }).setOrigin(0.5).setDepth(11).setAlpha(0.82);
    this.navUi.push(label);

    const hit = this.add.zone(
      btnX - btnWidth / 2,
      btnY - btnHeight / 2,
      btnWidth,
      btnHeight,
    ).setData('cornerRadius', 8).setOrigin(0, 0).setDepth(12).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      playUiSelectSfx(this);
      this.returnToMenu();
    });
    this.navUi.push(hit);
  }

  private createSettingsUi(): void {
    const layout = getLayout();
    const briefing = this.getBriefingLayoutConfig();
    const hudColor = colorStr(COLORS.HUD);
    const buttonWidth = briefing.veryCompact ? 86 : briefing.compact ? 92 : 102;
    const buttonCenterX = layout.gameWidth - briefing.cardMarginX - buttonWidth / 2 + 4;
    const buttonCenterY = briefing.veryCompact ? 24 : briefing.compact ? 26 : 30;
    const panelWidth = briefing.veryCompact ? 208 : briefing.compact ? 216 : 228;
    const panelHeight = briefing.veryCompact ? 236 : 264;
    const panelLeft = layout.gameWidth - panelWidth - 24;
    const panelTop = buttonCenterY + 22;
    const settingsRowGap = briefing.veryCompact ? 30 : 34;
    const rowPaletteY = panelTop + (briefing.veryCompact ? 26 : 30);
    const rowOneY = rowPaletteY + settingsRowGap;
    const rowTwoY = rowOneY + settingsRowGap;
    const rowThreeY = rowTwoY + settingsRowGap;
    const musicVolumeLabelY = rowThreeY + (briefing.veryCompact ? 32 : 38);
    const musicVolumeY = musicVolumeLabelY + (briefing.veryCompact ? 14 : 18);
    const fxVolumeLabelY = musicVolumeY + (briefing.veryCompact ? 18 : 28);
    const fxVolumeY = fxVolumeLabelY + (briefing.veryCompact ? 14 : 18);
    const offX = panelLeft + panelWidth - 30;
    const onX = offX - 52;
    const paletteButtonX = panelLeft + panelWidth - 63;
    const sliderLeft = panelLeft + 80;
    const sliderWidth = panelWidth - 122;

    this.settingsButton = this.createUiButton(
      buttonCenterX,
      buttonCenterY,
      buttonWidth,
      briefing.veryCompact ? 26 : briefing.compact ? 28 : 32,
      'SETTINGS',
      11,
      readableFontSize(10),
      () => this.setSettingsOpen(!this.settingsOpen),
    );

    const blocker = this.add.zone(0, 0, layout.gameWidth, layout.gameHeight)
      .setOrigin(0, 0)
      .setDepth(18)
      .setInteractive({ useHandCursor: false });
    blocker.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.setSettingsOpen(false);
    });

    const panelBg = this.add.graphics().setDepth(19);
    panelBg.fillStyle(COLORS.BG, 0.95);
    panelBg.lineStyle(1.1, COLORS.HUD, 0.34);
    panelBg.fillRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 10);
    panelBg.strokeRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 10);
    panelBg.fillStyle(COLORS.HUD, 0.04);
    panelBg.fillRoundedRect(panelLeft + 4, panelTop + 4, panelWidth - 8, panelHeight - 8, 8);

    const panelHit = this.add.zone(panelLeft, panelTop, panelWidth, panelHeight)
      .setOrigin(0, 0)
      .setDepth(22)
      .setInteractive({ useHandCursor: false });
    panelHit.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
    });

    const paletteLabel = this.add.text(panelLeft + 14, rowPaletteY, 'PALETTE', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(10),
      color: hudColor,
      align: 'left',
    }).setOrigin(0, 0.5).setDepth(20);

    const shakeLabel = this.add.text(panelLeft + 14, rowOneY, 'SHAKE', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(10),
      color: hudColor,
      align: 'left',
    }).setOrigin(0, 0.5).setDepth(20);

    const scanLabel = this.add.text(panelLeft + 14, rowTwoY, 'SCAN', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(10),
      color: hudColor,
      align: 'left',
    }).setOrigin(0, 0.5).setDepth(20);

    const musicLabel = this.add.text(panelLeft + 14, rowThreeY, 'MUSIC', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(10),
      color: hudColor,
      align: 'left',
    }).setOrigin(0, 0.5).setDepth(20);

    const musicBetaLabel = this.add.text(panelLeft + 48, rowThreeY, '*BETA*', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(9),
      color: colorStr(COLORS.HAZARD),
      align: 'left',
    }).setOrigin(0, 0.5).setDepth(20).setAlpha(0.9);

    const musicVolumeLabel = this.add.text(panelLeft + 14, musicVolumeLabelY, 'MUSIC VOL', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(9),
      color: hudColor,
      align: 'left',
    }).setOrigin(0, 0.5).setDepth(20).setAlpha(0.72);

    const fxVolumeLabel = this.add.text(panelLeft + 14, fxVolumeLabelY, 'FX VOL', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(9),
      color: hudColor,
      align: 'left',
    }).setOrigin(0, 0.5).setDepth(20).setAlpha(0.72);

    this.paletteButton = this.createUiButton(
      paletteButtonX,
      rowPaletteY,
      94,
      24,
      PALETTE_LABELS[getSettings().paletteId],
      20,
      readableFontSize(10),
      () => this.applySettings({ paletteId: getNextPaletteId(getSettings().paletteId) }),
    );
    this.shakeOnButton = this.createUiButton(onX, rowOneY, 42, 24, 'ON', 20, readableFontSize(10), () => this.applySettings({ screenShake: true }));
    this.shakeOffButton = this.createUiButton(offX, rowOneY, 46, 24, 'OFF', 20, readableFontSize(10), () => this.applySettings({ screenShake: false }));
    this.scanOnButton = this.createUiButton(onX, rowTwoY, 42, 24, 'ON', 20, readableFontSize(10), () => this.applySettings({ scanlines: true }));
    this.scanOffButton = this.createUiButton(offX, rowTwoY, 46, 24, 'OFF', 20, readableFontSize(10), () => this.applySettings({ scanlines: false }));
    this.musicOnButton = this.createUiButton(onX, rowThreeY, 42, 24, 'ON', 20, readableFontSize(10), () => this.applySettings({ musicEnabled: true }));
    this.musicOffButton = this.createUiButton(offX, rowThreeY, 46, 24, 'OFF', 20, readableFontSize(10), () => this.applySettings({ musicEnabled: false }));
    this.musicVolumeSlider = new SettingsSlider({
      scene: this,
      left: sliderLeft,
      y: musicVolumeY,
      width: sliderWidth,
      depth: 20,
      accentColor: COLORS.GATE,
      initialValue: getSettings().musicVolume,
      onChange: (value) => this.applySettings({ musicVolume: value }),
    });
    this.fxVolumeSlider = new SettingsSlider({
      scene: this,
      left: sliderLeft,
      y: fxVolumeY,
      width: sliderWidth,
      depth: 20,
      accentColor: COLORS.SALVAGE,
      initialValue: getSettings().fxVolume,
      onChange: (value) => this.applySettings({ fxVolume: value }),
    });

    this.settingsPanelUi = [
      blocker,
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

  private createUiButton(
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    label: string,
    depth: number,
    fontSize: string,
    onPointerDown: () => void,
  ): MissionButton {
    const bg = this.add.graphics().setDepth(depth);
    const text = this.add.text(centerX, centerY, label, {
      fontFamily: UI_FONT,
      fontSize,
      color: colorStr(COLORS.HUD),
      align: 'center',
    }).setOrigin(0.5).setDepth(depth + 1);
    const hit = this.add.zone(centerX - width / 2, centerY - height / 2, width, height)
      .setOrigin(0, 0)
      .setDepth(depth + 2)
      .setInteractive({ useHandCursor: true });

    hit.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      playUiSelectSfx(this);
      onPointerDown();
    });

    return { bg, label: text, hit, width, height };
  }

  private drawUiButton(button: MissionButton, centerX: number, centerY: number, active: boolean): void {
    const left = centerX - button.width / 2;
    const top = centerY - button.height / 2;
    const buttonAccent = COLORS.HUD;
    button.bg.clear();
    button.bg.fillStyle(COLORS.BG, active ? 0.94 : 0.84);
    button.bg.lineStyle(1.1, buttonAccent, active ? 0.9 : 0.34);
    button.bg.fillRoundedRect(left, top, button.width, button.height, 8);
    button.bg.strokeRoundedRect(left, top, button.width, button.height, 8);
    button.bg.fillStyle(buttonAccent, active ? 0.14 : 0.04);
    button.bg.fillRoundedRect(left + 4, top + 4, button.width - 8, button.height - 8, 6);
    button.label.setColor(colorStr(buttonAccent));
    button.label.setAlpha(active ? 1 : 0.78);
  }

  private drawPaletteUiButton(button: MissionButton, paletteId: PaletteId): void {
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
    button.label.setColor(colorStr(buttonAccent));
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

  private applySettings(partial: Partial<GameSettings>): void {
    const updated = updateSettings(partial);
    if (partial.paletteId) {
      applyColorPalette(updated.paletteId);
      this.scene.restart(this.buildMissionSelectRestartHandoff());
      return;
    }
    this.hologramOverlay.setEnabled(updated.scanlines);
    refreshMusicForSettings(this);
    this.updateSettingsUi();
  }

  private updateSettingsUi(): void {
    if (!this.settingsButton) {
      return;
    }

    this.drawUiButton(this.settingsButton, this.settingsButton.label.x, this.settingsButton.label.y, this.settingsOpen);

    const settings = getSettings();
    this.drawPaletteUiButton(this.paletteButton, settings.paletteId);
    this.drawUiButton(this.shakeOnButton, this.shakeOnButton.label.x, this.shakeOnButton.label.y, settings.screenShake);
    this.drawUiButton(this.shakeOffButton, this.shakeOffButton.label.x, this.shakeOffButton.label.y, !settings.screenShake);
    this.drawUiButton(this.scanOnButton, this.scanOnButton.label.x, this.scanOnButton.label.y, settings.scanlines);
    this.drawUiButton(this.scanOffButton, this.scanOffButton.label.x, this.scanOffButton.label.y, !settings.scanlines);
    this.drawUiButton(this.musicOnButton, this.musicOnButton.label.x, this.musicOnButton.label.y, settings.musicEnabled);
    this.drawUiButton(this.musicOffButton, this.musicOffButton.label.x, this.musicOffButton.label.y, !settings.musicEnabled);
    this.musicVolumeSlider.setValue(settings.musicVolume);
    this.fxVolumeSlider.setValue(settings.fxVolume);
  }

  private executeReroll(): void {
    if (this.rerollsRemaining <= 0) return;
    const rerollCost = this.getCurrentRerollCost();
    if (!this.saveSystem.spendWalletCredits(rerollCost, this.runMode)) {
      this.drawRerollButton();
      this.drawRepPanel();
      return;
    }

    this.rerollsRemaining--;
    this.rerollsUsedThisVisit++;

    const newMissions: ActiveMission[] = [];
    const usedIds = new Set<string>();
    for (let i = 0; i < 3; i++) {
      const m = generateMission(usedIds);
      usedIds.add(m.id);
      newMissions.push(m);
    }
    this.missions = newMissions;

    saveMissionSelection(this.missions, this.rerollsRemaining);

    for (let i = 0; i < 3; i++) this.drawCard(i);
    this.drawRerollButton();
    this.drawRepPanel();
  }

  private getRerollY(): number {
    return this.getBriefingLayoutConfig().rerollY;
  }

  private getDeployY(): number {
    return this.getBriefingLayoutConfig().deployY;
  }

  private getRepSectionTop(): number {
    const briefing = this.getBriefingLayoutConfig();
    return briefing.repHeaderY + (briefing.compact ? 8 : 10);
  }

  private getCurrentRerollCost(): number {
    return REROLL_BASE_COST * (this.rerollsUsedThisVisit + 1);
  }

  private drawRepPanel(): void {
    for (const obj of this.repPanelUi) obj.destroy();
    this.repPanelUi = [];

    const layout = getLayout();
    const briefing = this.getBriefingLayoutConfig();
    const repSave = loadCompanyRep();
    const affiliatedCompanyId = getCompanyAffiliation(repSave).companyId;
    const walletCredits = this.saveSystem.getWalletCredits(this.runMode);
    const headerY = this.getRepSectionTop();

    const walletText = this.add.text(layout.centerX, headerY, this.getWalletHeader(walletCredits), {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(briefing.veryCompact ? 14 : briefing.compact ? 16 : 17),
      color: colorStr(COLORS.SALVAGE),
      align: 'center',
      stroke: colorStr(COLORS.BG),
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10).setAlpha(0.92);
    this.repPanelUi.push(walletText);


    const gridTop = briefing.repGridTop;
    const rowWidth = briefing.repRowWidth;
    const rowHeight = briefing.repRowHeight;
    const rowLeft = briefing.cardMarginX;
    const dense = rowHeight <= 40 || briefing.narrow;

    for (let i = 0; i < COMPANY_IDS.length; i++) {
      const companyId = COMPANY_IDS[i];
      const company = COMPANIES[companyId];
      const rep = repSave.rep[companyId] ?? 0;
      const standing = getRepStanding(rep);
      const isSelected = affiliatedCompanyId === companyId;
      const rowTop = gridTop + i * (rowHeight + briefing.repRowGap);

      const bg = this.add.graphics().setDepth(10);
      bg.fillStyle(COLORS.BG, 0.9);
      bg.fillRoundedRect(rowLeft, rowTop, rowWidth, rowHeight, 8);
      if (isSelected) {
        bg.fillStyle(company.color, 0.14);
        bg.fillRoundedRect(rowLeft + 1, rowTop + 1, rowWidth - 2, rowHeight - 2, 8);
      }
      bg.lineStyle(isSelected ? 2 : 1.35, isSelected ? COLORS.GATE : COLORS.HUD, isSelected ? 0.88 : 0.26);
      bg.strokeRoundedRect(rowLeft, rowTop, rowWidth, rowHeight, 8);
      bg.fillStyle(company.color, isSelected ? 0.96 : 0.58);
      bg.fillRoundedRect(rowLeft + 5, rowTop + 5, 5, rowHeight - 10, 2);
      this.repPanelUi.push(bg);


      const textLeft = rowLeft + (dense ? 16 : 20);
      const labelY = rowTop + (dense ? 5 : 6);
      const nameLine = `${company.name} // ${standing.label}`;
      const nameText = this.add.text(textLeft, labelY, nameLine, {
        fontFamily: TITLE_FONT,
        fontSize: readableFontSize(dense ? 11 : briefing.compact ? 13 : 14),
        fontStyle: 'bold',
        color: colorStr(company.color),
        stroke: colorStr(COLORS.BG),
        strokeThickness: 2,
      }).setDepth(11).setAlpha(0.96);
      this.repPanelUi.push(nameText);

      const repValueLine = standing.nextRepRequired
        ? `${rep}/${standing.nextRepRequired} REP`
        : `${rep} REP // MAX`;
      const repValueText = this.add.text(rowLeft + rowWidth - (dense ? 14 : 18), labelY, repValueLine, {
        fontFamily: UI_FONT,
        fontSize: readableFontSize(dense ? 9 : briefing.compact ? 11 : 12),
        color: colorStr(company.color),
        align: 'right',
        stroke: colorStr(COLORS.BG),
        strokeThickness: 2,
      }).setOrigin(1, 0).setDepth(11).setAlpha(0.86);
      this.repPanelUi.push(repValueText);

      const barTop = nameText.y + nameText.height + (dense ? 2 : 4);
      const barHeight = dense ? 5 : 6;
      const barLeft = textLeft;
      const barRight = rowLeft + rowWidth - (dense ? 14 : 18);
      const barWidth = Math.max(60, barRight - barLeft);

      const bar = this.add.graphics().setDepth(11);
      bar.fillStyle(COLORS.BG, 0.6);
      bar.fillRoundedRect(barLeft, barTop, barWidth, barHeight, 3);
      bar.lineStyle(1, company.color, 0.5);
      bar.strokeRoundedRect(barLeft, barTop, barWidth, barHeight, 3);
      const fillWidth = Math.max(0, Math.floor(barWidth * standing.progressToNext));
      if (fillWidth > 0) {
        bar.fillStyle(company.color, 0.92);
        bar.fillRoundedRect(barLeft, barTop, fillWidth, barHeight, 3);
      }
      this.repPanelUi.push(bar);

      const canSelect = rep > 0;
      if (canSelect || isSelected) {
        const hit = this.add.zone(rowLeft, rowTop, rowWidth, rowHeight)
          .setOrigin(0, 0)
          .setDepth(13)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
          event.stopPropagation();
          this.toggleAffiliation(companyId, isSelected);
        });
        this.repPanelUi.push(hit);
      }
    }
  }

  private toggleAffiliation(companyId: CompanyId, currentlySelected: boolean): void {
    saveSelectedCompanyAffiliation(currentlySelected ? null : companyId);
    playUiSelectSfx(this);
    this.drawRepPanel();
  }

  private drawDeployButton(): void {
    for (const obj of this.deployUi) obj.destroy();
    this.deployUi = [];

    const layout = getLayout();
    const briefing = this.getBriefingLayoutConfig();
    const deployY = this.getDeployY();
    const btnWidth = briefing.deployButtonWidth;
    const btnHeight = briefing.deployButtonHeight;

    const deployBg = this.add.graphics().setDepth(10);
    deployBg.fillStyle(COLORS.HUD, 0.08);
    deployBg.fillRoundedRect(layout.centerX - btnWidth / 2, deployY - btnHeight / 2, btnWidth, btnHeight, 12);
    deployBg.lineStyle(1.5, COLORS.HUD, 0.5);
    deployBg.strokeRoundedRect(layout.centerX - btnWidth / 2, deployY - btnHeight / 2, btnWidth, btnHeight, 12);
    this.deployUi.push(deployBg);

    const deployText = this.add.text(layout.centerX, deployY, 'DEPLOY', {
      fontFamily: TITLE_FONT,
      fontSize: readableFontSize(briefing.veryCompact ? 22 : briefing.compact ? 26 : 30),
      color: colorStr(COLORS.HUD),
      align: 'center',
    }).setOrigin(0.5).setDepth(11);
    this.deployUi.push(deployText);

    this.tweens.add({
      targets: deployText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    const deployHit = this.add.zone(
      layout.centerX - btnWidth / 2,
      deployY - btnHeight / 2,
      btnWidth,
      btnHeight,
    ).setData('cornerRadius', 12).setOrigin(0, 0).setDepth(12).setInteractive({ useHandCursor: true });
    deployHit.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      playUiSelectSfx(this);
      this.deploy();
    });
    this.deployUi.push(deployHit);

  }

  private deploy(): void {
    this.saveMissions();
    const repSave = loadCompanyRep();
    const runBoosts = getRunBoostsFromAffiliation(repSave);
    this.scene.start(SCENE_KEYS.GAME, {
      ...this.buildBackgroundHandoff(),
      mode: this.runMode,
      selectedMissions: this.missions.filter((m) => m.accepted),
      runBoosts,
    });
  }

  private returnToMenu(): void {
    this.saveMissions();
    this.scene.start(SCENE_KEYS.MENU, this.buildBackgroundHandoff());
  }

  private saveMissions(): void {
    saveMissionSelection(this.missions, this.rerollsRemaining);
  }

  update(_time: number, delta: number): void {
    this.updateBackground(delta);
    this.hologramOverlay.update(delta);
    this.cursor.update(this);
    this.geoSphere.update(delta);
  }

  private cleanup(): void {
    this.cleanupBackground();
    this.cursor.destroy(this);
    this.hologramOverlay.destroy();
    this.input.removeAllListeners();
    for (const cardObjs of this.cardUi) {
      for (const obj of cardObjs) obj.destroy();
    }
    this.cardUi = [];
    for (const obj of this.navUi) obj.destroy();
    this.navUi = [];
    for (const obj of this.rerollUi) obj.destroy();
    this.rerollUi = [];
    for (const obj of this.deployUi) obj.destroy();
    this.deployUi = [];
    for (const obj of this.repPanelUi) obj.destroy();
    this.repPanelUi = [];
    for (const obj of this.settingsPanelUi) obj.destroy();
    this.settingsPanelUi = [];
    this.settingsButton?.bg.destroy();
    this.settingsButton?.label.destroy();
    this.settingsButton?.hit.destroy();
  }

  private restoreBackgroundEntities(): void {
    if (this.handoff.debrisState) {
      for (const debris of this.handoff.debrisState) {
        this.bgDebris.push(SalvageDebris.createAt(this, debris.x, debris.y, debris.vx, debris.vy));
      }
    } else {
      for (let i = 0; i < BG_MAX_DEBRIS; i++) {
        this.bgDebris.push(new SalvageDebris(this));
      }
    }

    if (this.handoff.drifterState) {
      for (const drifter of this.handoff.drifterState) {
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

    if (this.handoff.npcState) {
      for (const npc of this.handoff.npcState) {
        this.bgNpcs.push(NPCShip.createAt(this, npc.x, npc.y, npc.vx, npc.vy));
      }
    } else {
      for (let i = 0; i < BG_MAX_NPCS; i++) {
        this.bgNpcs.push(new NPCShip(this));
      }
    }
  }

  private buildBackgroundHandoff(): HandoffData {
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

  private buildMissionSelectRestartHandoff(): HandoffData {
    return {
      ...this.buildBackgroundHandoff(),
      mode: this.runMode,
      reopenSettings: this.settingsOpen,
      rerollsUsedThisVisit: this.rerollsUsedThisVisit,
    };
  }

  private updateBackground(delta: number): void {
    for (let i = this.bgDebris.length - 1; i >= 0; i--) {
      this.bgDebris[i].update(delta);
      if (!this.bgDebris[i].active) {
        this.bgDebris[i].destroy();
        this.bgDebris.splice(i, 1);
      }
    }

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

    for (let i = this.bgNpcs.length - 1; i >= 0; i--) {
      const npc = this.bgNpcs[i];
      npc.update(delta);
      if (!npc.active) {
        npc.destroy();
        this.bgNpcs.splice(i, 1);
      }
    }

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

    this.debrisTimer += delta;
    if (this.debrisTimer >= BG_DEBRIS_SPAWN_MS && this.bgDebris.length < BG_MAX_DEBRIS) {
      this.bgDebris.push(new SalvageDebris(this));
      this.debrisTimer = 0;
    }

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
  }

  private cleanupBackground(): void {
    for (const debris of this.bgDebris) debris.destroy();
    this.bgDebris = [];
    for (const drifter of this.bgDrifters) drifter.destroy();
    this.bgDrifters = [];
    for (const npc of this.bgNpcs) npc.destroy();
    this.bgNpcs = [];
    this.geoSphere?.destroy();
  }

  private getModeSubtitle(): string {
    return this.runMode === RunMode.CAMPAIGN
      ? 'CAMPAIGN // TAP TO SELECT'
      : 'ARCADE // TAP TO SELECT';
  }

  private getWalletHeader(walletCredits: number): string {
    const compactHeader = isNarrowViewport(getLayout()) || isShortViewport(getLayout());
    if (this.runMode === RunMode.CAMPAIGN) {
      return compactHeader
        ? `WALLET ${walletCredits}c // LIVES ${this.saveSystem.getCampaignLivesDisplay()}`
        : `CAMPAIGN WALLET: ${walletCredits}c // LIVES ${this.saveSystem.getCampaignLivesDisplay()}`;
    }

    return compactHeader ? `WALLET ${walletCredits}c // ARCADE` : `ARCADE WALLET: ${walletCredits}c`;
  }
}
