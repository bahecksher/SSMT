import Phaser from 'phaser';
import { SCENE_KEYS, COLORS } from '../constants';
import { getLayout, setLayoutSize } from '../layout';
import { loadOrGenerateMissions, loadMissionSave, MAX_REROLLS } from '../systems/MissionSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { generateMission } from '../data/missionCatalog';
import {
  COMPANIES,
  COMPANY_IDS,
  loadCompanyRep,
  computeRunBoostsFromFavors,
  getFavorOffer,
  getRepLabel,
  getSlickCutPercent,
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

const CARD_HEIGHT = 110;
const CARD_GAP = 14;
const CARD_MARGIN_X = 32;
const FAVOR_CARD_HEIGHT = 72;
const FAVOR_CARD_GAP = 10;
const FAVOR_SECTION_GAP = 14;

export class MissionSelectScene extends Phaser.Scene {
  private saveSystem!: SaveSystem;
  private handoff: HandoffData = {};
  private missions: ActiveMission[] = [];
  private cardUi: Phaser.GameObjects.GameObject[][] = [];
  private deployUi: Phaser.GameObjects.GameObject[] = [];
  private rerollUi: Phaser.GameObjects.GameObject[] = [];
  private favorUi: Phaser.GameObjects.GameObject[] = [];
  private rerollsRemaining = MAX_REROLLS;
  private selectedFavorIds = new Set<CompanyId>();
  private rerollCountText: Phaser.GameObjects.Text | null = null;
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
    this.drawDeployButton();
  }

  private getBriefingLayoutConfig(): BriefingLayoutConfig {
    const layout = getLayout();
    const compact = layout.gameHeight <= 860;
    const cardMarginX = Phaser.Math.Clamp(Math.round(layout.gameWidth * 0.05), 20, CARD_MARGIN_X);
    const cardWidth = layout.gameWidth - cardMarginX * 2;
    const titleY = Phaser.Math.Clamp(Math.round(layout.gameHeight * 0.07), 42, 72);
    const subtitleY = titleY + (compact ? 22 : 28);
    const cardHeight = Phaser.Math.Clamp(Math.round(layout.gameHeight * 0.11), 88, CARD_HEIGHT);
    const cardGap = compact ? 10 : CARD_GAP;
    const cardTop = subtitleY + (compact ? 16 : 24);
    const rerollHeight = compact ? 30 : 34;
    const rerollY = cardTop + cardHeight * 3 + cardGap * 2 + 8;
    const favorCardHeight = Phaser.Math.Clamp(Math.round(layout.gameHeight * 0.07), 56, FAVOR_CARD_HEIGHT);
    const favorCardGap = compact ? 8 : FAVOR_CARD_GAP;
    const favorHeaderY = rerollY + rerollHeight + (compact ? 12 : FAVOR_SECTION_GAP);
    const favorGridTop = favorHeaderY + (compact ? 24 : 30);
    const favorCardWidth = (layout.gameWidth - cardMarginX * 2 - favorCardGap) / 2;
    const deployButtonWidth = compact ? 184 : 200;
    const deployButtonHeight = compact ? 42 : 50;
    const deployY = layout.gameHeight - (compact ? 44 : 64);

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
    bg.fillStyle(isAccepted ? COLORS.GATE : COLORS.BG, isAccepted ? 0.08 : 0.88);
    bg.fillRoundedRect(cardLeft, cardTop, cardWidth, briefing.cardHeight, 10);
    bg.lineStyle(isAccepted ? 2 : 1.5, borderColor, isAccepted ? 0.8 : 0.3);
    bg.strokeRoundedRect(cardLeft, cardTop, cardWidth, briefing.cardHeight, 10);
    bg.fillStyle(companyColor, isAccepted ? 0.9 : 0.5);
    bg.fillRoundedRect(cardLeft, cardTop + 4, 4, briefing.cardHeight - 8, 2);
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

    const tierText = this.add.text(cardLeft + 12, cardTop + 10, '\u2605'.repeat(mission.def.tier), {
      fontFamily: 'monospace',
      fontSize: briefing.compact ? '10px' : '11px',
      color: colorStr(0xffcc44),
    }).setDepth(depth + 1);
    this.cardUi[index].push(tierText);

    if (isAccepted) {
      const check = this.add.text(cardLeft + cardWidth - 14, cardTop + 8, '\u2713', {
        fontFamily: 'monospace',
        fontSize: briefing.compact ? '16px' : '18px',
        color: colorStr(COLORS.GATE),
      }).setOrigin(1, 0).setDepth(depth + 1);
      this.cardUi[index].push(check);
    }

    const label = this.add.text(cardLeft + 12, cardTop + 24, mission.def.label, {
      fontFamily: 'monospace',
      fontSize: briefing.compact ? '13px' : '15px',
      color: colorStr(isAccepted ? COLORS.GATE : COLORS.HUD),
      wordWrap: { width: cardWidth - 28 },
    }).setDepth(depth + 1);
    this.cardUi[index].push(label);

    const rewardY = label.y + label.height + (briefing.compact ? 2 : 4);
    const rewardText = this.add.text(cardLeft + 12, rewardY, `REWARD: +${mission.def.reward}`, {
      fontFamily: 'monospace',
      fontSize: briefing.compact ? '12px' : '13px',
      color: colorStr(COLORS.SALVAGE),
    }).setDepth(depth + 1);
    this.cardUi[index].push(rewardText);

    const companyTag = this.add.text(cardLeft + 12, rewardText.y + rewardText.height + 1, `${companyDef.name} CONTRACT`, {
      fontFamily: 'monospace',
      fontSize: briefing.compact ? '9px' : '10px',
      color: colorStr(companyColor),
    }).setDepth(depth + 1).setAlpha(0.6);
    this.cardUi[index].push(companyTag);
  }

  private drawRerollButton(): void {
    for (const obj of this.rerollUi) obj.destroy();
    this.rerollUi = [];

    const layout = getLayout();
    const briefing = this.getBriefingLayoutConfig();
    const rerollY = this.getRerollY();
    const canReroll = this.rerollsRemaining > 0;
    const btnWidth = briefing.compact ? 152 : 160;
    const btnHeight = briefing.rerollHeight;
    const btnX = layout.centerX - btnWidth / 2;

    const btnGfx = this.add.graphics().setDepth(10);
    btnGfx.fillStyle(canReroll ? COLORS.HUD : COLORS.HAZARD, canReroll ? 0.08 : 0.04);
    btnGfx.fillRoundedRect(btnX, rerollY, btnWidth, btnHeight, 8);
    btnGfx.lineStyle(1.5, canReroll ? COLORS.HUD : COLORS.HAZARD, canReroll ? 0.4 : 0.2);
    btnGfx.strokeRoundedRect(btnX, rerollY, btnWidth, btnHeight, 8);
    this.rerollUi.push(btnGfx);

    const labelStr = `REROLL (${this.rerollsRemaining}/${MAX_REROLLS})`;
    const color = canReroll ? COLORS.HUD : COLORS.HAZARD;
    this.rerollCountText = this.add.text(layout.centerX, rerollY + btnHeight / 2, labelStr, {
      fontFamily: 'monospace',
      fontSize: briefing.compact ? '12px' : '13px',
      color: colorStr(color),
      align: 'center',
    }).setOrigin(0.5).setDepth(11).setAlpha(canReroll ? 0.8 : 0.4);
    this.rerollUi.push(this.rerollCountText);

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

  private executeReroll(): void {
    if (this.rerollsRemaining <= 0) return;

    this.rerollsRemaining--;

    const newMissions: ActiveMission[] = [];
    const usedIds = new Set<string>();
    for (let i = 0; i < 3; i++) {
      const m = generateMission(usedIds);
      usedIds.add(m.id);
      newMissions.push(m);
    }
    this.missions = newMissions;

    const saved = loadMissionSave();
    saved.activeMissions = this.missions;
    saved.rerollsRemaining = this.rerollsRemaining;
    try {
      localStorage.setItem('ssmt_missions', JSON.stringify(saved));
    } catch {
      // private browsing
    }

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
    const remainingCredits = walletCredits - selectedCost;
    const headerY = this.getFavorSectionTop();

    const walletText = this.add.text(layout.centerX, headerY, `WALLET: ${walletCredits}c  //  COMMITTED: ${selectedCost}c  //  LEFT: ${remainingCredits}c`, {
      fontFamily: 'monospace',
      fontSize: briefing.compact ? '11px' : '12px',
      color: colorStr(COLORS.SALVAGE),
      align: 'center',
      stroke: colorStr(COLORS.BG),
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10).setAlpha(0.92);
    this.favorUi.push(walletText);

    const hintText = this.add.text(layout.centerX, headerY + (briefing.compact ? 10 : 12), `REP UNLOCKS FAVOR TIERS  //  SLICK KEEPS ${getSlickCutPercent()}%`, {
      fontFamily: 'monospace',
      fontSize: briefing.compact ? '9px' : '10px',
      color: colorStr(COLORS.HUD),
      align: 'center',
      stroke: colorStr(COLORS.BG),
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10).setAlpha(0.72);
    this.favorUi.push(hintText);

    const gridTop = briefing.favorGridTop;
    const cardWidth = briefing.favorCardWidth;

    for (let i = 0; i < COMPANY_IDS.length; i++) {
      const companyId = COMPANY_IDS[i];
      const company = COMPANIES[companyId];
      const offer = getFavorOffer(companyId, repSave);
      const selected = this.selectedFavorIds.has(companyId);
      const row = Math.floor(i / 2);
      const col = i % 2;
      const cardLeft = briefing.cardMarginX + col * (cardWidth + briefing.favorCardGap);
      const cardTop = gridTop + row * (briefing.favorCardHeight + briefing.favorCardGap);
      const canAfford = offer ? selected || (selectedCost + offer.cost <= walletCredits) : false;
      const badgeWidth = briefing.compact ? 58 : 68;
      const badgeHeight = briefing.compact ? 14 : 16;
      const borderColor = selected
        ? COLORS.GATE
        : offer
          ? (canAfford ? company.color : COLORS.HAZARD)
          : COLORS.GRID;
      const textLeft = cardLeft + 14;
      const textWrapWidth = cardWidth - 24;

      const bg = this.add.graphics().setDepth(10);
      bg.fillStyle(COLORS.BG, offer ? 0.9 : 0.76);
      bg.fillRoundedRect(cardLeft, cardTop, cardWidth, briefing.favorCardHeight, 8);
      if (selected) {
        bg.fillStyle(company.color, 0.26);
        bg.fillRoundedRect(cardLeft + 1, cardTop + 1, cardWidth - 2, briefing.favorCardHeight - 2, 8);
      }
      bg.lineStyle(selected ? 2.1 : 1.4, borderColor, selected ? 1 : offer ? 0.45 : 0.18);
      bg.strokeRoundedRect(cardLeft, cardTop, cardWidth, briefing.favorCardHeight, 8);
      bg.fillStyle(offer ? company.color : COLORS.GRID, offer ? 0.82 : 0.28);
      bg.fillRoundedRect(cardLeft + 5, cardTop + 5, selected ? 6 : 4, briefing.favorCardHeight - 10, 2);
      if (selected) {
        bg.fillStyle(COLORS.GATE, 0.18);
        bg.fillRoundedRect(cardLeft + 10, cardTop + briefing.favorCardHeight - 8, cardWidth - 20, 3, 1.5);
      }
      this.favorUi.push(bg);

      if (selected) {
        const badgeLeft = cardLeft + cardWidth - badgeWidth - 8;
        const badgeTop = cardTop + 7;
        const badge = this.add.graphics().setDepth(11);
        badge.fillStyle(COLORS.GATE, 0.16);
        badge.lineStyle(1.2, COLORS.GATE, 0.9);
        badge.fillRoundedRect(badgeLeft, badgeTop, badgeWidth, badgeHeight, 6);
        badge.strokeRoundedRect(badgeLeft, badgeTop, badgeWidth, badgeHeight, 6);
        this.favorUi.push(badge);

        const badgeText = this.add.text(badgeLeft + badgeWidth / 2, badgeTop + badgeHeight / 2, 'SELECTED', {
          fontFamily: 'monospace',
          fontSize: briefing.compact ? '7px' : '8px',
          fontStyle: 'bold',
          color: colorStr(COLORS.GATE),
          stroke: colorStr(COLORS.BG),
          strokeThickness: 2,
          align: 'center',
        }).setOrigin(0.5).setDepth(12);
        this.favorUi.push(badgeText);
      }

      const title = this.add.text(textLeft, cardTop + 7, company.name, {
        fontFamily: 'monospace',
        fontSize: briefing.compact ? '10px' : '11px',
        fontStyle: 'bold',
        color: colorStr(offer ? company.color : COLORS.HUD),
        stroke: colorStr(COLORS.BG),
        strokeThickness: 2,
        wordWrap: { width: textWrapWidth },
      }).setDepth(11).setAlpha(offer ? 0.96 : 0.58);
      this.favorUi.push(title);

      const mainLine = offer
        ? offer.label
        : 'LOCKED FAVOR';
      const mainText = this.add.text(textLeft, cardTop + (briefing.compact ? 20 : 26), mainLine, {
        fontFamily: 'monospace',
        fontSize: briefing.compact ? '10px' : '11px',
        fontStyle: 'bold',
        color: colorStr(offer ? (selected ? COLORS.GATE : COLORS.HUD) : COLORS.HAZARD),
        stroke: colorStr(COLORS.BG),
        strokeThickness: 2,
        wordWrap: { width: textWrapWidth },
      }).setDepth(11).setAlpha(offer ? 0.96 : 0.76);
      this.favorUi.push(mainText);

      const valueLine = offer
        ? `${offer.boostValue}  //  ${selected ? 'ONLINE' : `${offer.cost}c`}`
        : 'NEED KNOWN REP';
      const valueText = this.add.text(textLeft, cardTop + (briefing.compact ? 33 : 43), valueLine, {
        fontFamily: 'monospace',
        fontSize: briefing.compact ? '10px' : '11px',
        color: colorStr(offer ? (canAfford || selected ? COLORS.SALVAGE : COLORS.HAZARD) : COLORS.HAZARD),
        stroke: colorStr(COLORS.BG),
        strokeThickness: 2,
        wordWrap: { width: textWrapWidth },
      }).setDepth(11).setAlpha(offer ? 0.9 : 0.84);
      this.favorUi.push(valueText);

      const detailLine = offer
        ? `${selected ? 'TAP TO CLEAR' : 'TAP TO ARM'}  //  ${getRepLabel(repSave.rep[companyId] ?? 0)} FAVOR`
        : 'COMPLETE CONTRACTS TO UNLOCK';
      const detailText = this.add.text(textLeft, cardTop + (briefing.compact ? 45 : 58), detailLine, {
        fontFamily: 'monospace',
        fontSize: briefing.compact ? '8px' : '9px',
        color: colorStr(COLORS.HUD),
        stroke: colorStr(COLORS.BG),
        strokeThickness: 2,
        wordWrap: { width: textWrapWidth },
      }).setDepth(11).setAlpha(offer ? 0.72 : 0.52);
      this.favorUi.push(detailText);

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
      });
      this.favorUi.push(hit);
    }
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

    const hint = this.add.text(layout.centerX, deployY + btnHeight / 2 + (briefing.compact ? 8 : 10), 'DEPLOYS WITH SELECTED MISSIONS + FAVORS', {
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

  private saveMissions(): void {
    const saved = loadMissionSave();
    saved.activeMissions = this.missions;
    saved.rerollsRemaining = this.rerollsRemaining;
    try {
      localStorage.setItem('ssmt_missions', JSON.stringify(saved));
    } catch {
      // private browsing
    }
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
    for (const obj of this.rerollUi) obj.destroy();
    this.rerollUi = [];
    for (const obj of this.deployUi) obj.destroy();
    this.deployUi = [];
    for (const obj of this.favorUi) obj.destroy();
    this.favorUi = [];
    this.rerollCountText?.destroy();
  }
}

function colorStr(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}
