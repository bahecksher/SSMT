import Phaser from 'phaser';
import { SCENE_KEYS, COLORS } from '../constants';
import { getLayout, setLayoutSize } from '../layout';
import { loadOrGenerateMissions, loadMissionSave, MAX_REROLLS, saveMissionSelection } from '../systems/MissionSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { generateMission } from '../data/missionCatalog';
import {
  COMPANIES,
  COMPANY_IDS,
  REP_PER_TIER,
  loadCompanyRep,
  computeRunBoostsFromFavors,
  getFavorOffer,
  getRepStanding,
} from '../data/companyData';
import { CompanyId } from '../types';
import type { ActiveMission } from '../types';
import { CustomCursor } from '../ui/CustomCursor';

interface HandoffData {
  drifterState?: { x: number; y: number; vx: number; vy: number; radiusScale: number }[];
  debrisState?: { x: number; y: number; vx: number; vy: number }[];
  npcState?: { x: number; y: number; vx: number; vy: number }[];
}

interface BriefingLayoutConfig {
  compact: boolean;
  titleY: number;
  subtitleY: number;
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

const CARD_HEIGHT = 68;
const CARD_GAP = 8;
const CARD_MARGIN_X = 32;
const FAVOR_CARD_HEIGHT = 88;
const FAVOR_CARD_GAP = 8;
const FAVOR_SECTION_GAP = 10;
const REROLL_BASE_COST = 200;

export class MissionSelectScene extends Phaser.Scene {
  private saveSystem!: SaveSystem;
  private handoff: HandoffData = {};
  private missions: ActiveMission[] = [];
  private cardUi: Phaser.GameObjects.GameObject[][] = [];
  private navUi: Phaser.GameObjects.GameObject[] = [];
  private deployUi: Phaser.GameObjects.GameObject[] = [];
  private rerollUi: Phaser.GameObjects.GameObject[] = [];
  private favorUi: Phaser.GameObjects.GameObject[] = [];
  private rerollsRemaining = MAX_REROLLS;
  private rerollsUsedThisVisit = 0;
  private selectedFavorIds = new Set<CompanyId>();
  private cursor!: CustomCursor;

  constructor() {
    super(SCENE_KEYS.MISSION_SELECT);
  }

  create(data?: HandoffData): void {
    this.events.once('shutdown', this.cleanup, this);
    this.cursor = new CustomCursor(this);
    setLayoutSize(this.scale.width, this.scale.height);
    const layout = getLayout();
    const briefing = this.getBriefingLayoutConfig();

    this.saveSystem = new SaveSystem();
    this.handoff = data ?? {};
    this.missions = loadOrGenerateMissions();
    this.selectedFavorIds.clear();
    this.rerollsUsedThisVisit = 0;

    const saved = loadMissionSave();
    this.rerollsRemaining = saved.rerollsRemaining ?? MAX_REROLLS;

    const starfield = this.add.graphics().setDepth(-1);
    starfield.fillStyle(0x020806, 1);
    starfield.fillRect(0, 0, layout.gameWidth, layout.gameHeight);
    for (let i = 0; i < 120; i++) {
      const sx = Phaser.Math.Between(0, layout.gameWidth);
      const sy = Phaser.Math.Between(0, layout.gameHeight);
      const brightness = Phaser.Math.FloatBetween(0.1, 0.35);
      const size = Phaser.Math.FloatBetween(0.5, 1.1);
      const starColor = Math.random() < 0.6 ? COLORS.PLAYER : 0xffffff;
      starfield.fillStyle(starColor, brightness);
      starfield.fillCircle(sx, sy, size);
    }

    this.add.text(layout.centerX, briefing.titleY, 'MISSION BRIEFING', {
      fontFamily: 'monospace',
      fontSize: briefing.compact ? '20px' : '22px',
      color: colorStr(COLORS.HUD),
      align: 'center',
    }).setOrigin(0.5).setDepth(10);

    this.add.text(layout.centerX, briefing.subtitleY, 'TAP TO SELECT', {
      fontFamily: 'monospace',
      fontSize: briefing.compact ? '9px' : '10px',
      color: colorStr(COLORS.HUD),
      align: 'center',
    }).setOrigin(0.5).setDepth(10).setAlpha(0.6);

    for (let i = 0; i < 3; i++) {
      this.drawCard(i);
    }

    this.drawRerollButton();
    this.drawFavorSection();
    this.drawMenuButton();
    this.drawDeployButton();
  }

