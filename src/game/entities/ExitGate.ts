import Phaser from 'phaser';
import { COLORS } from '../constants';
import { EXIT_GATE_RADIUS, EXIT_GATE_PREVIEW, EXIT_GATE_DURATION, EXIT_GATE_INSET } from '../data/tuning';
import { getLayout } from '../layout';

export class ExitGate {
  graphic: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  active = true;
  extractable = false;

  /** Fires once the frame extractable first becomes true. */
  justBecameExtractable = false;

  private elapsed = 0;
  private previewTime: number;
  private extractDuration: number;
  private totalDuration: number;
  private ringPulse = 0;

  constructor(
    scene: Phaser.Scene,
    fixedPosition?: { x: number; y: number },
    previewTime = EXIT_GATE_PREVIEW,
    extractDuration = EXIT_GATE_DURATION,
  ) {
    this.previewTime = previewTime;
    this.extractDuration = extractDuration;
    this.totalDuration = previewTime + extractDuration;

    if (fixedPosition) {
      this.x = fixedPosition.x;
      this.y = fixedPosition.y;
    } else {
      const layout = getLayout();
      const edge = Phaser.Math.Between(0, 3);
      switch (edge) {
        case 0:
          this.x = Phaser.Math.Between(layout.arenaLeft + EXIT_GATE_INSET, layout.arenaRight - EXIT_GATE_INSET);
          this.y = layout.arenaTop + EXIT_GATE_INSET;
          break;
        case 1:
          this.x = Phaser.Math.Between(layout.arenaLeft + EXIT_GATE_INSET, layout.arenaRight - EXIT_GATE_INSET);
          this.y = layout.arenaBottom - EXIT_GATE_INSET;
          break;
        case 2:
          this.x = layout.arenaLeft + EXIT_GATE_INSET;
          this.y = Phaser.Math.Between(layout.arenaTop + EXIT_GATE_INSET, layout.arenaBottom - EXIT_GATE_INSET);
          break;
        default:
          this.x = layout.arenaRight - EXIT_GATE_INSET;
          this.y = Phaser.Math.Between(layout.arenaTop + EXIT_GATE_INSET, layout.arenaBottom - EXIT_GATE_INSET);
          break;
      }
    }

    this.graphic = scene.add.graphics().setDepth(8);
    this.graphic.setPosition(this.x, this.y);
  }

  update(delta: number): void {
    if (!this.active) return;

    this.elapsed += delta;
    this.ringPulse += delta * 0.005;
    this.justBecameExtractable = false;

    if (this.elapsed >= this.totalDuration) {
      this.active = false;
      return;
    }

    if (!this.extractable && this.elapsed >= this.previewTime) {
      this.extractable = true;
      this.justBecameExtractable = true;
    }

    this.draw();
  }

  updateVisual(delta: number): void {
    if (!this.active) return;
    this.ringPulse += delta * 0.005;
    this.draw();
  }

  private draw(): void {
    const g = this.graphic;
    g.clear();
    g.setAlpha(1);

    if (this.extractable) {
      // Active/extractable — gentle salvage-style flicker with white flash on dim frames
      const extractElapsed = this.elapsed - this.previewTime;
      const remaining = 1 - extractElapsed / this.extractDuration;
      const timeLeft = this.extractDuration - extractElapsed;

      // Salvage-style blink: speeds up in the last portion
      const blinkRate = timeLeft < this.extractDuration * 0.5 ? 0.08 : 0.15;
      const bright = Math.sin(timeLeft * blinkRate) > 0;
      const baseAlpha = bright ? 1 : 0.3;

      // Gate core
      g.lineStyle(2, COLORS.GATE, 0.85 * baseAlpha);
      g.strokeCircle(0, 0, EXIT_GATE_RADIUS * 0.55);
      g.fillStyle(COLORS.GATE, 0.08 * baseAlpha);
      g.fillCircle(0, 0, EXIT_GATE_RADIUS * 0.55);

      // Inner diamond
      g.lineStyle(1, 0xffffff, 0.5 * baseAlpha);
      const s = EXIT_GATE_RADIUS * 0.25;
      g.beginPath();
      g.moveTo(0, -s);
      g.lineTo(s, 0);
      g.lineTo(0, s);
      g.lineTo(-s, 0);
      g.closePath();
      g.strokePath();

      // Timer ring — shows remaining extract time
      g.lineStyle(2, COLORS.GATE, 0.5 * baseAlpha);
      g.beginPath();
      g.arc(0, 0, EXIT_GATE_RADIUS + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * remaining, false);
      g.strokePath();

      // Small white flash on dim frames
      if (!bright) {
        g.fillStyle(0xffffff, 0.2);
        g.fillCircle(0, 0, EXIT_GATE_RADIUS * 0.12);
      }
    } else {
      // Preview phase — large circle closing in toward gate center
      const previewProgress = this.elapsed / this.previewTime;

      // Circle radius shrinks from large (6x) down to the gate radius
      const maxRadius = EXIT_GATE_RADIUS * 6;
      const minRadius = EXIT_GATE_RADIUS * 0.55;
      const closingRadius = maxRadius - (maxRadius - minRadius) * previewProgress;

      // Alpha grows as the circle closes in
      const alpha = 0.08 + previewProgress * 0.35;
      g.lineStyle(1.5, COLORS.GATE, alpha);
      g.strokeCircle(0, 0, closingRadius);

      // Faint inner marker so the player knows the destination
      g.lineStyle(1, COLORS.GATE, 0.1 + previewProgress * 0.15);
      g.strokeCircle(0, 0, minRadius);

      // Static inner diamond
      g.lineStyle(1, 0xffffff, 0.08 + previewProgress * 0.12);
      const s = EXIT_GATE_RADIUS * 0.2;
      g.beginPath();
      g.moveTo(0, -s);
      g.lineTo(s, 0);
      g.lineTo(0, s);
      g.lineTo(-s, 0);
      g.closePath();
      g.strokePath();
    }
  }

  getTimeRemaining(): number {
    return Math.max(0, this.totalDuration - this.elapsed);
  }

  destroy(): void {
    this.graphic.destroy();
  }
}
