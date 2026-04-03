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

interface LayoutOptions {
  topInsetOverride?: number;
  bottomInsetOverride?: number;
}

export const DEFAULT_GAME_WIDTH = 540;
export const DEFAULT_GAME_HEIGHT = 960;

const MIN_GAME_WIDTH = 320;
const MIN_GAME_HEIGHT = 480;
const MIN_ARENA_INSET = 40;
const MAX_ARENA_INSET = 72;
const MIN_ARENA_SIDE_INSET = 24;
const MAX_ARENA_SIDE_INSET = 40;
const COMPACT_ARENA_SIDE_BREAKPOINT = 480;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function createLayout(width: number, height: number, options: LayoutOptions = {}): LayoutMetrics {
  const gameWidth = Math.max(MIN_GAME_WIDTH, Math.round(width));
  const gameHeight = Math.max(MIN_GAME_HEIGHT, Math.round(height));
  const baseArenaInset = clamp(Math.round(Math.min(gameWidth, gameHeight) * 0.11), MIN_ARENA_INSET, MAX_ARENA_INSET);
  const arenaInset = gameWidth <= COMPACT_ARENA_SIDE_BREAKPOINT
    ? clamp(Math.round(gameWidth * 0.075), MIN_ARENA_SIDE_INSET, MAX_ARENA_SIDE_INSET)
    : baseArenaInset;
  const arenaTopInset = clamp(
    Math.round(options.topInsetOverride ?? baseArenaInset),
    MIN_ARENA_INSET,
    gameHeight - MIN_ARENA_INSET,
  );
  const arenaBottomInset = clamp(
    Math.round(options.bottomInsetOverride ?? baseArenaInset),
    MIN_ARENA_INSET,
    gameHeight - arenaTopInset - MIN_ARENA_INSET,
  );
  const arenaLeft = arenaInset;
  const arenaTop = arenaTopInset;
  const arenaRight = gameWidth - arenaInset;
  const arenaBottom = gameHeight - arenaBottomInset;

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

export function setLayoutSize(width: number, height: number, options: LayoutOptions = {}): LayoutMetrics {
  layout = createLayout(width, height, options);
  return layout;
}

export function getLayout(): LayoutMetrics {
  return layout;
}

// Reference arena area for density normalization (default 540×960 viewport)
const REFERENCE_ARENA_AREA = 355_324;

/**
 * Returns density scale: 1.0 on the reference (540×960) phone screen.
 * Smaller screens get slightly fewer threats; larger screens get more.
 */
export function getArenaDensityScale(): number {
  const area = layout.arenaWidth * layout.arenaHeight;
  const ratio = area / REFERENCE_ARENA_AREA;
  if (ratio <= 1) {
    // Small screens: slightly gentler than linear
    return Math.pow(ratio, 1.15);
  }
  // Large screens: uncapped, sub-linear so it doesn't explode
  return Math.pow(ratio, 0.6);
}
