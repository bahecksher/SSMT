import Phaser from 'phaser';
import { getSettings } from './SettingsSystem';

const LAYERED_TRACKS = [
  'menuSynth',
  'bassOne',
  'drumsTwo',
  'drumsThree',
  'bassThree',
  'gameSynth',
] as const;
const FULL_TRACKS = ['fullPhase1', 'fullPhase2'] as const;
const BOOT_TRACKS = ['menuSynth', 'bassOne', 'drumsTwo'] as const;
const MID_GAME_TRACKS = ['drumsThree', 'bassThree', 'gameSynth'] as const;
const LATE_GAME_TRACKS = [...FULL_TRACKS] as const;

type LayeredTrack = typeof LAYERED_TRACKS[number];
type FullTrack = typeof FULL_TRACKS[number];
type MusicTrack = LayeredTrack | FullTrack;
type LayeredMix = Record<LayeredTrack, number>;
type ManagedSound =
  | Phaser.Sound.HTML5AudioSound
  | Phaser.Sound.WebAudioSound
  | Phaser.Sound.NoAudioSound;

const MUSIC_KEYS: Record<MusicTrack, string> = {
  menuSynth: 'music-menu-synth',
  bassOne: 'music-bass-1',
  drumsTwo: 'music-drums-2',
  drumsThree: 'music-drums-3',
  bassThree: 'music-bass-3',
  gameSynth: 'music-synth-3',
  fullPhase1: 'music-full-phase-1',
  fullPhase2: 'music-full-phase-2',
};

const BASE_URL = import.meta.env.BASE_URL;

const MUSIC_PATHS: Record<MusicTrack, string[]> = {
  menuSynth: [`${BASE_URL}audio/menu-synth.ogg`, `${BASE_URL}audio/menu-synth.mp3`],
  bassOne: [`${BASE_URL}audio/bass-1.ogg`, `${BASE_URL}audio/bass-1.mp3`],
  drumsTwo: [`${BASE_URL}audio/drums-2.ogg`, `${BASE_URL}audio/drums-2.mp3`],
  drumsThree: [`${BASE_URL}audio/drums-3.ogg`, `${BASE_URL}audio/drums-3.mp3`],
  bassThree: [`${BASE_URL}audio/bass-3.ogg`, `${BASE_URL}audio/bass-3.mp3`],
  gameSynth: [`${BASE_URL}audio/synth-3.ogg`, `${BASE_URL}audio/synth-3.mp3`],
  fullPhase1: [`${BASE_URL}audio/full-phase-1.ogg`, `${BASE_URL}audio/full-phase-1.mp3`],
  fullPhase2: [`${BASE_URL}audio/full-phase-2.ogg`, `${BASE_URL}audio/full-phase-2.mp3`],
};

const MUSIC_START_DELAY_S = 0.05;
const MUSIC_FADE_MS = 700;
const GAMEPLAY_FADE_MS = 900;
const FULL_TRACK_FADE_MS = 1000;
const FULL_TRACK_START_PHASE = 5;

const SILENT_LAYERED_MIX: LayeredMix = {
  menuSynth: 0,
  bassOne: 0,
  drumsTwo: 0,
  drumsThree: 0,
  bassThree: 0,
  gameSynth: 0,
};
const MENU_LAYERED_MIX: LayeredMix = {
  menuSynth: 1,
  bassOne: 0,
  drumsTwo: 0,
  drumsThree: 0,
  bassThree: 0,
  gameSynth: 0,
};
const MISSION_LAYERED_MIX: LayeredMix = {
  menuSynth: 0,
  bassOne: 1,
  drumsTwo: 0,
  drumsThree: 0,
  bassThree: 0,
  gameSynth: 0,
};
const GAMEPLAY_PHASE_ONE_MIX: LayeredMix = {
  menuSynth: 0,
  bassOne: 1,
  drumsTwo: 0,
  drumsThree: 0,
  bassThree: 0,
  gameSynth: 0,
};
const GAMEPLAY_PHASE_TWO_MIX: LayeredMix = {
  menuSynth: 0,
  bassOne: 1,
  drumsTwo: 1,
  drumsThree: 0,
  bassThree: 0,
  gameSynth: 0,
};
const GAMEPLAY_PHASE_THREE_MIX: LayeredMix = {
  menuSynth: 0,
  bassOne: 1,
  drumsTwo: 1,
  drumsThree: 0,
  bassThree: 0,
  gameSynth: 1,
};
const GAMEPLAY_PHASE_FOUR_MIX: LayeredMix = {
  menuSynth: 0,
  bassOne: 0,
  drumsTwo: 0,
  drumsThree: 1,
  bassThree: 1,
  gameSynth: 1,
};

