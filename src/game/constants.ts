export const SCENE_KEYS = {
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  MISSION_SELECT: 'MissionSelectScene',
  GAME: 'GameScene',
} as const;

export const UI_FONT = 'Consolas, "Lucida Console", Menlo, Monaco, monospace';

export function readableFontSize(size: number | string): string {
  const numeric = typeof size === 'number' ? size : Number.parseFloat(size);
  if (!Number.isFinite(numeric)) {
    return typeof size === 'number' ? `${size}px` : size;
  }

  const scale = numeric <= 10 ? 1.22 : numeric <= 14 ? 1.18 : numeric <= 18 ? 1.14 : 1.1;
  return `${Math.ceil(numeric * scale)}px`;
}

export const SAVE_KEY = 'ssmt_save';
export const PLAYER_NAME_KEY = 'ssmt_player_name';
export const SETTINGS_KEY = 'ssmt_settings';
export const MISSIONS_KEY = 'ssmt_missions';
export const COMPANY_REP_KEY = 'ssmt_company_rep';

export const COLORS = {
  BG: 0x020a08,
  PLAYER: 0x00ffcc,
  PLAYER_GLOW: 0x00ffcc,
  SALVAGE: 0x00ff88,
  SALVAGE_RADIUS: 0x00ff88,
  HAZARD: 0xff3366,
  HAZARD_INERT: 0xaa5566,
  ENEMY: 0xff00ff,
  BEAM: 0xff0044,
  GATE: 0x44ff88,
  HUD: 0x00ffcc,
  GRID: 0x003322,
} as const;
