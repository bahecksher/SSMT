export const SCENE_KEYS = {
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  MISSION_SELECT: 'MissionSelectScene',
  GAME: 'GameScene',
  HOW_TO_PLAY: 'HowToPlayScene',
  TUTORIAL_ARENA: 'TutorialArenaScene',
  VERSUS_LOBBY: 'VersusLobbyScene',
} as const;

export const TITLE_FONT = '"pixel_lcd", Consolas, "Lucida Console", Menlo, Monaco, monospace';
export const UI_FONT = '"FreePixel", Consolas, "Lucida Console", Menlo, Monaco, monospace';

export function readableFontSize(size: number | string): string {
  const numeric = typeof size === 'number' ? size : Number.parseFloat(size);
  if (!Number.isFinite(numeric)) {
    return typeof size === 'number' ? `${size}px` : size;
  }

  const scale = numeric <= 10 ? 1.32 : numeric <= 14 ? 1.24 : numeric <= 18 ? 1.18 : 1.12;
  return `${Math.ceil(numeric * scale)}px`;
}

export const SAVE_KEY = 'ssmt_save';
export const PLAYER_NAME_KEY = 'ssmt_player_name';
export const SETTINGS_KEY = 'ssmt_settings';
export const MISSIONS_KEY = 'ssmt_missions';
export const COMPANY_REP_KEY = 'ssmt_company_rep';
export const COMPANY_AFFILIATION_KEY = 'ssmt_company_affiliation';

export const PALETTE_ORDER = ['green', 'orange', 'blue', 'red', 'volt', 'pulse', 'frost'] as const;
export type PaletteId = (typeof PALETTE_ORDER)[number];

export interface PaletteColors {
  STARFIELD_BG: number;
  BG: number;
  GLOBE: number;
  ARENA_BORDER: number;
  PLAYER: number;
  PLAYER_GLOW: number;
  SALVAGE: number;
  SALVAGE_RADIUS: number;
  HAZARD: number;
  HAZARD_INERT: number;
  ASTEROID: number;
  ASTEROID_INERT: number;
  ENEMY: number;
  BEAM: number;
  GATE: number;
  HUD: number;
  GRID: number;
  NPC: number;
  SHIELD: number;
  BOMB: number;
}

export const DEFAULT_PALETTE_ID: PaletteId = 'blue';

