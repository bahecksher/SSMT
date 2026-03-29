import Phaser from 'phaser';
import {
  SALVAGE_POINTS_PER_SECOND,
  DRIFTER_MINING_POINTS_MIN,
  DRIFTER_MINING_POINTS_MAX,
} from '../data/tuning';
import { COLORS } from '../constants';
import type { Player } from '../entities/Player';
import type { SalvageDebris } from '../entities/SalvageDebris';
import type { DrifterHazard } from '../entities/DrifterHazard';
import type { ScoreSystem } from './ScoreSystem';

interface FloatingText {
  text: Phaser.GameObjects.Text;
  life: number;
}

export class SalvageSystem {
  private scene: Phaser.Scene;
  private player: Player;
  private scoreSystem: ScoreSystem;
  private debrisList: SalvageDebris[] = [];
  private inRange = false;
  private floatingTexts: FloatingText[] = [];
  private salvageFloatTimer = 0;
  private miningFloatTimer = 0;
  private salvageFloatPoints = 0;
  private miningFloatPoints = 0;
  private frameSalvageIncome = 0;
  private frameMiningIncome = 0;
  private salvageYieldMult = 1.0;
  private miningYieldMult = 1.0;

  constructor(scene: Phaser.Scene, player: Player, scoreSystem: ScoreSystem) {
    this.scene = scene;
    this.player = player;
    this.scoreSystem = scoreSystem;
  }

  setBoosts(salvageMult: number, miningMult: number): void {
    this.salvageYieldMult = salvageMult;
    this.miningYieldMult = miningMult;
  }

  addDebris(debris: SalvageDebris): void {
    this.debrisList.push(debris);
  }

  removeDebris(debris: SalvageDebris): void {
    const idx = this.debrisList.indexOf(debris);
    if (idx >= 0) this.debrisList.splice(idx, 1);
  }

  update(delta: number, drifters: DrifterHazard[]): void {
    const dt = delta / 1000;
    this.inRange = false;
    this.frameSalvageIncome = 0;
    this.frameMiningIncome = 0;

    // --- Salvage scoring: stack all overlapping salvage zones ---
    let totalSalvagePoints = 0;
    let hasRareInRange = false;

    for (const debris of this.debrisList) {
      if (!debris.active) continue;

      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        debris.x,
        debris.y,
      );

      if (dist <= debris.salvageRadius && !debris.depleted) {
        const points = SALVAGE_POINTS_PER_SECOND * debris.pointsMultiplier * this.salvageYieldMult * dt;
        totalSalvagePoints += points;
        if (debris.isRare) hasRareInRange = true;

        // Deplete salvage HP
        debris.hp -= dt;
        if (debris.hp <= 0) {
          debris.hp = 0;
          debris.depleted = true;
        }
      }
    }

    if (totalSalvagePoints > 0) {
      this.inRange = true;
      this.frameSalvageIncome = totalSalvagePoints;
      this.scoreSystem.addUnbanked(totalSalvagePoints);
      this.salvageFloatPoints += totalSalvagePoints;

      // Floating text for salvage - rare salvage is still punchier
      this.salvageFloatTimer += delta;
      const interval = hasRareInRange ? 300 : 500;
      if (this.salvageFloatTimer >= interval) {
        const displayPts = Math.max(1, Math.round(this.salvageFloatPoints));
        const color = hasRareInRange ? '#ff44ff' : `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`;
        this.spawnFloatingText(
          `+${displayPts}`,
          color,
          hasRareInRange ? '16px' : '13px',
          hasRareInRange,
        );
        this.salvageFloatTimer -= interval;
        this.salvageFloatPoints = 0;
      }
    } else {
      this.salvageFloatTimer = 0;
      this.salvageFloatPoints = 0;
    }

    // --- Mining scoring: proximity to drifter asteroids (closer = more points) ---
    let miningCount = 0;
    let totalMiningPoints = 0;
    let dangerClose = false;

    for (const drifter of drifters) {
      if (!drifter.active || !drifter.isMineable || drifter.radiusScale < 1.5) continue;

      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        drifter.x,
        drifter.y,
      );

      // In mining zone but not touching (touching = death handled elsewhere)
      if (dist <= drifter.miningRadius && dist > drifter.radius && !drifter.depleted) {
        // Proximity multiplier: 0 at outer edge → 1 at asteroid body
        const proximity = 1 - (dist - drifter.radius) / (drifter.miningRadius - drifter.radius);
        const ptsPerSec = DRIFTER_MINING_POINTS_MIN + (DRIFTER_MINING_POINTS_MAX - DRIFTER_MINING_POINTS_MIN) * proximity * proximity;
        totalMiningPoints += ptsPerSec * this.miningYieldMult * dt;
        miningCount++;
        if (proximity > 0.7) dangerClose = true;

        // Deplete asteroid HP
        drifter.hp -= dt;
        if (drifter.hp <= 0) {
          drifter.hp = 0;
          drifter.depleted = true;
        }
      }
    }

    if (miningCount > 0) {
      this.inRange = true;
      this.frameMiningIncome = totalMiningPoints;
      this.scoreSystem.addUnbanked(totalMiningPoints);
      this.miningFloatPoints += totalMiningPoints;

      // Floating text for mining — faster when danger-close
      this.miningFloatTimer += delta;
      const miningInterval = dangerClose ? 350 : 600;
      if (this.miningFloatTimer >= miningInterval) {
        const fontSize = dangerClose ? '15px' : '11px';
        this.spawnFloatingText(
          `+${Math.max(1, Math.round(this.miningFloatPoints))}`,
          `#${COLORS.HAZARD.toString(16).padStart(6, '0')}`,
          fontSize,
          dangerClose,
        );
        this.miningFloatTimer -= miningInterval;
        this.miningFloatPoints = 0;
      }
    } else {
      this.miningFloatTimer = 0;
      this.miningFloatPoints = 0;
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= delta;
      ft.text.y -= delta * 0.04;
      ft.text.setAlpha(Math.max(0, ft.life / 800));
      if (ft.life <= 0) {
        ft.text.destroy();
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private spawnFloatingText(
    label: string,
    color: string,
    fontSize: string,
    bold: boolean,
    x = this.player.x + Phaser.Math.Between(-15, 15),
    y = this.player.y - 20,
  ): void {
    const text = this.scene.add.text(
      x,
      y,
      label,
      {
        fontFamily: 'monospace',
        fontSize,
        color,
        fontStyle: bold ? 'bold' : 'normal',
      },
    ).setOrigin(0.5).setDepth(90);

    this.floatingTexts.push({ text, life: 800 });
  }

  spawnRewardText(label: string, x: number, y: number, color = '#ffdd55'): void {
    this.spawnFloatingText(label, color, '18px', true, x, y);
  }

  isInRange(): boolean {
    return this.inRange;
  }

  getLastFrameSalvageIncome(): number {
    return this.frameSalvageIncome;
  }

  getLastFrameMiningIncome(): number {
    return this.frameMiningIncome;
  }

  destroy(): void {
    for (const ft of this.floatingTexts) ft.text.destroy();
    this.floatingTexts = [];
  }
}
