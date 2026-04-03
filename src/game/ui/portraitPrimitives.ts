import Phaser from 'phaser';

export interface PortraitPoint {
  x: number;
  y: number;
}

interface PortraitBackdropOptions {
  radius?: number;
  bandWidth?: number;
  bandStep?: number;
}

export function fillPolygon(
  graphics: Phaser.GameObjects.Graphics,
  points: PortraitPoint[],
  color: number,
  alpha: number,
): void {
  if (points.length === 0) return;
  graphics.fillStyle(color, alpha);
  graphics.beginPath();
  graphics.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    graphics.lineTo(points[i].x, points[i].y);
  }
  graphics.closePath();
  graphics.fillPath();
}

export function strokePolygon(
  graphics: Phaser.GameObjects.Graphics,
  points: PortraitPoint[],
  color: number,
  alpha: number,
  thickness = 1.2,
): void {
  if (points.length === 0) return;
  graphics.lineStyle(thickness, color, alpha);
  graphics.beginPath();
  graphics.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    graphics.lineTo(points[i].x, points[i].y);
  }
  graphics.closePath();
  graphics.strokePath();
}

export function strokeArc(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  color: number,
  alpha: number,
  thickness = 1,
): void {
  graphics.lineStyle(thickness, color, alpha);
  graphics.beginPath();
  graphics.arc(x, y, radius, startAngle, endAngle, false);
  graphics.strokePath();
}

export function createPortraitBackdrop(
  scene: Phaser.Scene,
  color: number,
  accent: number,
  options: PortraitBackdropOptions = {},
): Phaser.GameObjects.Graphics[] {
  const radius = options.radius ?? 28;
  const bandWidth = options.bandWidth ?? 18;
  const bandStep = options.bandStep ?? 6;

  const glow = scene.add.graphics();
  glow.fillStyle(color, 0.08);
  glow.fillCircle(0, 0, radius);
  glow.fillStyle(accent, 0.05);
  glow.fillEllipse(0, 5, radius * 1.18, radius * 0.94);

  const core = scene.add.graphics();
  core.fillStyle(color, 0.05);
  core.fillCircle(0, 0, radius - 4);
  core.lineStyle(1, color, 0.16);
  core.strokeCircle(0, 0, radius - 5);

  const ring = scene.add.graphics();
  strokeArc(
    ring,
    0,
    -1,
    radius - 8,
    Phaser.Math.DegToRad(206),
    Phaser.Math.DegToRad(336),
    accent,
    0.28,
    1.1,
  );
  strokeArc(
    ring,
    0,
    2,
    radius - 10,
    Phaser.Math.DegToRad(18),
    Phaser.Math.DegToRad(138),
    color,
    0.22,
    1,
  );

  const scan = scene.add.graphics();
  for (let y = -14; y <= 14; y += bandStep) {
    const edgeFade = 1 - Math.abs(y) / 16;
    scan.lineStyle(1, accent, Phaser.Math.Clamp(0.03 + edgeFade * 0.07, 0.03, 0.1));
    scan.lineBetween(-bandWidth, y, bandWidth, y);
  }
  scan.lineStyle(1, color, 0.14);
  scan.lineBetween(-5, -radius + 7, -5, radius - 8);
  scan.lineBetween(6, -radius + 10, 6, radius - 11);

  return [glow, core, ring, scan];
}