  private getBriefingLayoutConfig(): BriefingLayoutConfig {
    const layout = getLayout();
    const compact = layout.gameHeight <= 860;
    const tight = layout.gameHeight <= 640;
    const cardMarginX = Phaser.Math.Clamp(Math.round(layout.gameWidth * 0.05), 20, CARD_MARGIN_X);
    const cardWidth = layout.gameWidth - cardMarginX * 2;
    const titleY = Phaser.Math.Clamp(Math.round(layout.gameHeight * 0.07), 42, 72);
    const subtitleY = titleY + (compact ? 22 : 28);
    const cardHeight = Phaser.Math.Clamp(Math.round(layout.gameHeight * 0.075), 58, CARD_HEIGHT);
    const cardGap = compact ? 8 : CARD_GAP;
    const cardTop = subtitleY + (compact ? 14 : 18);
    const missionToRerollGap = tight ? 8 : compact ? 12 : 14;
    const rerollHeight = compact ? 28 : 32;
    const rerollY = cardTop + cardHeight * 3 + cardGap * 2 + missionToRerollGap;
    const favorCardHeight = Phaser.Math.Clamp(Math.round(layout.gameHeight * 0.085), 78, FAVOR_CARD_HEIGHT);
    const favorCardGap = tight ? 8 : compact ? 10 : FAVOR_CARD_GAP + 2;
    const rerollToWalletGap = tight ? 9 : compact ? 12 : FAVOR_SECTION_GAP + 4;
    const walletToFavorGap = tight ? 12 : compact ? 16 : 18;
    const favorHeaderY = rerollY + rerollHeight + rerollToWalletGap;
    const favorGridTop = favorHeaderY + walletToFavorGap;
    const favorCardWidth = (layout.gameWidth - cardMarginX * 2 - favorCardGap) / 2;
    const deployButtonWidth = compact ? 184 : 200;
    const deployButtonHeight = compact ? 40 : 46;
    const deployY = layout.gameHeight - (compact ? 40 : 58);

    return {
      compact,
      titleY,
      subtitleY,
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
      .setOrigin(0, 0)
      .setDepth(depth + 3)
      .setInteractive({ useHandCursor: true });

    hitZone.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      const wasAccepted = this.missions[index].accepted;
      this.missions[index].accepted = !wasAccepted;
      this.saveMissions();
      this.drawCard(index);
    });

    this.cardUi[index].push(hitZone);

    if (isAccepted) {
      const check = this.add.text(cardLeft + cardWidth - 14, cardTop + 7, '\u2713', {
        fontFamily: 'monospace',
        fontSize: briefing.compact ? '14px' : '16px',
        color: colorStr(COLORS.GATE),
      }).setOrigin(1, 0).setDepth(depth + 1);
      this.cardUi[index].push(check);
    }

    const label = this.add.text(cardLeft + 14, cardTop + (briefing.compact ? 13 : 14), mission.def.label, {
      fontFamily: 'monospace',
      fontSize: briefing.compact ? '12px' : '14px',
      color: colorStr(isAccepted ? COLORS.GATE : COLORS.HUD),
      wordWrap: { width: cardWidth - 28 },
    }).setDepth(depth + 1);
    label.setLineSpacing(briefing.compact ? -2 : -1);
    this.cardUi[index].push(label);

    const footerY = cardTop + briefing.cardHeight - (briefing.compact ? 8 : 9);
    const companyTag = this.add.text(cardLeft + 14, footerY, `${companyDef.name} +${REP_PER_TIER[mission.def.tier]} REP`, {
      fontFamily: 'monospace',
      fontSize: briefing.compact ? '9px' : '10px',
      color: colorStr(companyColor),
    }).setOrigin(0, 1).setDepth(depth + 1).setAlpha(0.76);
    this.cardUi[index].push(companyTag);

