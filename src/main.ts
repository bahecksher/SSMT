import Phaser from 'phaser';
import { gameConfig } from './game/config';

const TEXT_RESOLUTION = (() => {
  if (typeof window === 'undefined') return 1;
  return Math.min(2, Math.max(1, Math.ceil(window.devicePixelRatio || 1)));
})();

const originalTextFactory = Phaser.GameObjects.GameObjectFactory.prototype.text;

Phaser.GameObjects.GameObjectFactory.prototype.text = function (...args: Parameters<typeof originalTextFactory>) {
  const text = originalTextFactory.apply(this, args);
  text.setResolution(TEXT_RESOLUTION);
  return text;
};

new Phaser.Game(gameConfig);
