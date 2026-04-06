import Phaser from 'phaser';
import { SCENE_KEYS } from '../constants';
import { setLayoutSize } from '../layout';
import { preloadMusic } from '../systems/MusicSystem';
import { preloadSfx } from '../systems/SfxSystem';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.BOOT);
  }

  preload(): void {
    preloadMusic(this);
    preloadSfx(this);
  }

  create(): void {
    const startMenu = () => {
      setLayoutSize(this.scale.width, this.scale.height);
      this.scene.start(SCENE_KEYS.MENU);
    };

    if (typeof document === 'undefined' || !('fonts' in document)) {
      startMenu();
      return;
    }

    void Promise.allSettled([
      document.fonts.load('16px "FreePixel"'),
      document.fonts.load('16px "pixel_lcd"'),
    ]).finally(() => startMenu());
  }
}