const PALETTES: Record<PaletteId, PaletteColors> = {
  green: {
    STARFIELD_BG: 0x02120d,
    BG: 0x06100d,
    GLOBE: 0xff2cff,
    ARENA_BORDER: 0x00ffb7,
    PLAYER: 0x00ffe1,
    PLAYER_GLOW: 0x00ffe1,
    SALVAGE: 0x38ff72,
    SALVAGE_RADIUS: 0x38ff72,
    HAZARD: 0xff3f77,
    HAZARD_INERT: 0xc25d80,
    ASTEROID: 0xc4ccd3,
    ASTEROID_INERT: 0x69727c,
    ENEMY: 0xff2cff,
    BEAM: 0xff165e,
    GATE: 0x94ff1f,
    HUD: 0x35fff1,
    GRID: 0x0b382d,
    NPC: 0xffd84a,
    SHIELD: 0xffffff,
    BOMB: 0xff9d00,
  },
  orange: {
    STARFIELD_BG: 0x120603,
    BG: 0x100705,
    GLOBE: 0xf132ff,
    ARENA_BORDER: 0xeb742d,
    PLAYER: 0x47f3ff,
    PLAYER_GLOW: 0x47f3ff,
    SALVAGE: 0xc7ff2e,
    SALVAGE_RADIUS: 0xc7ff2e,
    HAZARD: 0xff2f73,
    HAZARD_INERT: 0xbf607a,
    ASTEROID: 0xc4ccd3,
    ASTEROID_INERT: 0x69727c,
    ENEMY: 0xf132ff,
    BEAM: 0xff2588,
    GATE: 0xffef2d,
    HUD: 0x63e9ff,
    GRID: 0x311108,
    NPC: 0xffd63d,
    SHIELD: 0xffffff,
    BOMB: 0xff9600,
  },
  blue: {
    STARFIELD_BG: 0x020611,
    BG: 0x030816,
    GLOBE: 0xffb000,
    ARENA_BORDER: 0xffd84a,
    PLAYER: 0x49f6ff,
    PLAYER_GLOW: 0x49f6ff,
    SALVAGE: 0x39ff88,
    SALVAGE_RADIUS: 0x39ff88,
    HAZARD: 0xff8d4a,
    HAZARD_INERT: 0xc16f51,
    ASTEROID: 0xc4ccd3,
    ASTEROID_INERT: 0x69727c,
    ENEMY: 0xeb2d30,
    BEAM: 0xff6366,
    GATE: 0x7fbaff,
    HUD: 0xffd84a,
    GRID: 0x13295f,
    NPC: 0xeb2d30,
    SHIELD: 0xffffff,
    BOMB: 0xff9714,
  },
  red: {
    STARFIELD_BG: 0x140304,
    BG: 0x120405,
    GLOBE: 0xdd67ff,
    ARENA_BORDER: 0xeb2d30,
    PLAYER: 0x63f6ff,
    PLAYER_GLOW: 0x63f6ff,
    SALVAGE: 0x7dff38,
    SALVAGE_RADIUS: 0x7dff38,
    HAZARD: 0x80bbff,
    HAZARD_INERT: 0x6489bf,
    ASTEROID: 0xc4ccd3,
    ASTEROID_INERT: 0x69727c,
    ENEMY: 0xdd67ff,
    BEAM: 0x58a7ff,
    GATE: 0xffef2d,
    HUD: 0x86efff,
    GRID: 0x390b12,
    NPC: 0xffc83c,
    SHIELD: 0xffffff,
    BOMB: 0xff9910,
  },
  volt: {
    STARFIELD_BG: 0x031008,
    BG: 0x04140d,
    GLOBE: 0xff4dbf,
    ARENA_BORDER: 0x88ff2f,
    PLAYER: 0x47fbff,
    PLAYER_GLOW: 0x47fbff,
    SALVAGE: 0xd6ff39,
    SALVAGE_RADIUS: 0xd6ff39,
    HAZARD: 0xff714a,
    HAZARD_INERT: 0xc67a5f,
    ASTEROID: 0xc4ccd3,
    ASTEROID_INERT: 0x69727c,
    ENEMY: 0xff38cf,
    BEAM: 0xff76eb,
    GATE: 0xf2ff54,
    HUD: 0x53ffd2,
    GRID: 0x14392a,
    NPC: 0xff38cf,
    SHIELD: 0xffffff,
    BOMB: 0xffaa1f,
  },
  pulse: {
    STARFIELD_BG: 0x120313,
    BG: 0x15041a,
    GLOBE: 0x5ef9ff,
    ARENA_BORDER: 0xff53ce,
    PLAYER: 0x62fbff,
    PLAYER_GLOW: 0x62fbff,
    SALVAGE: 0xc8ff32,
    SALVAGE_RADIUS: 0xc8ff32,
    HAZARD: 0xff8c47,
    HAZARD_INERT: 0xc47d61,
    ASTEROID: 0xc4ccd3,
    ASTEROID_INERT: 0x69727c,
    ENEMY: 0xff53ce,
    BEAM: 0xff8fe4,
    GATE: 0x74bcff,
    HUD: 0xff7ee3,
    GRID: 0x381342,
    NPC: 0xff53ce,
    SHIELD: 0xffffff,
    BOMB: 0xffa11e,
  },
  frost: {
    STARFIELD_BG: 0x021019,
    BG: 0x03141d,
    GLOBE: 0xff8265,
    ARENA_BORDER: 0x82f6ff,
    PLAYER: 0x70ffff,
    PLAYER_GLOW: 0x70ffff,
    SALVAGE: 0xb8ff72,
    SALVAGE_RADIUS: 0xb8ff72,
    HAZARD: 0xff9468,
    HAZARD_INERT: 0xc48970,
    ASTEROID: 0xc4ccd3,
    ASTEROID_INERT: 0x69727c,
    ENEMY: 0xff638f,
    BEAM: 0xff9ab6,
    GATE: 0xfff56a,
    HUD: 0xbaf7ff,
    GRID: 0x163b48,
    NPC: 0xff638f,
    SHIELD: 0xffffff,
    BOMB: 0xffbf45,
  },
};

export const PALETTE_LABELS: Record<PaletteId, string> = {
  green: 'GREEN',
  orange: 'ORANGE',
  blue: 'BLUE',
  red: 'RED',
  volt: 'VOLT',
  pulse: 'PULSE',
  frost: 'FROST',
};

export const COLORS: PaletteColors = {
  ...PALETTES[DEFAULT_PALETTE_ID],
};

export function isPaletteId(value: unknown): value is PaletteId {
  return typeof value === 'string' && PALETTE_ORDER.includes(value as PaletteId);
}

export function getNextPaletteId(current: PaletteId): PaletteId {
  const currentIndex = PALETTE_ORDER.indexOf(current);
  return PALETTE_ORDER[(currentIndex + 1) % PALETTE_ORDER.length];
}

export function applyColorPalette(paletteId: PaletteId): PaletteColors {
  Object.assign(COLORS, PALETTES[paletteId]);
  return COLORS;
}

export function getPaletteColors(paletteId: PaletteId): PaletteColors {
  return PALETTES[paletteId];
}