let activeGame: Phaser.Game | null = null;
let layeredStarted = false;
let pendingUnlockScene: Phaser.Scene | null = null;
let unlockListenerGame: Phaser.Game | null = null;
let targetLayeredMix: LayeredMix = { ...SILENT_LAYERED_MIX };
let activeFullTrack: FullTrack | null = null;
let selectedLateGameTrack: FullTrack | null = null;
let preserveMutedFullTrack = false;
let layeredSounds: Partial<Record<LayeredTrack, ManagedSound>> = {};
let fullTrackSounds: Partial<Record<FullTrack, ManagedSound>> = {};
const pendingTrackLoads = new WeakMap<Phaser.Scene, Set<MusicTrack>>();

function resetState(scene: Phaser.Scene): void {
  activeGame = scene.game;
  layeredStarted = false;
  pendingUnlockScene = null;
  unlockListenerGame = null;
  targetLayeredMix = { ...SILENT_LAYERED_MIX };
  activeFullTrack = null;
  selectedLateGameTrack = null;
  preserveMutedFullTrack = false;
  layeredSounds = {};
  fullTrackSounds = {};
}

function ensureSession(scene: Phaser.Scene): void {
  if (activeGame !== scene.game) {
    resetState(scene);
  }
}

function isTrackLoaded(scene: Phaser.Scene, track: MusicTrack): boolean {
  return scene.cache.audio.exists(MUSIC_KEYS[track]);
}

function getPendingTrackLoads(scene: Phaser.Scene): Set<MusicTrack> {
  let pending = pendingTrackLoads.get(scene);
  if (pending) {
    return pending;
  }

  pending = new Set<MusicTrack>();
  pendingTrackLoads.set(scene, pending);
  scene.events.once('shutdown', () => {
    pendingTrackLoads.delete(scene);
  });
  return pending;
}

function queueMusicTracks(scene: Phaser.Scene, tracks: readonly MusicTrack[]): void {
  if (!getSettings().musicEnabled) {
    return;
  }

  const pending = getPendingTrackLoads(scene);
  const missingTracks = tracks.filter((track) => !isTrackLoaded(scene, track) && !pending.has(track));
  if (missingTracks.length === 0) {
    return;
  }

  for (const track of missingTracks) {
    pending.add(track);
    scene.load.audio(MUSIC_KEYS[track], MUSIC_PATHS[track]);
  }

  scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
    for (const track of missingTracks) {
      pending.delete(track);
    }

    if (!scene.sys.isActive()) {
      return;
    }

    startMusic(scene);
    applyMusicState(scene, 0);
  });

  if (!scene.load.isLoading()) {
    scene.load.start();
  }
}

function queueTracksForCurrentState(scene: Phaser.Scene): void {
  const tracks: MusicTrack[] = [];
  for (const track of LAYERED_TRACKS) {
    if (targetLayeredMix[track] > 0) {
      tracks.push(track);
    }
  }

  if (activeFullTrack) {
    tracks.push(activeFullTrack);
  }

  queueMusicTracks(scene, tracks);
}

function ensureLayeredSounds(scene: Phaser.Scene): void {
  ensureSession(scene);

  for (const track of LAYERED_TRACKS) {
    if (!layeredSounds[track] && isTrackLoaded(scene, track)) {
      const existingSound = scene.sound.get(MUSIC_KEYS[track]);
      layeredSounds[track] = (existingSound ?? scene.sound.add(MUSIC_KEYS[track], {
        loop: true,
        volume: 0,
      })) as ManagedSound;
    }
  }
}

