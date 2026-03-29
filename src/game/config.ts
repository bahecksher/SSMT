import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { MissionSelectScene } from './scenes/MissionSelectScene';
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
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: true,
  },
  scene: [BootScene, MenuScene, MissionSelectScene, GameScene, GameOverScene],
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
  },
  input: {
    touch: true,
  },
};
