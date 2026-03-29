import Phaser from 'phaser';
import { getSettings } from './SettingsSystem';

type MusicLayer = 'synth' | 'drums' | 'bass';
type MusicMix = Record<MusicLayer, number>;
type ManagedSound =
  | Phaser.Sound.HTML5AudioSound
  | Phaser.Sound.WebAudioSound
  | Phaser.Sound.NoAudioSound;

const MUSIC_KEYS: Record<MusicLayer, string> = {
  synth: 'music-phase-lock-synth',
  drums: 'music-phase-lock-drums',
  bass: 'music-phase-lock-bass',
};

const BASE_URL = import.meta.env.BASE_URL;

const MUSIC_PATHS: Record<MusicLayer, string> = {
  synth: `${BASE_URL}audio/phase-lock-synth.mp3`,
  drums: `${BASE_URL}audio/phase-lock-drums.mp3`,
  bass: `${BASE_URL}audio/phase-lock-bass.mp3`,
};

const MUSIC_LAYERS: MusicLayer[] = ['synth', 'drums', 'bass'];
const MUSIC_START_DELAY_S = 0.05;
const MUSIC_FADE_MS = 700;
const SILENT_MIX: MusicMix = { synth: 0, drums: 0, bass: 0 };
const MENU_MIX: MusicMix = { synth: 1, drums: 0, bass: 0 };
const MISSION_MIX: MusicMix = { synth: 0, drums: 1, bass: 0 };
const GAMEPLAY_MID_MIX: MusicMix = { synth: 0, drums: 1, bass: 1 };
const GAMEPLAY_FULL_MIX: MusicMix = { synth: 1, drums: 1, bass: 1 };

let activeGame: Phaser.Game | null = null;
let started = false;
let pendingUnlockScene: Phaser.Scene | null = null;
let targetMix: MusicMix = { ...SILENT_MIX };
let layerSounds: Partial<Record<MusicLayer, ManagedSound>> = {};

function resetState(scene: Phaser.Scene): void {
  activeGame = scene.game;
  started = false;
  pendingUnlockScene = null;
  targetMix = { ...SILENT_MIX };
  layerSounds = {};
}

function ensureSession(scene: Phaser.Scene): void {
  if (activeGame !== scene.game) {
    resetState(scene);
  }
}

function ensureSounds(scene: Phaser.Scene): void {
  ensureSession(scene);

  for (const layer of MUSIC_LAYERS) {
    if (!layerSounds[layer]) {
      const existingSound = scene.sound.get(MUSIC_KEYS[layer]);
      layerSounds[layer] = (existingSound ?? scene.sound.add(MUSIC_KEYS[layer], {
        loop: true,
        volume: 0,
      })) as ManagedSound;
    }
  }
}

function getEffectiveMix(): MusicMix {
  const settings = getSettings();
  if (!settings.musicEnabled) {
    return SILENT_MIX;
  }

  return {
    synth: targetMix.synth * settings.musicVolume,
    drums: targetMix.drums * settings.musicVolume,
    bass: targetMix.bass * settings.musicVolume,
  };
}

function applyMix(scene: Phaser.Scene, fadeMs = MUSIC_FADE_MS): void {
  if (!started) {
    return;
  }

  const effectiveMix = getEffectiveMix();

  for (const layer of MUSIC_LAYERS) {
    const sound = layerSounds[layer];
    if (!sound) continue;

    scene.tweens.killTweensOf(sound);

    const nextVolume = effectiveMix[layer];
    if (fadeMs <= 0) {
      sound.volume = nextVolume;
      continue;
    }

    scene.tweens.add({
      targets: sound,
      volume: nextVolume,
      duration: fadeMs,
      ease: 'Sine.easeInOut',
    });
  }
}

function queueUnlock(scene: Phaser.Scene): void {
  if (pendingUnlockScene === scene || !getSettings().musicEnabled) {
    return;
  }

  pendingUnlockScene = scene;
  const unlockMusic = (): void => {
    if (pendingUnlockScene === scene) {
      pendingUnlockScene = null;
    }
    startMusic(scene);
    applyMix(scene, 0);
  };

  scene.input.once('pointerdown', unlockMusic);
  scene.input.once('pointerup', unlockMusic);
  scene.input.keyboard?.once('keydown', unlockMusic);
  scene.events.once('shutdown', () => {
    if (pendingUnlockScene === scene) {
      pendingUnlockScene = null;
    }
  });
}

export function preloadMusic(scene: Phaser.Scene): void {
  for (const layer of MUSIC_LAYERS) {
    scene.load.audio(MUSIC_KEYS[layer], MUSIC_PATHS[layer]);
  }
}

export function startMusic(scene: Phaser.Scene): void {
  if (!getSettings().musicEnabled) {
    return;
  }

  ensureSounds(scene);

  if (started) {
    return;
  }

  if (scene.sound.locked) {
    queueUnlock(scene);
    return;
  }

  for (const layer of MUSIC_LAYERS) {
    const sound = layerSounds[layer];
    if (!sound) continue;

    sound.volume = 0;
    if (!sound.isPlaying) {
      sound.play({
        delay: MUSIC_START_DELAY_S,
        loop: true,
        volume: 0,
      });
    }
  }

  started = true;
}

function setTargetMix(scene: Phaser.Scene, nextMix: MusicMix, fadeMs = MUSIC_FADE_MS): void {
  targetMix = { ...nextMix };
  startMusic(scene);
  applyMix(scene, fadeMs);
}

export function setMenuMusic(scene: Phaser.Scene): void {
  setTargetMix(scene, MENU_MIX);
}

export function setMissionMusic(scene: Phaser.Scene): void {
  setTargetMix(scene, MISSION_MIX);
}

export function setGameplayMusicForPhase(scene: Phaser.Scene, phase: number): void {
  if (phase >= 6) {
    setTargetMix(scene, GAMEPLAY_FULL_MIX, 900);
    return;
  }

  if (phase >= 4) {
    setTargetMix(scene, GAMEPLAY_MID_MIX, 900);
    return;
  }

  setTargetMix(scene, MISSION_MIX);
}

export function refreshMusicForSettings(scene: Phaser.Scene): void {
  if (getSettings().musicEnabled) {
    startMusic(scene);
  }
  applyMix(scene, 250);
}