function ensureFullTrackSound(scene: Phaser.Scene, track: FullTrack): ManagedSound | null {
  ensureSession(scene);

  if (!isTrackLoaded(scene, track)) {
    return null;
  }

  if (!fullTrackSounds[track]) {
    const existingSound = scene.sound.get(MUSIC_KEYS[track]);
    fullTrackSounds[track] = (existingSound ?? scene.sound.add(MUSIC_KEYS[track], {
      loop: true,
      volume: 0,
    })) as ManagedSound;
  }

  return fullTrackSounds[track] as ManagedSound;
}

function tweenSoundVolume(
  scene: Phaser.Scene,
  sound: ManagedSound,
  nextVolume: number,
  fadeMs: number,
  onSilent?: () => void,
): void {
  scene.tweens.killTweensOf(sound);

  if (fadeMs <= 0) {
    sound.volume = nextVolume;
    if (nextVolume <= 0) {
      onSilent?.();
    }
    return;
  }

  scene.tweens.add({
    targets: sound,
    volume: nextVolume,
    duration: fadeMs,
    ease: 'Sine.easeInOut',
    onComplete: () => {
      if (nextVolume <= 0) {
        onSilent?.();
      }
    },
  });
}

function applyLayeredMix(scene: Phaser.Scene, fadeMs = MUSIC_FADE_MS): void {
  if (!layeredStarted) {
    return;
  }

  const settings = getSettings();
  const volumeScale = settings.musicEnabled ? settings.musicVolume : 0;

  for (const track of LAYERED_TRACKS) {
    const sound = layeredSounds[track];
    if (!sound) continue;

    tweenSoundVolume(scene, sound, targetLayeredMix[track] * volumeScale, fadeMs);
  }
}

function applyFullTrackState(scene: Phaser.Scene, fadeMs = FULL_TRACK_FADE_MS): void {
  if (!layeredStarted) {
    return;
  }

  const settings = getSettings();
  const audibleVolume = settings.musicEnabled ? settings.musicVolume : 0;

  if (activeFullTrack) {
    const activeSound = ensureFullTrackSound(scene, activeFullTrack);
    if (activeSound && !activeSound.isPlaying) {
      activeSound.volume = 0;
      activeSound.play({
        loop: true,
        volume: 0,
      });
    }
  }

  for (const track of FULL_TRACKS) {
    const sound = fullTrackSounds[track];
    if (!sound) continue;

    const keepMuted = preserveMutedFullTrack && track === selectedLateGameTrack;
    const nextVolume = track === activeFullTrack ? audibleVolume : 0;

    tweenSoundVolume(
      scene,
      sound,
      nextVolume,
      fadeMs,
      nextVolume <= 0 && !keepMuted
        ? () => {
            if (track !== activeFullTrack && sound.isPlaying && sound.volume <= 0.001) {
              sound.stop();
              sound.volume = 0;
            }
          }
        : undefined,
    );
  }
}

function applyMusicState(scene: Phaser.Scene, fadeMs = MUSIC_FADE_MS): void {
  applyLayeredMix(scene, fadeMs);
  applyFullTrackState(scene, fadeMs);
}

function queueUnlock(scene: Phaser.Scene): void {
  if (!getSettings().musicEnabled) {
    return;
  }

  pendingUnlockScene = scene;
  if (unlockListenerGame === scene.game) {
    return;
  }

  unlockListenerGame = scene.game;
  scene.sound.once('unlocked', () => {
    const targetScene = pendingUnlockScene;
    pendingUnlockScene = null;
    unlockListenerGame = null;

    if (!targetScene || !getSettings().musicEnabled) {
      return;
    }

    startMusic(targetScene);
    applyMusicState(targetScene, 0);
  });
}

