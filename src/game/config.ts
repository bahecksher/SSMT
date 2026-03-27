import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { getInitialViewportSize, setLayoutSize } from './layout';

const initialViewport = getInitialViewportSize();
setLayoutSize(initialViewport.width, initialViewport.height);

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: initialViewport.width,
  height: initialViewport.height,
  parent: 'game',
  backgroundColor: '#020a08',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene],
  render: {
    antialias: true,
    pixelArt: false,
  },
  input: {
    touch: true,
  },
};
