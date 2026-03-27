import Phaser from 'phaser';
import { ARENA_LEFT, ARENA_TOP, ARENA_RIGHT, ARENA_BOTTOM, COLORS } from '../constants';
import { EXIT_GATE_RADIUS, EXIT_GATE_DURATION, EXIT_GATE_INSET, EXIT_GATE_GRACE_DELAY } from '../data/tuning';

export class ExitGate {
  graphic: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  active = true;
  extractable = false;

  private elapsed = 0;
  private duration: number;
  private ringPulse = 0;

  constructor(
    scene: Phaser.Scene,
    fixedPosition?: { x: number; y: number },
    duration = EXIT_GATE_DURATION,
  ) {
    this.duration = duration;

    if (fixedPosition) {
      // Used for entry gate — spawn at a specific position
      this.x = fixedPosition.x;
      this.y = fixedPosition.y;
    } else {
      // Spawn along a random arena edge
      const edge = Phaser.Math.Between(0, 3);
      switch (edge) {
        case 0: // top
          this.x = Phaser.Math.Between(ARENA_LEFT + EXIT_GATE_INSET, ARENA_RIGHT - EXIT_GATE_INSET);
          this.y = ARENA_TOP + EXIT_GATE_INSET;
          break;
        case 1: // bottom
          this.x = Phaser.Math.Between(ARENA_LEFT + EXIT_GATE_INSET, ARENA_RIGHT - EXIT_GATE_INSET);
          this.y = ARENA_BOTTOM - EXIT_GATE_INSET;
          break;
        case 2: // left
          this.x = ARENA_LEFT + EXIT_GATE_INSET;
          this.y = Phaser.Math.Between(ARENA_TOP + EXIT_GATE_INSET, ARENA_BOTTOM - EXIT_GATE_INSET);
          break;
        default: // right
          this.x = ARENA_RIGHT - EXIT_GATE_INSET;
          this.y = Phaser.Math.Between(ARENA_TOP + EXIT_GATE_INSET, ARENA_BOTTOM - EXIT_GATE_INSET);
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

    if (this.elapsed >= this.duration) {
      this.active = false;
      return;
    }

    // Gate becomes extractable after the grace delay
    if (!this.extractable && this.elapsed >= EXIT_GATE_GRACE_DELAY) {
      this.extractable = true;
    }

    this.draw();
  }

  private draw(): void {
    const g = this.graphic;
    g.clear();
    g.setAlpha(1);

    const remaining = 1 - this.elapsed / this.duration;
    const urgent = remaining < 0.4;

    // Expanding ring animation
    const ringRadius = EXIT_GATE_RADIUS + Math.sin(this.ringPulse) * 8;

    // Outer glow ring
    g.lineStyle(1, COLORS.GATE, 0.08 + (urgent ? 0.06 : 0));
    g.strokeCircle(0, 0, ringRadius * 2);

    // Timer ring - shrinks as time runs out
    g.lineStyle(2, COLORS.GATE, 0.6);
    g.beginPath();
    g.arc(0, 0, EXIT_GATE_RADIUS + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * remaining, false);
    g.strokePath();

    if (this.extractable) {
      // Pulsing core when extractable — scales and brightens rhythmically
      const pulse = Math.sin(this.ringPulse * 4);
      const coreScale = 0.55 + pulse * 0.1;
      const coreAlpha = 0.6 + pulse * 0.3;

      g.lineStyle(2, COLORS.GATE, coreAlpha);
      g.strokeCircle(0, 0, EXIT_GATE_RADIUS * coreScale);

      // Pulsing fill
      g.fillStyle(COLORS.GATE, 0.06 + pulse * 0.04);
      g.fillCircle(0, 0, EXIT_GATE_RADIUS * coreScale);

      // Inner diamond pulses too
      g.lineStyle(1, 0xffffff, 0.4 + pulse * 0.2);
      const s = EXIT_GATE_RADIUS * 0.25;
      g.beginPath();
      g.moveTo(0, -s);
      g.lineTo(s, 0);
      g.lineTo(0, s);
      g.lineTo(-s, 0);
      g.closePath();
      g.strokePath();

      // Second expanding ring for emphasis
      const ring2 = EXIT_GATE_RADIUS * (0.8 + pulse * 0.15);
      g.lineStyle(1, COLORS.GATE, 0.15 + pulse * 0.1);
      g.strokeCircle(0, 0, ring2);
    } else {
      // Inactive/warming up — dimmer, no pulse
      g.lineStyle(1.5, COLORS.GATE, 0.35);
      g.strokeCircle(0, 0, EXIT_GATE_RADIUS * 0.6);
      g.fillStyle(COLORS.GATE, 0.03);
      g.fillCircle(0, 0, EXIT_GATE_RADIUS * 0.6);

      // Static inner diamond
      g.lineStyle(1, 0xffffff, 0.2);
      const s = EXIT_GATE_RADIUS * 0.25;
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
    return Math.max(0, this.duration - this.elapsed);
  }

  destroy(): void {
    this.graphic.destroy();
  }
}
