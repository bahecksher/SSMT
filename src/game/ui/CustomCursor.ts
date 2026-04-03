import Phaser from 'phaser';
import { COLORS } from '../constants';

const COLOR_IDLE = 0xffffff;
const CURSOR_ALPHA = 0.4;

// Triangle: ~66% of player's triR (player triR = VISUAL_SIZE * 1.3 = 10.4)
const TRI_RADIUS = 7;

// Outer reticle circle
const CIRCLE_RADIUS = 14;

// Crosshair tick marks: extend inward through circle and outward beyond it
const TICK_INNER = 4;  // px inside the circle toward center
const TICK_OUTER = 6;  // px outside the circle

// Radians to leave as a gap on each side of a tick where the circle is broken
const ARC_GAP = 0.28;

// Morph settings
const MORPH_LERP = 0.25;          // per-frame lerp factor (~0.22s to 90%)
const MORPH_PADDING = 4;          // px padding around target element
const MORPH_DEFAULT_RADIUS = 8;   // fallback corner radius when not tagged
const MORPH_SNAP_THRESHOLD = 0.01;
const MORPH_DOT_RADIUS = 3;       // pointer tracking dot size when morphed

function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const gc = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (gc << 8) | bl;
}

export class CustomCursor {
  private graphic: Phaser.GameObjects.Graphics;
  private heading = -Math.PI / 2; // default: pointing up
  private active: boolean;
  private hovering = false;
  private styleEl: HTMLStyleElement | null = null;

  // Morph state
  private morphProgress = 0;
  private morphTarget: { cx: number; cy: number; w: number; h: number; cr: number } | null = null;
  private pointerScreenX = 0;
  private pointerScreenY = 0;

  constructor(scene: Phaser.Scene) {
    this.active = !scene.sys.game.device.input.touch;

    this.graphic = scene.add
      .graphics()
      .setDepth(9999)
      .setScrollFactor(0);

    if (this.active) {
      // CSS !important overrides Phaser's useHandCursor writing
      // canvas.style.cursor = 'pointer' on interactive hover
      this.styleEl = document.createElement('style');
      this.styleEl.textContent = 'canvas { cursor: none !important; }';
      document.head.appendChild(this.styleEl);
    }
  }

  private getObjectScreenBounds(
    obj: Phaser.GameObjects.GameObject,
    scene: Phaser.Scene,
  ): { cx: number; cy: number; w: number; h: number; cr: number } | null {
    const go = obj as Phaser.GameObjects.GameObject & {
      x: number; y: number;
      width?: number; height?: number;
      displayWidth?: number; displayHeight?: number;
      originX?: number; originY?: number;
      scrollFactorX?: number; scrollFactorY?: number;
    };
    if (go.x == null || go.y == null) return null;

    const w = go.displayWidth ?? go.width ?? 0;
    const h = go.displayHeight ?? go.height ?? 0;
    if (w === 0 || h === 0) return null;

    const ox = go.originX ?? 0;
    const oy = go.originY ?? 0;
    const sf = go.scrollFactorX ?? 1;
    const cam = scene.cameras.main;

    const centerX = go.x + w * (0.5 - ox) - cam.scrollX * sf;
    const centerY = go.y + h * (0.5 - oy) - cam.scrollY * sf;

    const objRadius = (obj.getData?.('cornerRadius') as number | undefined) ?? MORPH_DEFAULT_RADIUS;

    return {
      cx: centerX,
      cy: centerY,
      w: w + MORPH_PADDING * 2,
      h: h + MORPH_PADDING * 2,
      cr: objRadius + MORPH_PADDING,
    };
  }

  /**
   * Call every frame. Pass player world coordinates in GameScene;
   * omit them in MenuScene to keep the default up-pointing heading.
   */
  update(scene: Phaser.Scene, playerX?: number, playerY?: number): void {
    if (!this.active) return;

    const pointer = scene.input.activePointer;

    if (playerX !== undefined && playerY !== undefined) {
      const dx = pointer.worldX - playerX;
      const dy = pointer.worldY - playerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 8) {
        this.heading = Math.atan2(dy, dx);
      }
    } else {
      // No player context (menu, pause, results) — ease back to pointing up
      const DEFAULT_HEADING = -Math.PI / 2;
      const diff = DEFAULT_HEADING - this.heading;
      // Normalize to [-PI, PI] so it takes the short way around
      const wrapped = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.heading += wrapped * 0.12;
    }

