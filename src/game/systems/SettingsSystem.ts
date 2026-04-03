import { SETTINGS_KEY } from '../constants';

const SETTINGS_VERSION = 3;

export interface GameSettings {
  screenShake: boolean;
  scanlines: boolean;
  musicEnabled: boolean;
  musicVolume: number;
  fxVolume: number;
}

interface StoredSettings extends Partial<GameSettings> {
  version?: number;
}

const DEFAULT_SETTINGS: GameSettings = {
  screenShake: true,
  scanlines: true,
  musicEnabled: true,
  musicVolume: 0.7,
  fxVolume: 1.0,
};

let cachedSettings: GameSettings | null = null;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function normalize(settings: Partial<GameSettings>): GameSettings {
  return {
    screenShake: settings.screenShake ?? DEFAULT_SETTINGS.screenShake,
    scanlines: settings.scanlines ?? DEFAULT_SETTINGS.scanlines,
    musicEnabled: settings.musicEnabled ?? DEFAULT_SETTINGS.musicEnabled,
    musicVolume: typeof settings.musicVolume === 'number'
      ? clamp01(settings.musicVolume)
      : DEFAULT_SETTINGS.musicVolume,
    fxVolume: typeof settings.fxVolume === 'number'
      ? clamp01(settings.fxVolume)
      : DEFAULT_SETTINGS.fxVolume,
  };
}

function load(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredSettings;
      const settings = normalize({ ...DEFAULT_SETTINGS, ...parsed });

      // Reset music to the current default once for older saves that predate the latest music-default change.
      if ((parsed.version ?? 0) < SETTINGS_VERSION) {
        settings.musicEnabled = DEFAULT_SETTINGS.musicEnabled;
        save(settings);
      }

      return settings;
    }
  } catch {
    // Private browsing or corrupted data
  }
  return normalize(DEFAULT_SETTINGS);
}

function save(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      ...settings,
      version: SETTINGS_VERSION,
    } satisfies StoredSettings));
  } catch {
    // Private browsing
  }
}

export function getSettings(): GameSettings {
  if (!cachedSettings) {
    cachedSettings = load();
  }
  return cachedSettings;
}

export function updateSettings(partial: Partial<GameSettings>): GameSettings {
  const settings = getSettings();
  const nextSettings = normalize({ ...settings, ...partial });
  cachedSettings = nextSettings;
  save(nextSettings);
  return nextSettings;
}
