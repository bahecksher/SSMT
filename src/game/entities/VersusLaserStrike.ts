import Phaser from 'phaser';
import { getLayout } from '../layout';
import {
  VERSUS_LASER_WARNING_MS,
  VERSUS_LASER_LETHAL_MS,
  VERSUS_LASER_WIDTH,
  VERSUS_LASER_COLOR,
} from '../data/tuning';
import { playSfx } from '../systems/SfxSystem';

// Six lanes: three horizontal (top/middle/bottom = vertical position bands)
// and three vertical (left/center/right = horizontal position bands).
export type VersusLaserLane =
  | 'top' | 'middle' | 'bottom'
  | 'left' | 'center' | 'right';

const HORIZONTAL_LANES: ReadonlySet<VersusLaserLane> = new Set(['top', 'middle', 'bottom']);

/**
 * Cross-arena lane sweep spawned on the receiver when the peer fires their
 * sabotage laser. Violet beam telegraphed for ~1.5s then lethal for ~0.5s.
 * Horizontal lanes sweep across width at a fixed Y; vertical lanes sweep
 * down the height at a fixed X.
 */
export class VersusLaserStrike {
  graphic: Phaser.GameObjects.Graphics;
  active = true;
  private lethal = false;
  private elapsed = 0;
  private readonly totalDuration: number;
  readonly width: number;
  readonly isHorizontal: boolean;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, lane: VersusLaserLane) {
    this.scene = scene;
    const layout = getLayout();
    this.width = VERSUS_LASER_WIDTH;
    this.isHorizontal = HORIZONTAL_LANES.has(lane);
    if (this.isHorizontal) {
      const arenaH = layout.arenaBottom - layout.arenaTop;
      const yByLane: Record<'top' | 'middle' | 'bottom', number> = {
        top: layout.arenaTop + arenaH * 0.25,
        middle: layout.arenaTop + arenaH * 0.5,
        bottom: layout.arenaTop + arenaH * 0.75,
      };
      const y = yByLane[lane as 'top' | 'middle' | 'bottom'];
      this.x1 = layout.arenaLeft;
      this.y1 = y;
      this.x2 = layout.arenaRight;
      this.y2 = y;
    } else {
      const arenaW = layout.arenaRight - layout.arenaLeft;
      const xByLane: Record<'left' | 'center' | 'right', number> = {
        left: layout.arenaLeft + arenaW * 0.25,
        center: layout.arenaLeft + arenaW * 0.5,
        right: layout.arenaLeft + arenaW * 0.75,
      };
      const x = xByLane[lane as 'left' | 'center' | 'right'];
      this.x1 = x;
      this.y1 = layout.arenaTop;
      this.x2 = x;
      this.y2 = layout.arenaBottom;
    }
    this.totalDuration = VERSUS_LASER_WARNING_MS + VERSUS_LASER_LETHAL_MS;
    this.graphic = scene.add.graphics().setDepth(7);
    playSfx(this.scene, 'beamCharge', { volumeScale: 0.6, rate: 1.28, detune: 1050 });
  }

  update(delta: number): void {
    if (!this.active) return;
    this.elapsed += delta;
    if (this.elapsed >= this.totalDuration) {
      this.active = false;
      return;
    }
    const wasLethal = this.lethal;
    this.lethal = this.elapsed >= VERSUS_LASER_WARNING_MS;
    if (this.lethal && !wasLethal) {
      playSfx(this.scene, 'beamFire', { volumeScale: 1.05, rate: 0.84, detune: -450 });
    }
    this.draw();
  }

  isLethal(): boolean {
    return this.lethal;
  }

  /** True if a circle at (x,y,r) intersects the lethal lane. */
  hits(x: number, y: number, r: number): boolean {
    if (!this.lethal) return false;
    const halfBeam = this.width / 2 + r;
    if (this.isHorizontal) {
      if (x < this.x1 - r || x > this.x2 + r) return false;
      return Math.abs(y - this.y1) <= halfBeam;
    }
    if (y < this.y1 - r || y > this.y2 + r) return false;
    return Math.abs(x - this.x1) <= halfBeam;
  }

  private draw(): void {
    const g = this.graphic;
    g.clear();
    const color = VERSUS_LASER_COLOR;

    if (!this.lethal) {
      const warningProgress = this.elapsed / VERSUS_LASER_WARNING_MS;
      const flicker = Math.sin(this.elapsed * 0.04) * 0.35 + 0.4;
      const alpha = flicker * (0.35 + warningProgress * 0.5);

      g.lineStyle(2, color, alpha);
      g.lineBetween(this.x1, this.y1, this.x2, this.y2);

      const growWidth = this.width * warningProgress * 0.6;
      g.lineStyle(growWidth, color, alpha * 0.22);
      g.lineBetween(this.x1, this.y1, this.x2, this.y2);
    } else {
      const activeProgress = (this.elapsed - VERSUS_LASER_WARNING_MS) / VERSUS_LASER_LETHAL_MS;
      const fadeAlpha = activeProgress > 0.7 ? 1 - (activeProgress - 0.7) / 0.3 : 1;

      g.lineStyle(this.width * 2, color, 0.18 * fadeAlpha);
      g.lineBetween(this.x1, this.y1, this.x2, this.y2);

      g.lineStyle(this.width, color, 0.92 * fadeAlpha);
      g.lineBetween(this.x1, this.y1, this.x2, this.y2);

      g.lineStyle(this.width * 0.3, 0xffffff, 0.75 * fadeAlpha);
      g.lineBetween(this.x1, this.y1, this.x2, this.y2);
    }
  }

  destroy(): void {
    this.graphic.destroy();
  }
}
