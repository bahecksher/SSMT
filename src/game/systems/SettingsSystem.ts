import {
  DEFAULT_PALETTE_ID,
  SETTINGS_KEY,
  isPaletteId,
  type PaletteId,
} from '../constants';

const SETTINGS_VERSION = 4;

export interface GameSettings {
  screenShake: boolean;
  scanlines: boolean;
  musicEnabled: boolean;
  musicVolume: number;
  fxVolume: number;
  paletteId: PaletteId;
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
  paletteId: DEFAULT_PALETTE_ID,
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
    paletteId: isPaletteId(settings.paletteId)
      ? settings.paletteId
      : DEFAULT_SETTINGS.paletteId,
  };
}

function load(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredSettings;
      const settings = normalize({ ...DEFAULT_SETTINGS, ...parsed });
      let shouldResave = false;

      // Reset music to the current default once for older saves that predate the latest music-default change.
      if ((parsed.version ?? 0) < 3) {
        settings.musicEnabled = DEFAULT_SETTINGS.musicEnabled;
        shouldResave = true;
      }

      if ((parsed.version ?? 0) < SETTINGS_VERSION) {
        shouldResave = true;
      }

      if (shouldResave) {
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