    const rewardText = this.add.text(cardLeft + cardWidth - 14, footerY, `+${mission.def.reward}c`, {
      fontFamily: 'monospace',
      fontSize: briefing.compact ? '11px' : '12px',
      fontStyle: 'bold',
      color: colorStr(COLORS.SALVAGE),
    }).setOrigin(1, 1).setDepth(depth + 1);
    this.cardUi[index].push(rewardText);
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
    const btnWidth = briefing.compact ? 164 : 178;
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
      fontFamily: 'monospace',
      fontSize: briefing.compact ? '11px' : '12px',
      color: colorStr(color),
      align: 'center',
    }).setOrigin(0.5).setDepth(11).setAlpha(canReroll ? 0.8 : 0.4);
    this.rerollUi.push(label);

    if (canReroll) {
      const rerollHit = this.add.zone(btnX, rerollY, btnWidth, btnHeight)
        .setOrigin(0, 0)
        .setDepth(12)
        .setInteractive({ useHandCursor: true });
      rerollHit.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.executeReroll();
      });
      this.rerollUi.push(rerollHit);
    }
  }

  private drawMenuButton(): void {
    for (const obj of this.navUi) obj.destroy();
    this.navUi = [];

    const briefing = this.getBriefingLayoutConfig();
    const btnWidth = briefing.compact ? 56 : 62;
    const btnHeight = briefing.compact ? 22 : 24;
    const btnX = briefing.cardMarginX + btnWidth / 2 - 4;
    const btnY = briefing.compact ? 24 : 28;

    const bg = this.add.graphics().setDepth(10);
    bg.fillStyle(COLORS.BG, 0.84);
    bg.fillRoundedRect(btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 8);
    bg.lineStyle(1.2, COLORS.HUD, 0.42);
    bg.strokeRoundedRect(btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 8);
    this.navUi.push(bg);

    const label = this.add.text(btnX, btnY, 'MENU', {
      fontFamily: 'monospace',
      fontSize: briefing.compact ? '10px' : '11px',
      color: colorStr(COLORS.HUD),
      align: 'center',
    }).setOrigin(0.5).setDepth(11).setAlpha(0.82);
    this.navUi.push(label);

    const hit = this.add.zone(
      btnX - btnWidth / 2,
      btnY - btnHeight / 2,
      btnWidth,
      btnHeight,
    ).setOrigin(0, 0).setDepth(12).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.returnToMenu();
    });
    this.navUi.push(hit);
  }

  private executeReroll(): void {
    if (this.rerollsRemaining <= 0) return;
    const rerollCost = this.getCurrentRerollCost();
    if (!this.saveSystem.spendWalletCredits(rerollCost)) {
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
    return this.getBriefingLayoutConfig().favorHeaderY;
  }

  private getCurrentRerollCost(): number {
    return REROLL_BASE_COST * (this.rerollsUsedThisVisit + 1);
  }

  private getWalletCreditsAfterSelectedFavors(): number {
    return this.saveSystem.getWalletCredits() - this.getSelectedFavorCost();
  }

  private getSelectedFavorCost(): number {
    const repSave = loadCompanyRep();
    let total = 0;
    for (const companyId of this.selectedFavorIds) {
      const offer = getFavorOffer(companyId, repSave);
      if (offer) total += offer.cost;
    }
    return total;
  }

  private drawFavorSection(): void {
    for (const obj of this.favorUi) obj.destroy();
    this.favorUi = [];

    const layout = getLayout();
    const briefing = this.getBriefingLayoutConfig();
    const repSave = loadCompanyRep();
    const walletCredits = this.saveSystem.getWalletCredits();
    const selectedCost = this.getSelectedFavorCost();
    const headerY = this.getFavorSectionTop();

    const walletText = this.add.text(layout.centerX, headerY, `WALLET: ${walletCredits}c`, {
      fontFamily: 'monospace',
      fontSize: briefing.compact ? '13px' : '14px',
      fontStyle: 'bold',
      color: colorStr(COLORS.SALVAGE),
      align: 'center',
      stroke: colorStr(COLORS.BG),
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10).setAlpha(0.92);
    this.favorUi.push(walletText);

    const gridTop = briefing.favorGridTop;
    const cardWidth = briefing.favorCardWidth;

    for (let i = 0; i < COMPANY_IDS.length; i++) {
      const companyId = COMPANY_IDS[i];
      const company = COMPANIES[companyId];
      const offer = getFavorOffer(companyId, repSave);
      const rep = repSave.rep[companyId] ?? 0;
      const standing = getRepStanding(rep);
      const selected = this.selectedFavorIds.has(companyId);
      const row = Math.floor(i / 2);
      const col = i % 2;
      const cardLeft = briefing.cardMarginX + col * (cardWidth + briefing.favorCardGap);
      const cardTop = gridTop + row * (briefing.favorCardHeight + briefing.favorCardGap);
      const canAfford = offer ? selected || (selectedCost + offer.cost <= walletCredits) : false;
      const shortfall = offer && !selected ? Math.max(0, selectedCost + offer.cost - walletCredits) : 0;
      const borderColor = selected
        ? COLORS.GATE
        : offer
          ? (canAfford ? company.color : COLORS.HAZARD)
          : company.color;
      const textLeft = cardLeft + 14;
      const progressLeft = cardLeft + 12;
      const progressWidth = cardWidth - 24;
      const progressFill = standing.nextRepRequired
        ? progressWidth * standing.progressToNext
        : progressWidth;
      const statusLabel = selected ? 'SELECTED' : !offer ? 'LOCKED' : !canAfford ? 'SHORT' : null;
      const statusColor = selected ? COLORS.GATE : !offer || !canAfford ? COLORS.HAZARD : company.color;

      const bg = this.add.graphics().setDepth(10);
      bg.fillStyle(COLORS.BG, offer ? 0.92 : 0.84);
      bg.fillRoundedRect(cardLeft, cardTop, cardWidth, briefing.favorCardHeight, 8);
      if (selected) {
        bg.fillStyle(company.color, 0.24);
        bg.fillRoundedRect(cardLeft + 1, cardTop + 1, cardWidth - 2, briefing.favorCardHeight - 2, 8);
      }
      bg.lineStyle(selected ? 2.1 : 1.35, borderColor, selected ? 1 : offer ? 0.48 : 0.28);
      bg.strokeRoundedRect(cardLeft, cardTop, cardWidth, briefing.favorCardHeight, 8);
      bg.fillStyle(company.color, offer ? 0.84 : 0.38);
      bg.fillRoundedRect(cardLeft + 5, cardTop + 5, selected ? 6 : 4, briefing.favorCardHeight - 10, 2);
      bg.fillStyle(COLORS.GRID, 0.35);
      bg.fillRoundedRect(progressLeft, cardTop + briefing.favorCardHeight - 8, progressWidth, 2, 1);
      if (progressFill > 0) {
        bg.fillStyle(offer ? company.color : COLORS.HAZARD, selected ? 1 : 0.82);
        bg.fillRoundedRect(progressLeft, cardTop + briefing.favorCardHeight - 8, progressFill, 2, 1);
      }
      this.favorUi.push(bg);

      if (statusLabel) {
        const badgeTop = cardTop + briefing.favorCardHeight - (briefing.compact ? 24 : 26);
        this.drawFavorBadge(cardLeft + cardWidth - 8, badgeTop, statusLabel, statusColor, briefing.compact);
      }

      const title = this.add.text(textLeft, cardTop + 7, `${company.name} // ${company.liaison}`, {
        fontFamily: 'monospace',
        fontSize: briefing.compact ? '8px' : '9px',
        fontStyle: 'bold',
        color: colorStr(company.color),
        stroke: colorStr(COLORS.BG),
        strokeThickness: 2,
        wordWrap: { width: cardWidth - 28 },
      }).setDepth(11).setAlpha(0.96);
      title.setLineSpacing(-1);
      this.favorUi.push(title);

      const standingLine = standing.nextRepRequired
        ? `${standing.label} // ${rep} REP // NEXT ${standing.nextRepRequired}`
        : `${standing.label} // ${rep} REP // MAX`;
      const standingText = this.add.text(textLeft, cardTop + (briefing.compact ? 25 : 28), standingLine, {
        fontFamily: 'monospace',
        fontSize: briefing.compact ? '8px' : '9px',
        color: colorStr(offer ? COLORS.HUD : company.color),
        stroke: colorStr(COLORS.BG),
        strokeThickness: 2,
      }).setDepth(11).setAlpha(offer ? 0.76 : 0.7);
      this.favorUi.push(standingText);

      const offerLine = offer
        ? `${offer.label} ${offer.boostValue}`
        : company.boostLabel;
      const offerText = this.add.text(textLeft, cardTop + (briefing.compact ? 39 : 43), offerLine, {
        fontFamily: 'monospace',
        fontSize: briefing.compact ? '9px' : '10px',
        fontStyle: 'bold',
        color: colorStr(offer ? (selected ? COLORS.GATE : COLORS.SALVAGE) : COLORS.HAZARD),
        stroke: colorStr(COLORS.BG),
        strokeThickness: 2,
      }).setDepth(11).setAlpha(offer ? 0.96 : 0.8);
      this.favorUi.push(offerText);

      if (offer) {
        const detailLine = selected
          ? `ARMED // ${offer.cost}c`
          : canAfford
            ? `${offer.cost}c // TAP TO ARM`
            : `${offer.cost}c // SHORT ${shortfall}c`;
        const detailText = this.add.text(textLeft, cardTop + (briefing.compact ? 53 : 58), detailLine, {
          fontFamily: 'monospace',
          fontSize: briefing.compact ? '8px' : '9px',
          color: colorStr(selected || canAfford ? COLORS.HUD : COLORS.HAZARD),
          stroke: colorStr(COLORS.BG),
          strokeThickness: 2,
        }).setDepth(11).setAlpha(0.76);
        this.favorUi.push(detailText);
      }

      if (!offer) continue;

      const hit = this.add.zone(cardLeft, cardTop, cardWidth, briefing.favorCardHeight)
        .setOrigin(0, 0)
        .setDepth(12)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        if (selected) {
          this.selectedFavorIds.delete(companyId);
        } else if (selectedCost + offer.cost <= walletCredits) {
          this.selectedFavorIds.add(companyId);
        } else {
          return;
        }
        this.drawFavorSection();
        this.drawRerollButton();
      });
      this.favorUi.push(hit);
    }
  }

  private drawFavorBadge(right: number, top: number, label: string, color: number, compact: boolean): void {
    const badgeWidth = Math.max(compact ? 42 : 48, label.length * (compact ? 5.2 : 5.7) + 10);
    const badgeHeight = compact ? 13 : 15;
    const badgeLeft = right - badgeWidth;
    const badge = this.add.graphics().setDepth(11);
    badge.fillStyle(color, 0.14);
    badge.lineStyle(1.1, color, 0.88);
    badge.fillRoundedRect(badgeLeft, top, badgeWidth, badgeHeight, 6);
    badge.strokeRoundedRect(badgeLeft, top, badgeWidth, badgeHeight, 6);
    this.favorUi.push(badge);

    const badgeText = this.add.text(badgeLeft + badgeWidth / 2, top + badgeHeight / 2, label, {
      fontFamily: 'monospace',
      fontSize: compact ? '7px' : '8px',
      fontStyle: 'bold',
      color: colorStr(color),
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
    deployBg.fillStyle(COLORS.GATE, 0.08);
    deployBg.fillRoundedRect(layout.centerX - btnWidth / 2, deployY - btnHeight / 2, btnWidth, btnHeight, 12);
    deployBg.lineStyle(1.5, COLORS.GATE, 0.5);
    deployBg.strokeRoundedRect(layout.centerX - btnWidth / 2, deployY - btnHeight / 2, btnWidth, btnHeight, 12);
    this.deployUi.push(deployBg);

    const deployText = this.add.text(layout.centerX, deployY, 'DEPLOY', {
      fontFamily: 'monospace',
      fontSize: briefing.compact ? '26px' : '30px',
      color: colorStr(COLORS.GATE),
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
    ).setOrigin(0, 0).setDepth(12).setInteractive({ useHandCursor: true });
    deployHit.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.deploy();
    });
    this.deployUi.push(deployHit);

    const hint = this.add.text(layout.centerX, deployY + btnHeight / 2 + (briefing.compact ? 8 : 10), 'DEPLOYS WITH ACCEPTED CONTRACTS + ARMED FAVORS', {
      fontFamily: 'monospace',
      fontSize: briefing.compact ? '9px' : '10px',
      color: colorStr(COLORS.HUD),
      align: 'center',
    }).setOrigin(0.5).setDepth(10).setAlpha(0.5);
    this.deployUi.push(hint);
  }

  private deploy(): void {
    this.saveMissions();
    const repSave = loadCompanyRep();
    const selectedFavorIds = Array.from(this.selectedFavorIds);
    const totalFavorCost = this.getSelectedFavorCost();
    if (!this.saveSystem.spendWalletCredits(totalFavorCost)) {
      this.drawFavorSection();
      return;
    }

    const runBoosts = computeRunBoostsFromFavors(selectedFavorIds, repSave);
    this.scene.start(SCENE_KEYS.GAME, {
      ...this.handoff,
      selectedMissions: this.missions.filter((m) => m.accepted),
      runBoosts: selectedFavorIds.length > 0 ? runBoosts : undefined,
    });
  }

  private returnToMenu(): void {
    this.saveMissions();
    this.scene.start(SCENE_KEYS.MENU);
  }

  private saveMissions(): void {
    saveMissionSelection(this.missions, this.rerollsRemaining);
  }

  update(): void {
    this.cursor.update(this);
  }

  private cleanup(): void {
    this.cursor.destroy(this);
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
  }
}

function colorStr(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}
