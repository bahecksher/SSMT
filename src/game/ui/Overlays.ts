import Phaser from 'phaser';
import { COLORS } from '../constants';
import { getLayout } from '../layout';

export class Overlays {
  static deathFlash(scene: Phaser.Scene, onComplete: () => void): void {
    const layout = getLayout();
    const flash = scene.add.graphics().setDepth(200);
    flash.fillStyle(COLORS.HAZARD, 0.6);
    flash.fillRect(0, 0, layout.gameWidth, layout.gameHeight);

    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        flash.destroy();
        onComplete();
      },
    });
  }

  /**
   * Death static overlay: show a red-tinted overlay for 1 second, then fade out and transition.
   * setInverted is kept for API compatibility but not used for flashing.
   */
  static deathInversionSequence(
    scene: Phaser.Scene,
    _setInverted: (inverted: boolean) => void,
    onComplete: () => void,
  ): void {
    const layout = getLayout();
    // Static red overlay — no flashing
    const overlay = scene.add.graphics().setDepth(199);
    overlay.fillStyle(COLORS.HAZARD, 0.45);
    overlay.fillRect(0, 0, layout.gameWidth, layout.gameHeight);

    // Hold for 1 second, then fade out and transition
    scene.time.delayedCall(1000, () => {
      scene.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          overlay.destroy();
          onComplete();
        },
      });
    });
  }

  /** Two quick red flashes to warn of incoming beam volley. */
  static beamWarningFlash(scene: Phaser.Scene): void {
    const layout = getLayout();
    // First flash
    const flash1 = scene.add.graphics().setDepth(200);
    flash1.fillStyle(COLORS.HAZARD, 0.25);
    flash1.fillRect(0, 0, layout.gameWidth, layout.gameHeight);

    scene.tweens.add({
      targets: flash1,
      alpha: 0,
      duration: 250,
      onComplete: () => {
        flash1.destroy();

        // Second flash after a short gap
        const flash2 = scene.add.graphics().setDepth(200);
        flash2.fillStyle(COLORS.HAZARD, 0.3);
        flash2.fillRect(0, 0, layout.gameWidth, layout.gameHeight);

        scene.tweens.add({
          targets: flash2,
          alpha: 0,
          duration: 250,
          onComplete: () => {
            flash2.destroy();
          },
        });
      },
    });
  }

  static shieldBreakFlash(scene: Phaser.Scene): void {
    const layout = getLayout();
    const flash = scene.add.graphics().setDepth(200);
    flash.fillStyle(0x44aaff, 0.4);
    flash.fillRect(0, 0, layout.gameWidth, layout.gameHeight);

    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 250,
      onComplete: () => {
        flash.destroy();
      },
    });
  }

  /**
   * Screen wipe transition — a colored rectangle sweeps down the screen.
   * Green for extraction, red for destruction.
   */
  static screenWipe(
    scene: Phaser.Scene,
    color: number,
    alpha: number,
    onComplete: () => void,
    options?: { duration?: number; hold?: number },
  ): void {
    const layout = getLayout();
    // Wipe mask: a rect that starts at height 0 and grows to fill the screen
    const wipe = scene.add.graphics().setDepth(250);

    const duration = options?.duration ?? 600;
    const hold = options?.hold ?? 400;

    // Animate via a simple counter object
    const progress = { t: 0 };
    scene.tweens.add({
      targets: progress,
      t: 1,
      duration,
      ease: 'Cubic.easeIn',
      onUpdate: () => {
        wipe.clear();
        const h = layout.gameHeight * progress.t;
        wipe.fillStyle(color, alpha);
        wipe.fillRect(0, 0, layout.gameWidth, h);
      },
      onComplete: () => {
        // Hold briefly then callback
        scene.time.delayedCall(hold, () => {
          wipe.destroy();
          onComplete();
        });
      },
    });
  }
}
