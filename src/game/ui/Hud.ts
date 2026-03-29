import Phaser from 'phaser';
import { COLORS } from '../constants';
import { getLayout } from '../layout';
import { MissionType } from '../types';
import type { ActiveMission } from '../types';

const HUD_COLOR = `#${COLORS.HUD.toString(16).padStart(6, '0')}`;
const GATE_COLOR = `#${COLORS.GATE.toString(16).padStart(6, '0')}`;
const SALVAGE_COLOR = `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`;

const PILL_HEIGHT = 34;
const PILL_GAP = 6;
const PILL_MARGIN_X = 12;
const PILL_MIN_GUTTER_GAP = 4;

export class Hud {
  private scene: Phaser.Scene;
  private scoreText: Phaser.GameObjects.Text;
  private bestText: Phaser.GameObjects.Text;
  private phaseText: Phaser.GameObjects.Text;
  private shieldText: Phaser.GameObjects.Text;
  private missionPills: Phaser.GameObjects.GameObject[] = [];
  private lastScore = -1;
  private lastBest = -1;
  private lastPhase = -1;
  private lastShield = false;
  private lastMissionHash = '';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const layout = getLayout();
    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: HUD_COLOR,
    };

    this.scoreText = scene.add.text(16, 16, 'CREDITS: 0', {
      ...textStyle,
      color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
    }).setDepth(100);

    this.bestText = scene.add.text(layout.gameWidth - 16, 16, 'BEST: 0', {
      ...textStyle,
    }).setOrigin(1, 0).setDepth(100);

    this.phaseText = scene.add.text(layout.centerX, 16, 'PHASE 1', {
      ...textStyle,
      fontSize: '12px',
      color: HUD_COLOR,
    }).setOrigin(0.5, 0).setAlpha(0.5).setDepth(100);

    this.shieldText = scene.add.text(16, 34, '', {
      ...textStyle,
      fontSize: '12px',
      color: '#44aaff',
    }).setDepth(100);
  }

  update(score: number, best: number, phase: number = 1, hasShield = false): void {
    const roundedScore = Math.floor(score);
    if (roundedScore !== this.lastScore) {
      this.scoreText.setText(`CREDITS: ${roundedScore}`);
      this.lastScore = roundedScore;
    }

    const roundedBest = Math.floor(best);
    if (roundedBest !== this.lastBest) {
      this.bestText.setText(`BEST: ${roundedBest}`);
      this.lastBest = roundedBest;
    }

    if (phase !== this.lastPhase) {
      this.phaseText.setText(`PHASE ${phase}`);
      this.lastPhase = phase;
    }

    if (hasShield !== this.lastShield) {
      this.shieldText.setText(hasShield ? 'SHIELD' : '');
      this.lastShield = hasShield;
    }
  }

  updateMissions(missions: ActiveMission[]): void {
    // Build a hash to avoid re-rendering every frame
    const hash = missions.map((m) => `${m.def.type}:${Math.floor(m.progress)}:${m.completed}`).join('|');
    if (hash === this.lastMissionHash) return;
    this.lastMissionHash = hash;

    // Clear old pills
    for (const obj of this.missionPills) obj.destroy();
    this.missionPills = [];

    if (missions.length === 0) return;

    const layout = getLayout();
    const count = missions.length;
    const availableWidth = layout.gameWidth - PILL_MARGIN_X * 2;
    const pillWidth = Math.min(
      (availableWidth - (count - 1) * PILL_GAP) / count,
      260,
    );
    const totalWidth = count * pillWidth + (count - 1) * PILL_GAP;
    const startX = (layout.gameWidth - totalWidth) / 2;
    const bottomGutterHeight = layout.gameHeight - layout.arenaBottom;
    const pillY = layout.arenaBottom + Math.max(
      PILL_MIN_GUTTER_GAP,
      (bottomGutterHeight - PILL_HEIGHT) / 2,
    );

    for (let i = 0; i < count; i++) {
      const m = missions[i];
      const prog = Math.min(Math.floor(m.progress), m.def.target);
      const done = m.completed;
      const x = startX + i * (pillWidth + PILL_GAP);

      // Pill background
      const bg = this.scene.add.graphics().setDepth(100);
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

      this.missionPills.push(bg);

      // Mission label (condensed to keep intent readable in the bottom gutter)
      const label = getHudMissionLabel(m);
      const labelColor = done ? GATE_COLOR : HUD_COLOR;
      const labelText = this.scene.add.text(x + pillWidth / 2, pillY + 6, label, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: labelColor,
        stroke: '#020806',
        strokeThickness: 2,
      }).setOrigin(0.5, 0).setDepth(101).setAlpha(done ? 0.94 : 0.82);
      this.missionPills.push(labelText);

      // Progress or done indicator
      const statusStr = done ? '\u2713 DONE' : `${prog}/${m.def.target}`;
      const statusColor = done ? GATE_COLOR : SALVAGE_COLOR;
      const statusText = this.scene.add.text(x + pillWidth / 2, pillY + 19, statusStr, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: statusColor,
        stroke: '#020806',
        strokeThickness: 2,
      }).setOrigin(0.5, 0).setDepth(101).setAlpha(done ? 0.9 : 0.74);
      this.missionPills.push(statusText);
    }
  }

  destroy(): void {
    this.scoreText.destroy();
    this.bestText.destroy();
    this.phaseText.destroy();
    this.shieldText.destroy();
    for (const obj of this.missionPills) obj.destroy();
    this.missionPills = [];
  }
}

function getHudMissionLabel(mission: ActiveMission): string {
  const target = mission.def.target;
  switch (mission.def.type) {
    case MissionType.REACH_CREDITS:
      return `HOLD ${target} CR`;
    case MissionType.EXTRACT_CREDITS:
      return `EXTRACT ${target} CR`;
    case MissionType.DESTROY_NPCS:
      return `RIVALS x${target}`;
    case MissionType.DESTROY_ENEMIES:
      return `ENEMIES x${target}`;
    case MissionType.MINING_CREDITS:
      return `MINE ${target} CR`;
    case MissionType.SALVAGE_CREDITS:
      return `SALVAGE ${target} CR`;
    case MissionType.SURVIVE_EXTRACT:
      return `SURVIVE ${target} + EXIT`;
    case MissionType.NO_DAMAGE_PHASE:
      return `FLAWLESS x${target}`;
    case MissionType.COLLECT_SHIELDS:
      return `SHIELDS x${target}`;
    default:
      return mission.def.label;
  }
}
