import Phaser from 'phaser';
import { SCENE_KEYS } from '../constants';
import { setLayoutSize } from '../layout';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.BOOT);
  }

  create(): void {
    setLayoutSize(this.scale.width, this.scale.height);
    this.scene.start(SCENE_KEYS.MENU);
  }
}
