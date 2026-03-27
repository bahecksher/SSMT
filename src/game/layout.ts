export interface LayoutMetrics {
  gameWidth: number;
  gameHeight: number;
  centerX: number;
  centerY: number;
  arenaInset: number;
  arenaLeft: number;
  arenaTop: number;
  arenaRight: number;
  arenaBottom: number;
  arenaWidth: number;
  arenaHeight: number;
}

export const DEFAULT_GAME_WIDTH = 540;
export const DEFAULT_GAME_HEIGHT = 960;

const MIN_GAME_WIDTH = 320;
const MIN_GAME_HEIGHT = 480;
const MIN_ARENA_INSET = 40;
const MAX_ARENA_INSET = 72;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function createLayout(width: number, height: number): LayoutMetrics {
  const gameWidth = Math.max(MIN_GAME_WIDTH, Math.round(width));
  const gameHeight = Math.max(MIN_GAME_HEIGHT, Math.round(height));
  const arenaInset = clamp(Math.round(Math.min(gameWidth, gameHeight) * 0.11), MIN_ARENA_INSET, MAX_ARENA_INSET);
  const arenaLeft = arenaInset;
  const arenaTop = arenaInset;
  const arenaRight = gameWidth - arenaInset;
  const arenaBottom = gameHeight - arenaInset;

  return {
    gameWidth,
    gameHeight,
    centerX: gameWidth / 2,
    centerY: gameHeight / 2,
    arenaInset,
    arenaLeft,
    arenaTop,
    arenaRight,
    arenaBottom,
    arenaWidth: arenaRight - arenaLeft,
    arenaHeight: arenaBottom - arenaTop,
  };
}

let layout = createLayout(DEFAULT_GAME_WIDTH, DEFAULT_GAME_HEIGHT);

export function getInitialViewportSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: DEFAULT_GAME_WIDTH, height: DEFAULT_GAME_HEIGHT };
  }

  return {
    width: Math.max(window.innerWidth, MIN_GAME_WIDTH),
    height: Math.max(window.innerHeight, MIN_GAME_HEIGHT),
  };
}

export function setLayoutSize(width: number, height: number): LayoutMetrics {
  layout = createLayout(width, height);
  return layout;
}

export function getLayout(): LayoutMetrics {
  return layout;
}
