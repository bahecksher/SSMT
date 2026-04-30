import { getLayout, isNarrowViewport, isShortViewport, type LayoutMetrics } from '../layout';

export interface TopNavMetrics {
  leftCenterX: number;
  rightCenterX: number;
  centerY: number;
  width: number;
  height: number;
  fontSizePx: number;
  marginX: number;
}

export interface PrimaryActionMetrics {
  centerY: number;
  fontSizePx: number;
}

/**
 * Shared corner-button metrics so Menu / MissionSelect / VersusLobby / HowToPlay
 * place their BACK / MENU / SETTINGS / GUIDE chrome on the same baseline. Driven
 * by the existing narrow/short breakpoints — at iPhone 13 mini portrait the
 * narrow path triggers and every scene lands on the same row.
 */
export function getTopNavMetrics(metrics: LayoutMetrics = getLayout()): TopNavMetrics {
  const narrow = isNarrowViewport(metrics);
  const short = isShortViewport(metrics);
  const compact = narrow || short || metrics.gameWidth <= 420;
  const veryCompact = (narrow && short) || metrics.gameWidth <= 360 || metrics.gameHeight <= 560;

  const width = veryCompact ? 88 : compact ? 96 : 108;
  const height = veryCompact ? 28 : compact ? 30 : 32;
  const fontSizePx = veryCompact ? 10 : 11;
  const marginX = Math.max(20, Math.round(metrics.gameWidth * (compact ? 0.05 : 0.045)));
  const centerY = (veryCompact ? 18 : compact ? 22 : 26) + height / 2;

  return {
    leftCenterX: marginX + width / 2,
    rightCenterX: metrics.gameWidth - marginX - width / 2,
    centerY,
    width,
    height,
    fontSizePx,
    marginX,
  };
}

/**
 * Shared bottom CTA y so the menu's TAP TO START and mission select's DEPLOY
 * share one baseline across viewports.
 */
export function getPrimaryActionMetrics(metrics: LayoutMetrics = getLayout()): PrimaryActionMetrics {
  const narrow = isNarrowViewport(metrics);
  const short = isShortViewport(metrics);
  const compact = narrow || short;
  const veryCompact = (narrow && short) || metrics.gameHeight <= 560;
  const bottomGap = veryCompact ? 30 : compact ? 38 : 50;
  return {
    centerY: metrics.gameHeight - bottomGap,
    fontSizePx: veryCompact ? 22 : compact ? 26 : 30,
  };
}
