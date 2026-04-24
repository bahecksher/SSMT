import Phaser from 'phaser';
import { getSettings } from './SettingsSystem';

const SFX_NAMES = ['playerDeath', 'asteroidCollision', 'shieldLoss', 'pickup', 'bomb', 'enemyEntrance', 'beamCharge', 'beamFire'] as const;

export type SfxName = typeof SFX_NAMES[number];

const SFX_KEYS: Record<SfxName, string> = {
  playerDeath: 'sfx-player-death',
  asteroidCollision: 'sfx-asteroid-collision',
  shieldLoss: 'sfx-shield-loss',
  pickup: 'sfx-pickup',
  bomb: 'sfx-bomb',
  enemyEntrance: 'sfx-enemy-entrance',
  beamCharge: 'sfx-beam-charge',
  beamFire: 'sfx-beam-fire',
};

const BASE_URL = import.meta.env.BASE_URL;

const SFX_PATHS: Record<SfxName, string> = {
  playerDeath: `${BASE_URL}audio/player-death.mp3`,
  asteroidCollision: `${BASE_URL}audio/asteroid-collision.mp3`,
  shieldLoss: `${BASE_URL}audio/shield-loss.mp3`,
  pickup: `${BASE_URL}audio/pickup.mp3`,
  bomb: `${BASE_URL}audio/bomb.mp3`,
  enemyEntrance: `${BASE_URL}audio/enemy-first-appearance.mp3`,
  // Placeholder: pitched bomb sample approximates the charging whine until a
  // dedicated beam-charge asset lands.
  beamCharge: `${BASE_URL}audio/bomb.mp3`,
  // Placeholder: bomb pitched up gives a passable laser-zap; swap to a dedicated
  // beam asset (e.g. audio/beam-fire.mp3) once one is sourced.
  beamFire: `${BASE_URL}audio/bomb.mp3`,
};

const SFX_BASE_VOLUME: Record<SfxName, number> = {
  playerDeath: 0.92,
  asteroidCollision: 0.84,
  shieldLoss: 0.84,
  pickup: 0.92,
  bomb: 0.92,
  enemyEntrance: 0.88,
  beamCharge: 0.42,
  beamFire: 0.72,
};

interface PlaySfxOptions {
  volumeScale?: number;
  rate?: number;
  detune?: number;
}

export function preloadSfx(scene: Phaser.Scene): void {
  for (const name of SFX_NAMES) {
    scene.load.audio(SFX_KEYS[name], SFX_PATHS[name]);
  }
}

export function playSfx(scene: Phaser.Scene, name: SfxName, options: PlaySfxOptions = {}): boolean {
  const fxVolume = getSettings().fxVolume;
  if (fxVolume <= 0) {
    return false;
  }

  const volumeScale = options.volumeScale ?? 1;
  const volume = Phaser.Math.Clamp(SFX_BASE_VOLUME[name] * fxVolume * volumeScale, 0, 1);
  if (volume <= 0) {
    return false;
  }

  scene.sound.play(SFX_KEYS[name], {
    volume,
    rate: options.rate ?? 1,
    detune: options.detune ?? 0,
  });
  return true;
}

export function playUiSelectSfx(scene: Phaser.Scene, volumeScale = 0.7): boolean {
  return playSfx(scene, 'pickup', { volumeScale });
}