export function preloadMusic(scene: Phaser.Scene): void {
  if (!getSettings().musicEnabled) {
    return;
  }

  for (const track of BOOT_TRACKS) {
    scene.load.audio(MUSIC_KEYS[track], MUSIC_PATHS[track]);
  }
}

export function warmMusicCache(scene: Phaser.Scene): void {
  queueMusicTracks(scene, MID_GAME_TRACKS);
}

function startMusic(scene: Phaser.Scene): void {
  if (!getSettings().musicEnabled) {
    return;
  }

  ensureLayeredSounds(scene);

  if (layeredStarted) {
    return;
  }

  if (scene.sound.locked) {
    queueUnlock(scene);
    return;
  }

  for (const track of LAYERED_TRACKS) {
    const sound = layeredSounds[track];
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

  layeredStarted = true;
}

interface MusicStateOptions {
  layeredMix: LayeredMix;
  fullTrack?: FullTrack | null;
  fadeMs?: number;
  preserveLateGameTrack?: boolean;
  clearLateGameTrack?: boolean;
}

function setMusicState(scene: Phaser.Scene, options: MusicStateOptions): void {
  if (options.clearLateGameTrack) {
    selectedLateGameTrack = null;
  }

  targetLayeredMix = { ...options.layeredMix };
  activeFullTrack = options.fullTrack ?? null;
  preserveMutedFullTrack = options.preserveLateGameTrack ?? false;

  queueTracksForCurrentState(scene);
  startMusic(scene);
  applyMusicState(scene, options.fadeMs ?? MUSIC_FADE_MS);
}

export function setMenuMusic(scene: Phaser.Scene): void {
  setMusicState(scene, {
    layeredMix: MENU_LAYERED_MIX,
    clearLateGameTrack: true,
    fadeMs: MUSIC_FADE_MS,
  });
}

export function setPauseMusic(scene: Phaser.Scene): void {
  setMusicState(scene, {
    layeredMix: MENU_LAYERED_MIX,
    preserveLateGameTrack: true,
    fadeMs: MUSIC_FADE_MS,
  });
}

export function setResultMusic(scene: Phaser.Scene): void {
  setMusicState(scene, {
    layeredMix: MENU_LAYERED_MIX,
    clearLateGameTrack: true,
    fadeMs: MUSIC_FADE_MS,
  });
}

export function setMissionMusic(scene: Phaser.Scene): void {
  setMusicState(scene, {
    layeredMix: MISSION_LAYERED_MIX,
    clearLateGameTrack: true,
    fadeMs: MUSIC_FADE_MS,
  });
}

export function setGameplayMusicForPhase(scene: Phaser.Scene, phase: number): void {
  if (phase >= FULL_TRACK_START_PHASE - 1) {
    queueMusicTracks(scene, LATE_GAME_TRACKS);
  }

  if (phase >= FULL_TRACK_START_PHASE) {
    if (!selectedLateGameTrack) {
      selectedLateGameTrack = Phaser.Utils.Array.GetRandom([...FULL_TRACKS]);
    }

    setMusicState(scene, {
      layeredMix: SILENT_LAYERED_MIX,
      fullTrack: selectedLateGameTrack,
      preserveLateGameTrack: true,
      fadeMs: FULL_TRACK_FADE_MS,
    });
    return;
  }

  let gameplayMix = GAMEPLAY_PHASE_ONE_MIX;
  if (phase >= 4) {
    gameplayMix = GAMEPLAY_PHASE_FOUR_MIX;
  } else if (phase >= 3) {
    gameplayMix = GAMEPLAY_PHASE_THREE_MIX;
  } else if (phase >= 2) {
    gameplayMix = GAMEPLAY_PHASE_TWO_MIX;
  }

  setMusicState(scene, {
    layeredMix: gameplayMix,
    clearLateGameTrack: phase <= 1,
    fadeMs: GAMEPLAY_FADE_MS,
  });
}

export function refreshMusicForSettings(scene: Phaser.Scene): void {
  queueTracksForCurrentState(scene);
  if (getSettings().musicEnabled) {
    startMusic(scene);
  }

  applyMusicState(scene, 250);
}
