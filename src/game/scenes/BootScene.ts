import Phaser from 'phaser';
import { SCENE_KEYS } from '../constants';
import { setLayoutSize } from '../layout';
import { preloadMusic } from '../systems/MusicSystem';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.BOOT);
  }

  preload(): void {
    preloadMusic(this);
  }

  create(): void {
    setLayoutSize(this.scale.width, this.scale.height);
    this.scene.start(SCENE_KEYS.MENU);
  }
}