    // Check if pointer is over any interactive object (only useHandCursor elements)
    const hits = scene.input.hitTestPointer(pointer)
      .filter(obj => obj.input?.cursor === 'pointer');
    this.hovering = hits.length > 0;

    // Update morph target from topmost hit object
    if (this.hovering && hits.length > 0) {
      const bounds = this.getObjectScreenBounds(hits[0], scene);
      if (bounds) {
        this.morphTarget = bounds;
      }
    }

    this.pointerScreenX = pointer.x;
    this.pointerScreenY = pointer.y;

    // Lerp morph progress toward target
    const morphGoal = this.hovering && this.morphTarget ? 1 : 0;
    this.morphProgress += (morphGoal - this.morphProgress) * MORPH_LERP;
    if (Math.abs(this.morphProgress - morphGoal) < MORPH_SNAP_THRESHOLD) {
      this.morphProgress = morphGoal;
    }
    if (this.morphProgress === 0) {
      this.morphTarget = null;
    }

    // Position: lerp between pointer and morph target center
    const mp = this.morphProgress;
    if (mp > 0 && this.morphTarget) {
      const lx = pointer.x + (this.morphTarget.cx - pointer.x) * mp;
      const ly = pointer.y + (this.morphTarget.cy - pointer.y) * mp;
      this.graphic.setPosition(lx, ly);
    } else {
      this.graphic.setPosition(pointer.x, pointer.y);
    }

    this.draw();
  }

  private draw(): void {
    const g = this.graphic;
    g.clear();

    const mp = this.morphProgress;
    const color = lerpColor(COLOR_IDLE, COLORS.PLAYER, mp);
    const alpha = CURSOR_ALPHA + 0.3 * mp;

    // --- Reticle (fades out as morph progresses) ---
    if (mp < 1) {
      const reticleAlpha = alpha * (1 - mp);

      g.lineStyle(1, color, reticleAlpha);

      // Broken circle: 4 arcs with gaps at each tick position
      for (let i = 0; i < 4; i++) {
        const startAngle = i * (Math.PI / 2) + ARC_GAP;
        const endAngle = (i + 1) * (Math.PI / 2) - ARC_GAP;
        g.beginPath();
        g.arc(0, 0, CIRCLE_RADIUS, startAngle, endAngle, false);
        g.strokePath();
      }

      // Tick marks — always shown, cross through the circle boundary
      for (let i = 0; i < 4; i++) {
        const angle = (Math.PI / 2) * i;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        g.beginPath();
        g.moveTo(cos * (CIRCLE_RADIUS - TICK_INNER), sin * (CIRCLE_RADIUS - TICK_INNER));
        g.lineTo(cos * (CIRCLE_RADIUS + TICK_OUTER), sin * (CIRCLE_RADIUS + TICK_OUTER));
        g.strokePath();
      }

      // Triangle pointing in direction of travel
      const h = this.heading;
      const r = TRI_RADIUS;
      const x1 = Math.cos(h) * r;
      const y1 = Math.sin(h) * r;
      const x2 = Math.cos(h + (Math.PI * 2) / 3) * r;
      const y2 = Math.sin(h + (Math.PI * 2) / 3) * r;
      const x3 = Math.cos(h - (Math.PI * 2) / 3) * r;
      const y3 = Math.sin(h - (Math.PI * 2) / 3) * r;

      g.lineStyle(1.5, color, reticleAlpha * 0.9);
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.lineTo(x3, y3);
      g.closePath();
      g.strokePath();
    }

    // --- Morph rounded rect (fades in as morph progresses) ---
    if (mp > 0 && this.morphTarget) {
      const morphAlpha = alpha * mp;
      const t = this.morphTarget;

      // Interpolate from reticle-sized circle to target rect
      const startW = CIRCLE_RADIUS * 2;
      const startH = CIRCLE_RADIUS * 2;
      const w = startW + (t.w - startW) * mp;
      const h = startH + (t.h - startH) * mp;
      const cr = CIRCLE_RADIUS + (t.cr - CIRCLE_RADIUS) * mp;

      g.lineStyle(1, color, morphAlpha);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, cr);

      // Pointer tracking dot — shows actual mouse position inside the morphed rect
      const dotX = this.pointerScreenX - this.graphic.x;
      const dotY = this.pointerScreenY - this.graphic.y;
      g.fillStyle(COLORS.PLAYER, mp * 0.85);
      g.fillCircle(dotX, dotY, MORPH_DOT_RADIUS);
    }
  }

  destroy(_scene: Phaser.Scene): void {
    this.styleEl?.remove();
    this.graphic.destroy();
  }
}
