import Phaser from 'phaser';
import { COLORS, TITLE_FONT, UI_FONT, readableFontSize } from '../constants';
import { getLayout, isNarrowViewport } from '../layout';
import { MissionType } from '../types';
import type { ActiveMission } from '../types';
import { colorStr } from '../utils/geometry';

const PILL_HEIGHT = 50;
const PILL_GAP = 8;
const PILL_MARGIN_X = 14;
const PILL_MIN_GUTTER_GAP = 4;
const PILL_HIDE_OFFSET_Y = -18;
const PILL_VISIBILITY_TWEEN_MS = 180;

export class Hud {
  private scene: Phaser.Scene;
  private scoreText: Phaser.GameObjects.Text;
  private livesText: Phaser.GameObjects.Text;

  private phaseText: Phaser.GameObjects.Text;
  private shieldText: Phaser.GameObjects.Text;
  private missionPillRoot: Phaser.GameObjects.Container;
  private missionPills: Phaser.GameObjects.GameObject[] = [];
  private lastPhase = -1;
  private lastShield = false;
  private lastMissionHash = '';
  private missionPillsHidden = false;
  private missionPillTween: Phaser.Tweens.Tween | null = null;
  private currentMissions: ActiveMission[] = [];
  private readonly topMargin: number;
  private readonly compactHud: boolean;
  private readonly narrowHud: boolean;
  private readonly elementGap: number;
  private readonly scoreLeftX: number;
  private readonly topFontBaseSize: number;
  private readonly topFontMinSize: number;
  private currentTopFontSize: number;
  private topHudBottom = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const layout = getLayout();
    const compactHud = layout.gameWidth <= 430;
    const narrowHud = isNarrowViewport(layout);
    this.compactHud = compactHud;
    this.narrowHud = narrowHud;
    this.elementGap = narrowHud ? 6 : 10;
    this.scoreLeftX = narrowHud ? 10 : 16;
    const topMargin = compactHud ? 12 : 16;
    const scoreFontSize = narrowHud ? 11 : compactHud ? 13 : 16;
    const minorFontSize = compactHud ? 11 : 14;
    const shieldY = topMargin + (compactHud ? 16 : 24);
    this.topMargin = topMargin;
    this.topFontBaseSize = scoreFontSize;
    this.topFontMinSize = compactHud ? 9 : 10;
    this.currentTopFontSize = scoreFontSize;
    const titleTextStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: TITLE_FONT,
      fontSize: readableFontSize(scoreFontSize),
      color: colorStr(COLORS.HUD),
    };
    const minorTextStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      ...titleTextStyle,
      fontFamily: UI_FONT,
    };

    this.scoreText = scene.add.text(this.scoreLeftX, topMargin, narrowHud ? 'CR 0' : 'CREDITS 0', {
      ...titleTextStyle,
      color: colorStr(COLORS.SALVAGE),
    }).setDepth(100);

    this.livesText = scene.add.text(this.scoreText.x + this.scoreText.width + this.elementGap, topMargin, '', {
      ...titleTextStyle,
      color: colorStr(COLORS.SALVAGE),
    }).setDepth(100);

    this.phaseText = scene.add.text(layout.gameWidth - 16, topMargin, 'PHASE 1', {
      ...titleTextStyle,
    }).setOrigin(1, 0).setDepth(100);

    this.shieldText = scene.add.text(16, shieldY, '', {
      ...minorTextStyle,
      fontSize: readableFontSize(minorFontSize),
      color: colorStr(COLORS.SHIELD),
    }).setDepth(100);

    this.missionPillRoot = scene.add.container(0, 0).setDepth(100);
    this.updateTopHudBottom();
  }

  update(
    score: number,
    _best: number,
    phase: number = 1,
    hasShield = false,
    campaignLivesRemaining: number | null = null,
  ): void {
    const roundedScore = Math.floor(score);
    this.updateTopRowLayout(roundedScore, campaignLivesRemaining);

    const roundedPhase = Math.max(1, Math.floor(phase));
    if (roundedPhase !== this.lastPhase) {
      this.phaseText.setText(`PHASE ${roundedPhase}`);
      this.lastPhase = roundedPhase;
    }
    this.phaseText
      .setFontSize(readableFontSize(this.currentTopFontSize))
      .setPosition(getLayout().gameWidth - 16, this.topMargin);

    if (hasShield !== this.lastShield) {
      this.shieldText.setText(hasShield ? 'SHIELD' : '');
      this.lastShield = hasShield;
    }

    this.updateTopHudBottom();
  }

  updateMissions(missions: ActiveMission[]): void {
    this.currentMissions = missions;

    // Build a hash to avoid re-rendering every frame
    const hash = missions.map((m) => `${m.def.type}:${Math.floor(m.progress)}:${m.completed}`).join('|');
    if (hash === this.lastMissionHash) return;
    this.lastMissionHash = hash;

    // Clear old pills
    this.missionPillRoot.removeAll(true);
    this.missionPills = [];

    if (missions.length === 0) return;

    const layout = getLayout();
    const compactHud = layout.gameWidth <= 430;
    const missionLabelFontSize = compactHud ? 9 : 11;
    const missionStrokeThickness = compactHud ? 2 : 3;
    const count = missions.length;
    const availableWidth = layout.gameWidth - PILL_MARGIN_X * 2;
    const pillWidth = Math.min(
      (availableWidth - (count - 1) * PILL_GAP) / count,
      260,
    );
    const totalWidth = count * pillWidth + (count - 1) * PILL_GAP;
    const startX = (layout.gameWidth - totalWidth) / 2;
    const bottomGutterHeight = layout.gameHeight - layout.arenaBottom;
    const pillY = layout.arenaBottom + Math.min(
      Phaser.Math.Clamp(Math.round(bottomGutterHeight * 0.025), PILL_MIN_GUTTER_GAP, 6),
      Math.max(PILL_MIN_GUTTER_GAP, bottomGutterHeight - PILL_HEIGHT),
    );

    for (let i = 0; i < count; i++) {
      const m = missions[i];
      const prog = Math.min(Math.floor(m.progress), m.def.target);
      const done = m.completed;
      const x = startX + i * (pillWidth + PILL_GAP);

      // Pill background
      const bg = this.scene.add.graphics();
      const bgColor = done ? COLORS.GATE : COLORS.BG;
      const bgAlpha = done ? 0.12 : 0.75;
      const borderColor = done ? COLORS.GATE : COLORS.HUD;
      const borderAlpha = done ? 0.6 : 0.25;
      bg.fillStyle(bgColor, bgAlpha);
      bg.fillRoundedRect(x, pillY, pillWidth, PILL_HEIGHT, 8);
      bg.lineStyle(1.5, borderColor, borderAlpha);
      bg.strokeRoundedRect(x, pillY, pillWidth, PILL_HEIGHT, 8);

      // Progress bar fill (subtle, behind text)
      if (!done && m.def.target > 0) {
        const fillFraction = Math.min(prog / m.def.target, 1);
        if (fillFraction > 0) {
          const fillWidth = (pillWidth - 4) * fillFraction;
          bg.fillStyle(COLORS.HUD, 0.08);
          bg.fillRoundedRect(x + 2, pillY + 2, fillWidth, PILL_HEIGHT - 4, {
            tl: 6, bl: 6,
            tr: fillFraction > 0.95 ? 6 : 0,
            br: fillFraction > 0.95 ? 6 : 0,
          });
        }
      }

      this.missionPillRoot.add(bg);
      this.missionPills.push(bg);

      // Mission label (condensed to keep intent readable in the bottom gutter)
      const label = getHudMissionLabel(m);
      const labelColor = colorStr(done ? COLORS.GATE : COLORS.HUD);
      const labelText = this.scene.add.text(x + pillWidth / 2, pillY + PILL_HEIGHT / 2, label, {
        fontFamily: UI_FONT,
        fontSize: readableFontSize(missionLabelFontSize),
        color: labelColor,
        align: 'center',
        stroke: colorStr(COLORS.BG),
        strokeThickness: missionStrokeThickness,
        wordWrap: { width: Math.max(52, pillWidth - 10), useAdvancedWrap: true },
      }).setOrigin(0.5).setAlpha(done ? 0.94 : 0.82);
      labelText.setLineSpacing(compactHud ? -1 : 0);
      this.missionPillRoot.add(labelText);
      this.missionPills.push(labelText);
    }

    this.applyMissionPillVisibility(false);
  }

  setMissionPillsHidden(hidden: boolean): void {
    if (this.missionPillsHidden === hidden) return;
    this.missionPillsHidden = hidden;
    this.applyMissionPillVisibility(true);
  }

  destroy(): void {
    if (this.missionPillTween) {
      this.missionPillTween.stop();
      this.missionPillTween = null;
    }
    this.scoreText.destroy();
    this.livesText.destroy();
    this.phaseText.destroy();
    this.shieldText.destroy();
    this.missionPillRoot.destroy(true);
    this.missionPills = [];
  }

  refreshPalette(): void {
    this.scoreText.setColor(colorStr(COLORS.SALVAGE));
    this.livesText.setColor(colorStr(COLORS.SALVAGE));
    this.phaseText.setColor(colorStr(COLORS.HUD));
    this.shieldText.setColor(colorStr(COLORS.SHIELD));
    this.lastMissionHash = '';
    this.updateMissions(this.currentMissions);
  }

  getTopHudBottom(): number {
    return this.topHudBottom;
  }

  private updateTopRowLayout(roundedScore: number, campaignLivesRemaining: number | null): void {
    const layout = getLayout();
    const pauseButtonWidth = this.compactHud ? 58 : 64;
    const pauseSafeGap = this.narrowHud ? 8 : 12;
    const maxTopRowWidth = Math.max(
      84,
      layout.centerX - pauseButtonWidth / 2 - pauseSafeGap - this.scoreLeftX,
    );
    const fullScoreLabel = `CREDITS ${roundedScore}`;
    const compactScoreLabel = `CR ${roundedScore}`;
    const fullLivesLabel = campaignLivesRemaining !== null ? `// LIVES ${campaignLivesRemaining}` : '';
    const compactLivesLabel = campaignLivesRemaining !== null ? `// LIV ${campaignLivesRemaining}` : '';
    const ultraCompactLivesLabel = campaignLivesRemaining !== null ? `// ${campaignLivesRemaining}` : '';
    const variants = this.narrowHud
      ? [
          { score: compactScoreLabel, lives: compactLivesLabel, baseSize: this.topFontBaseSize },
          { score: compactScoreLabel, lives: ultraCompactLivesLabel, baseSize: this.topFontBaseSize },
        ]
      : [
          { score: fullScoreLabel, lives: fullLivesLabel, baseSize: this.topFontBaseSize },
          { score: compactScoreLabel, lives: compactLivesLabel, baseSize: Math.max(this.topFontMinSize + 1, this.topFontBaseSize - 1) },
          { score: compactScoreLabel, lives: ultraCompactLivesLabel, baseSize: Math.max(this.topFontMinSize + 1, this.topFontBaseSize - 1) },
        ];

    let chosenGap = this.elementGap;
    for (let i = 0; i < variants.length; i += 1) {
      const variant = variants[i];
      let fontSize = variant.baseSize;
      this.scoreText.setText(variant.score);
      this.livesText.setText(variant.lives);

      while (fontSize >= this.topFontMinSize) {
        this.scoreText.setFontSize(readableFontSize(fontSize));
        this.livesText.setFontSize(readableFontSize(fontSize));
        const gap = variant.lives.length > 0 && fontSize <= this.topFontMinSize + 1
          ? Math.max(4, this.elementGap - 2)
          : this.elementGap;
        const combinedWidth = this.getTopRowWidth(gap);

        if (combinedWidth <= maxTopRowWidth || fontSize === this.topFontMinSize) {
          chosenGap = gap;
          this.currentTopFontSize = fontSize;
          if (combinedWidth <= maxTopRowWidth || i === variants.length - 1) {
            this.scoreText.setPosition(this.scoreLeftX, this.topMargin);
            this.livesText.setPosition(
              this.scoreText.x + this.scoreText.width + (this.livesText.text.length > 0 ? chosenGap : 0),
              this.topMargin,
            );
            return;
          }
          break;
        }

        fontSize -= 1;
      }
    }

    this.scoreText.setPosition(this.scoreLeftX, this.topMargin);
    this.livesText.setPosition(
      this.scoreText.x + this.scoreText.width + (this.livesText.text.length > 0 ? chosenGap : 0),
      this.topMargin,
    );
  }

  private getTopRowWidth(gap: number): number {
    return this.scoreText.width + (this.livesText.text.length > 0 ? gap + this.livesText.width : 0);
  }

  private updateTopHudBottom(): void {
    const scoreBottom = this.scoreText.y + this.scoreText.height;
    const livesBottom = this.livesText.text.length > 0 ? this.livesText.y + this.livesText.height : 0;
    const phaseBottom = this.phaseText.y + this.phaseText.height;
    const shieldBottom = this.shieldText.text.length > 0 ? this.shieldText.y + this.shieldText.height : 0;
    this.topHudBottom = Math.max(scoreBottom, livesBottom, phaseBottom, shieldBottom);
  }

  private applyMissionPillVisibility(animate: boolean): void {
    if (this.missionPillTween) {
      this.missionPillTween.stop();
      this.missionPillTween = null;
    }

    if (this.missionPills.length === 0) {
      this.missionPillRoot.setVisible(false);
      this.missionPillRoot.setAlpha(0);
      this.missionPillRoot.setY(PILL_HIDE_OFFSET_Y);
      return;
    }

    if (!animate) {
      this.missionPillRoot.setVisible(!this.missionPillsHidden);
      this.missionPillRoot.setAlpha(this.missionPillsHidden ? 0 : 1);
      this.missionPillRoot.setY(this.missionPillsHidden ? PILL_HIDE_OFFSET_Y : 0);
      return;
    }

    if (this.missionPillsHidden) {
      this.missionPillRoot.setVisible(true);
      this.missionPillTween = this.scene.tweens.add({
        targets: this.missionPillRoot,
        alpha: 0,
        y: PILL_HIDE_OFFSET_Y,
        duration: PILL_VISIBILITY_TWEEN_MS,
        ease: 'Sine.In',
        onComplete: () => {
          this.missionPillRoot.setVisible(false);
          this.missionPillTween = null;
        },
      });
      return;
    }

    this.missionPillRoot.setVisible(true);
    this.missionPillRoot.setAlpha(0);
    this.missionPillRoot.setY(PILL_HIDE_OFFSET_Y);
    this.missionPillTween = this.scene.tweens.add({
      targets: this.missionPillRoot,
      alpha: 1,
      y: 0,
      duration: PILL_VISIBILITY_TWEEN_MS,
      ease: 'Sine.Out',
      onComplete: () => {
        this.missionPillTween = null;
      },
    });
  }
}

function getHudMissionLabel(mission: ActiveMission): string {
  const target = mission.def.target;
  switch (mission.def.type) {
    case MissionType.BREAK_ASTEROIDS:
      return `ROCKS x${target}`;
    case MissionType.EXTRACT_CREDITS:
      return `BANK ${target}`;
    case MissionType.DESTROY_NPCS:
      return `RIVALS x${target}`;
    case MissionType.DESTROY_ENEMIES:
      return `ENEMIES x${target}`;
    case MissionType.MINING_CREDITS:
      return `MINE ${target}`;
    case MissionType.SALVAGE_CREDITS:
      return `SALVAGE ${target}`;
    case MissionType.SURVIVE_EXTRACT:
      return `EXIT ${target} PHASES`;
    case MissionType.NO_DAMAGE_PHASE:
      return `FLAWLESS x${target}`;
    case MissionType.COLLECT_SHIELDS:
      return `SHIELDS x${target}`;
    default:
      return mission.def.label;
  }
}
