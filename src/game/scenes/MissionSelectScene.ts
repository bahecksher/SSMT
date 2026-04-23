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
  computeRunBoostsFromFavors,
  getFavorOffer,
  getRepStanding,
  loadCompanyRep,
  REP_PER_TIER,
} from '../data/companyData';
import { CompanyId, RunMode } from '../types';
import type { ActiveMission } from '../types';
import { getMissionBrief } from '../data/missionBriefs';
import { refreshMusicForSettings, setMissionMusic, warmMusicCache } from '../systems/MusicSystem';
import { playUiSelectSfx } from '../systems/SfxSystem';
import { getSettings, updateSettings, type GameSettings } from '../systems/SettingsSystem';
import { CustomCursor } from '../ui/CustomCursor';
import { HologramOverlay } from '../ui/HologramOverlay';
import { createCompanyLogo } from '../ui/CompanyLogo';
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
  selectedFavorIds?: CompanyId[];
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
  favorHeaderY: number;
  favorGridTop: number;
  favorCardWidth: number;
  favorCardHeight: number;
  favorCardGap: number;
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
const FAVOR_CARD_GAP = 8;
const FAVOR_SECTION_GAP = 10;
const MAX_SELECTED_FAVORS = 2;
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
  private favorUi: Phaser.GameObjects.GameObject[] = [];
  private rerollsRemaining = MAX_REROLLS;
  private rerollsUsedThisVisit = 0;
  private selectedFavorIds = new Set<CompanyId>();
  private carriedFavorIds = new Set<CompanyId>();
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
    this.runMode = RunMode.ARCADE;
    this.saveSystem.setSelectedMode(this.runMode);
    this.missions = loadOrGenerateMissions();
    this.selectedFavorIds.clear();
    this.carriedFavorIds.clear();
    if (this.handoff.selectedFavorIds?.length) {
      this.selectedFavorIds = new Set(this.handoff.selectedFavorIds);
    }
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

    this.add.text(
      layout.centerX,
      briefing.instructionY,
      briefing.veryCompact
        ? 'ACCEPTED CONTRACTS PAY REP ON EXTRACT'
        : 'ACCEPTED CONTRACTS PAY BONUS CREDITS + COMPANY REP ON EXTRACTION',
      {
        fontFamily: UI_FONT,
        fontSize: readableFontSize(briefing.veryCompact ? 7 : briefing.compact ? 8 : 9),
        color: colorStr(COLORS.HUD),
        align: 'center',
        wordWrap: { width: briefing.cardWidth, useAdvancedWrap: true },
      },
    ).setOrigin(0.5).setDepth(10).setAlpha(0.6);

    for (let i = 0; i < 3; i++) {
      this.drawCard(i);
    }

    this.drawRerollButton();
    this.drawFavorSection();
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
    const favorCardGap = veryCompact ? 4 : tight ? 4 : compact ? 6 : FAVOR_CARD_GAP;
    const rerollToWalletGap = veryCompact ? 8 : tight ? 9 : compact ? 12 : FAVOR_SECTION_GAP + 4;
    const walletHeaderOffset = veryCompact ? 6 : compact ? 8 : 10;
    const walletToFavorGap = (veryCompact ? 10 : tight ? 12 : compact ? 16 : 18) + walletHeaderOffset;
    const favorHeaderY = rerollY + rerollHeight + rerollToWalletGap;
    const favorGridTop = favorHeaderY + walletToFavorGap;
    const deployButtonWidth = veryCompact ? 170 : compact ? 184 : 200;
    const deployButtonHeight = veryCompact ? 36 : compact ? 40 : 46;
    const deployY = layout.gameHeight - (veryCompact ? 26 : compact ? 34 : 50);
    const favorCardWidth = cardWidth;
    const favorToDeployGap = veryCompact ? 8 : tight ? 10 : compact ? 14 : 16;
    const favorCardsAvailableHeight = Math.floor((deployY - deployButtonHeight / 2) - favorToDeployGap - favorGridTop);
    const stackedFavorCardHeight = Math.max(56, Math.floor(
      (favorCardsAvailableHeight - favorCardGap * (COMPANY_IDS.length - 1)) / COMPANY_IDS.length,
    ));
    const favorCardHeight = Math.max(56, Math.min(cardHeight, stackedFavorCardHeight));

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
      favorHeaderY,
      favorGridTop,
      favorCardWidth,
      favorCardHeight,
      favorCardGap,
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

    const rewardColumnWidth = briefing.veryCompact ? 78 : briefing.compact ? 118 : 132;
    const footerY = cardTop + briefing.cardHeight - (briefing.veryCompact ? 6 : briefing.compact ? 8 : 9);
    const missionBrief = this.add.text(cardLeft + 14, footerY, getMissionBrief(mission.def), {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(briefing.veryCompact ? 7 : briefing.compact ? 8 : 9),
      color: colorStr(companyColor),
      wordWrap: { width: cardWidth - rewardColumnWidth - 28, useAdvancedWrap: true },
    }).setOrigin(0, 1).setDepth(depth + 1).setAlpha(0.82);
    missionBrief.setLineSpacing(briefing.veryCompact ? -3 : -2);
    // Clamp brief to whatever vertical space is left below the (possibly multi-line)
    // label so the bottom-anchored brief never overruns into the title area.
    const labelBottom = label.y + label.displayHeight;
    const briefAvailableHeight = footerY - labelBottom - 2;
    if (missionBrief.height > briefAvailableHeight && briefAvailableHeight > 0) {
      const wrapped = missionBrief.getWrappedText(missionBrief.text);
      const lineHeight = missionBrief.height / Math.max(1, wrapped.length);
      const maxLines = Math.max(1, Math.floor(briefAvailableHeight / lineHeight));
      if (wrapped.length > maxLines) {
        const kept = wrapped.slice(0, maxLines);
        const last = kept[maxLines - 1].replace(/\s+$/, '');
        kept[maxLines - 1] = last.length > 1 ? `${last.slice(0, -1)}\u2026` : '\u2026';
        missionBrief.setText(kept.join('\n'));
      }
    }
    this.cardUi[index].push(missionBrief);

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
    const availableWallet = this.getWalletCreditsAfterSelectedFavors();
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
      this.drawFavorSection();
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
    this.drawFavorSection();
  }

  private getRerollY(): number {
    return this.getBriefingLayoutConfig().rerollY;
  }

  private getDeployY(): number {
    return this.getBriefingLayoutConfig().deployY;
  }

  private getFavorSectionTop(): number {
    const briefing = this.getBriefingLayoutConfig();
    return briefing.favorHeaderY + (briefing.compact ? 8 : 10);
  }

  private getCurrentRerollCost(): number {
    return REROLL_BASE_COST * (this.rerollsUsedThisVisit + 1);
  }

  private getWalletCreditsAfterSelectedFavors(): number {
    return this.saveSystem.getWalletCredits(this.runMode) - this.getSelectedFavorCost();
  }

  private getSelectedFavorCost(): number {
    let total = 0;
    for (const companyId of this.selectedFavorIds) {
      if (this.carriedFavorIds.has(companyId)) {
        continue;
      }
      const offer = getFavorOffer(companyId);
      if (offer) {
        total += offer.cost;
      }
    }
    return total;
  }

  private drawFavorSection(): void {
    for (const obj of this.favorUi) obj.destroy();
    this.favorUi = [];

    const layout = getLayout();
    const briefing = this.getBriefingLayoutConfig();
    const repSave = loadCompanyRep();
    const walletCredits = this.saveSystem.getWalletCredits(this.runMode);
    const selectedCost = this.getSelectedFavorCost();
    const selectedCount = this.selectedFavorIds.size;
    const headerY = this.getFavorSectionTop();

    const walletText = this.add.text(layout.centerX, headerY, this.getWalletHeader(walletCredits), {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(briefing.veryCompact ? 14 : briefing.compact ? 16 : 17),
      color: colorStr(COLORS.SALVAGE),
      align: 'center',
      stroke: colorStr(COLORS.BG),
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10).setAlpha(0.92);
    this.favorUi.push(walletText);

    const gridTop = briefing.favorGridTop;
    const cardWidth = briefing.favorCardWidth;
    const denseFavorLayout = briefing.favorCardHeight <= 68 || briefing.narrow;
    const ultraDenseFavorLayout = denseFavorLayout && (briefing.veryCompact || briefing.favorCardHeight <= 60);

    for (let i = 0; i < COMPANY_IDS.length; i++) {
      const companyId = COMPANY_IDS[i];
      const company = COMPANIES[companyId];
      const offer = getFavorOffer(companyId);
      const rep = repSave.rep[companyId] ?? 0;
      const standing = getRepStanding(rep);
      const selected = this.selectedFavorIds.has(companyId);
      const carried = this.carriedFavorIds.has(companyId);
      const locked = !offer;
      const offerCost = offer?.cost ?? 0;
      const atFavorLimit = !locked && !selected && selectedCount >= MAX_SELECTED_FAVORS;
      const cardLeft = briefing.cardMarginX;
      const cardTop = gridTop + i * (briefing.favorCardHeight + briefing.favorCardGap);
      const canSelect = selected || (!locked && !atFavorLimit && selectedCost + offerCost <= walletCredits);
      const borderColor = COLORS.HUD;
      const statusLabel = carried
        ? (ultraDenseFavorLayout ? 'CARRY' : 'CARRIED')
        : selected
          ? (ultraDenseFavorLayout ? 'ARMED' : 'SELECTED')
          : locked
            ? (ultraDenseFavorLayout ? 'LOCK' : 'LOCKED')
            : atFavorLimit
              ? (ultraDenseFavorLayout ? 'MAX2' : 'MAX 2')
              : !canSelect
                ? 'SHORT'
                : null;
      const statusColor = carried ? COLORS.GATE : selected ? COLORS.HUD : locked || atFavorLimit ? COLORS.HUD : !canSelect ? COLORS.HAZARD : company.color;
      const statusTextColor = carried ? COLORS.GATE : locked || atFavorLimit ? COLORS.HUD : !canSelect ? COLORS.HAZARD : company.color;
      const portraitLeftInset = ultraDenseFavorLayout ? 8 : denseFavorLayout ? 10 : 12;
      const portraitTopClearance = ultraDenseFavorLayout ? 6 : denseFavorLayout ? 8 : 10;
      const portraitBottomPadding = ultraDenseFavorLayout ? 5 : denseFavorLayout ? 6 : 8;
      const portraitRadius = Phaser.Math.Clamp(
        Math.floor((briefing.favorCardHeight - portraitTopClearance - portraitBottomPadding) / 2),
        ultraDenseFavorLayout ? 14 : denseFavorLayout ? 16 : briefing.compact ? 20 : 24,
        42,
      );
      const portraitCenterX = cardLeft + portraitLeftInset + portraitRadius;
      const portraitCenterY = cardTop + portraitTopClearance + portraitRadius;
      const portraitScale = Phaser.Math.Clamp(
        (portraitRadius * 2 - 8) / 56,
        ultraDenseFavorLayout ? 0.48 : denseFavorLayout ? 0.56 : 0.68,
        1.18,
      );
      const textLeft = portraitCenterX + portraitRadius + (ultraDenseFavorLayout ? 8 : denseFavorLayout ? 10 : 14);
      const badgeReserve = statusLabel ? (ultraDenseFavorLayout ? 50 : denseFavorLayout ? 62 : briefing.compact ? 72 : 82) : 14;
      const textRight = cardLeft + cardWidth - badgeReserve;
      const textWidth = Math.max(132, textRight - textLeft);
      const contentTop = cardTop + (ultraDenseFavorLayout ? 4 : denseFavorLayout ? 5 : briefing.compact ? 7 : 9);
      const sectionGap = ultraDenseFavorLayout ? 1 : denseFavorLayout ? 2 : 4;
      const bg = this.add.graphics().setDepth(10);
      bg.fillStyle(COLORS.BG, locked ? 0.82 : 0.92);
      bg.fillRoundedRect(cardLeft, cardTop, cardWidth, briefing.favorCardHeight, 8);
      if (selected) {
        bg.fillStyle(company.color, 0.24);
        bg.fillRoundedRect(cardLeft + 1, cardTop + 1, cardWidth - 2, briefing.favorCardHeight - 2, 8);
      }
      bg.lineStyle(selected ? 2.1 : 1.35, borderColor, selected ? 1 : locked ? 0.16 : 0.26);
      bg.strokeRoundedRect(cardLeft, cardTop, cardWidth, briefing.favorCardHeight, 8);
      bg.fillStyle(company.color, locked ? 0.38 : 0.84);
      bg.fillRoundedRect(cardLeft + 5, cardTop + 5, selected ? 6 : 4, briefing.favorCardHeight - 10, 2);
      this.favorUi.push(bg);

      const portraitFrame = this.add.graphics().setDepth(10.5);
      portraitFrame.fillStyle(COLORS.BG, 0.86);
      portraitFrame.lineStyle(1.1, company.color, 0.42);
      portraitFrame.fillCircle(portraitCenterX, portraitCenterY, portraitRadius);
      portraitFrame.strokeCircle(portraitCenterX, portraitCenterY, portraitRadius);
      portraitFrame.lineStyle(1, company.accent, 0.22);
      portraitFrame.strokeCircle(portraitCenterX, portraitCenterY, Math.max(8, portraitRadius - 4));
      this.favorUi.push(portraitFrame);

      const logo = createCompanyLogo(this, company, { includeBackdrop: false })
        .setPosition(portraitCenterX, portraitCenterY)
        .setScale(portraitScale)
        .setDepth(11)
        .setAlpha(0.96);
      this.favorUi.push(logo);

      if (statusLabel) {
        const badgeTop = cardTop + (ultraDenseFavorLayout ? 4 : denseFavorLayout ? 5 : 7);
        this.drawFavorBadge(cardLeft + cardWidth - 8, badgeTop, statusLabel, statusColor, statusTextColor, briefing.compact, ultraDenseFavorLayout);
      }

      const companyLine = ultraDenseFavorLayout
        ? `${company.name} // ${company.liaison}`
        : `${company.name} // LIAISON: ${company.liaison}`;
      const companyText = this.add.text(textLeft, contentTop, companyLine, {
        fontFamily: TITLE_FONT,
        fontSize: readableFontSize(ultraDenseFavorLayout ? 11 : denseFavorLayout ? 12 : briefing.compact ? 14 : 16),
        fontStyle: 'bold',
        color: colorStr(locked ? COLORS.HUD : company.color),
        stroke: colorStr(COLORS.BG),
        strokeThickness: 2,
        wordWrap: { width: textWidth },
      }).setDepth(11).setAlpha(locked ? 0.72 : 0.96);
      companyText.setLineSpacing(briefing.compact ? -2 : -1);
      this.favorUi.push(companyText);

      const standingLine = ultraDenseFavorLayout
        ? standing.nextRepRequired
          ? `${rep} REP // NEXT ${standing.nextRepRequired}`
          : `${rep} REP // MAX`
        : standing.nextRepRequired
          ? `${rep} REP // NEXT REP LEVEL: ${standing.nextRepRequired}`
          : `${rep} REP // MAX`;
      const standingText = this.add.text(textLeft, companyText.y + companyText.height + sectionGap, standingLine, {
        fontFamily: UI_FONT,
        fontSize: readableFontSize(ultraDenseFavorLayout ? 9 : denseFavorLayout ? 10 : briefing.compact ? 12 : 13),
        color: colorStr(locked ? COLORS.HUD : company.color),
        stroke: colorStr(COLORS.BG),
        strokeThickness: 2,
        wordWrap: { width: textWidth, useAdvancedWrap: true },
      }).setDepth(11).setAlpha(locked ? 0.66 : 0.82);
      standingText.setLineSpacing(-1);
      this.favorUi.push(standingText);

      if (offer) {
        const offerLine = carried
          ? `${offer.label} ${offer.boostValue} // ${ultraDenseFavorLayout ? 'ON' : 'ACTIVE'}`
          : `${offer.label} ${offer.boostValue} // ${offer.cost}c`;
        const offerText = this.add.text(textLeft, standingText.y + standingText.height + sectionGap, offerLine, {
          fontFamily: UI_FONT,
          fontSize: readableFontSize(ultraDenseFavorLayout ? 6 : denseFavorLayout ? 7 : briefing.compact ? 10 : 11),
          fontStyle: 'bold',
          color: colorStr(company.color),
          stroke: colorStr(COLORS.BG),
          strokeThickness: 2,
          wordWrap: { width: textWidth },
        }).setDepth(11).setAlpha(0.94);
        offerText.setLineSpacing(-1);
        this.favorUi.push(offerText);
      }

      const hit = this.add.zone(cardLeft, cardTop, cardWidth, briefing.favorCardHeight)
        .setData('cornerRadius', 8)
        .setOrigin(0, 0)
        .setDepth(12)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        if (carried || !offer) {
          return;
        }
        if (selected) {
          this.selectedFavorIds.delete(companyId);
        } else if (!atFavorLimit && selectedCost + offer.cost <= walletCredits) {
          this.selectedFavorIds.add(companyId);
        } else {
          return;
        }
        playUiSelectSfx(this);
        this.drawFavorSection();
        this.drawRerollButton();
      });
      this.favorUi.push(hit);
    }
  }

  private drawFavorBadge(right: number, top: number, label: string, color: number, textColor: number, compact: boolean, condensed = false): void {
    const badgeWidth = Math.max(condensed ? 40 : compact ? 46 : 52, label.length * (condensed ? 5.2 : compact ? 5.8 : 6.2) + 10);
    const badgeHeight = condensed ? 13 : compact ? 14 : 16;
    const badgeLeft = right - badgeWidth;
    const badge = this.add.graphics().setDepth(11);
    badge.fillStyle(color, 0.14);
    badge.lineStyle(1.1, color, 0.88);
    badge.fillRoundedRect(badgeLeft, top, badgeWidth, badgeHeight, 6);
    badge.strokeRoundedRect(badgeLeft, top, badgeWidth, badgeHeight, 6);
    this.favorUi.push(badge);

    const badgeText = this.add.text(badgeLeft + badgeWidth / 2, top + badgeHeight / 2, label, {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(condensed ? 7 : compact ? 8 : 9),
      fontStyle: 'bold',
      color: colorStr(textColor),
      stroke: colorStr(COLORS.BG),
      strokeThickness: 2,
      align: 'center',
    }).setOrigin(0.5).setDepth(12);
    this.favorUi.push(badgeText);
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
    const selectedFavorIds = Array.from(this.selectedFavorIds);
    const totalFavorCost = this.getSelectedFavorCost();
    if (!this.saveSystem.spendWalletCredits(totalFavorCost, this.runMode)) {
      this.drawFavorSection();
      return;
    }

    if (this.runMode === RunMode.CAMPAIGN) {
      this.saveSystem.setCampaignFavorIds(selectedFavorIds);
    }

    const runBoosts = computeRunBoostsFromFavors(selectedFavorIds);
    this.scene.start(SCENE_KEYS.GAME, {
      ...this.buildBackgroundHandoff(),
      mode: this.runMode,
      selectedMissions: this.missions.filter((m) => m.accepted),
      runBoosts: selectedFavorIds.length > 0 ? runBoosts : undefined,
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
    for (const obj of this.favorUi) obj.destroy();
    this.favorUi = [];
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
      selectedFavorIds: Array.from(this.selectedFavorIds),
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
