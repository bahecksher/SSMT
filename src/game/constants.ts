export const SCENE_KEYS = {
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  GAME: 'GameScene',
  GAME_OVER: 'GameOverScene',
} as const;

export const SAVE_KEY = 'ssmt_save';
export const PLAYER_NAME_KEY = 'ssmt_player_name';
export const SETTINGS_KEY = 'ssmt_settings';

export const COLORS = {
  BG: 0x020a08,
  PLAYER: 0x00ffcc,
  PLAYER_GLOW: 0x00ffcc,
  SALVAGE: 0x00ff88,
  SALVAGE_RADIUS: 0x00ff88,
  HAZARD: 0xff3366,
  BEAM: 0xff0044,
  GATE: 0x44ff88,
  HUD: 0x00ffcc,
  GRID: 0x003322,
} as const;
