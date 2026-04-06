import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { MissionSelectScene } from './scenes/MissionSelectScene';
import { GameScene } from './scenes/GameScene';
import { getInitialViewportSize, setLayoutSize } from './layout';
import { applyColorPalette } from './constants';
import { getSettings } from './systems/SettingsSystem';

const initialViewport = getInitialViewportSize();
setLayoutSize(initialViewport.width, initialViewport.height);
const initialPalette = applyColorPalette(getSettings().paletteId);

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: initialViewport.width,
  height: initialViewport.height,
  parent: 'game',
  backgroundColor: `#${initialPalette.BG.toString(16).padStart(6, '0')}`,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: true,
  },
  scene: [BootScene, MenuScene, MissionSelectScene, GameScene],
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
  },
  input: {
    touch: true,
  },
};
