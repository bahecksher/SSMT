import type Phaser from 'phaser';

/**
 * Maximum drag distance (px) that maps to full speed.
 * Dragging further than this still gives max speed but doesn't accelerate more.
 */
const SWIPE_MAX_DISTANCE = 150;

export interface SwipeInput {
  /** Normalised direction + magnitude (0-1) on each axis. */
  dx: number;
  dy: number;
  /** 0-1 representing how far along SWIPE_MAX_DISTANCE the finger is. */
  magnitude: number;
}

export class InputSystem {
  private scene: Phaser.Scene;

  /** Where the current touch/click started (anchor point). */
  private anchorX: number | null = null;
  private anchorY: number | null = null;

  /** Current drag delta as a normalised vector + magnitude. */
  private swipe: SwipeInput | null = null;

  /** Whether we're using touch (vs mouse). Desktop still gets pointer-follow. */
  private isTouchDevice: boolean;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.isTouchDevice = scene.sys.game.device.input.touch;
  }

  update(): void {
    const pointer = this.scene.input.activePointer;

    if (!pointer.isDown) {
      this.anchorX = null;
      this.anchorY = null;
      this.swipe = null;
      return;
    }

    // On desktop, keep the old pointer-follow behaviour
    if (!this.isTouchDevice) {
      this.swipe = null;
      this.anchorX = pointer.worldX;
      this.anchorY = pointer.worldY;
      return;
    }

    // Touch: record anchor on first frame of the touch
    if (this.anchorX === null || this.anchorY === null) {
      this.anchorX = pointer.worldX;
      this.anchorY = pointer.worldY;
    }

    const rawDx = pointer.worldX - this.anchorX;
    const rawDy = pointer.worldY - this.anchorY;
    const dist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);

    // Re-center anchor toward finger when drag is small
    // Keeps the joystick centered under the thumb for quick corrections
    if (dist < SWIPE_MAX_DISTANCE * 0.3) {
      const recenter = 0.03;
      this.anchorX += rawDx * recenter;
      this.anchorY += rawDy * recenter;
    }

    const magnitude = Math.min(dist / SWIPE_MAX_DISTANCE, 1);
    this.swipe = {
      dx: rawDx / dist,
      dy: rawDy / dist,
      magnitude,
    };
  }

  /** For touch: returns the normalised swipe vector, or null when not touching. */
  getSwipe(): SwipeInput | null {
    return this.swipe;
  }

  /**
   * For desktop: returns the raw pointer world position (pointer-follow).
   * Returns null when on touch or when not pressing.
   */
  getTarget(): { x: number; y: number } | null {
    if (this.isTouchDevice) return null;
    if (this.anchorX === null || this.anchorY === null) return null;
    return { x: this.anchorX, y: this.anchorY };
  }

  clear(): void {
    this.anchorX = null;
    this.anchorY = null;
    this.swipe = null;
  }

  destroy(): void {
    this.clear();
  }
}
