import Phaser from 'phaser';
import type { CompanyDef } from '../data/companyData';
import { createPortraitBackdrop, fillPolygon, strokeArc, strokePolygon, type PortraitPoint } from './portraitPrimitives';

interface CompanyLogoOptions {
  includeBackdrop?: boolean;
}

export function createCompanyLogo(
  scene: Phaser.Scene,
  company: CompanyDef,
  options: CompanyLogoOptions = {},
): Phaser.GameObjects.Container {
  const includeBackdrop = options.includeBackdrop ?? true;
  const baseLayers = includeBackdrop ? createPortraitBackdrop(scene, company.color, company.accent, {
    radius: 28,
    bandWidth: 16,
  }) : [];

  let layers: Phaser.GameObjects.GameObject[];
  switch (company.id) {
    case 'DEEPCORE':
      layers = createDeepcoreLogoLayers(scene, company.color, company.accent);
      break;
    case 'RECLAIM':
      layers = createReclaimLogoLayers(scene, company.color, company.accent);
      break;
    case 'IRONVEIL':
      layers = createIronveilLogoLayers(scene, company.color, company.accent);
      break;
    case 'FREEPORT':
      layers = createFreeportLogoLayers(scene, company.color, company.accent);
      break;
    default:
      layers = [];
      break;
  }

  return scene.add.container(0, 0, [...baseLayers, ...layers]);
}

function createDeepcoreLogoLayers(
  scene: Phaser.Scene,
  color: number,
  accent: number,
): Phaser.GameObjects.GameObject[] {
  const outer = scene.add.graphics();
  const hex = [
    { x: 0, y: -18 },
    { x: 15, y: -9 },
    { x: 15, y: 9 },
    { x: 0, y: 18 },
    { x: -15, y: 9 },
    { x: -15, y: -9 },
  ];
  fillPolygon(outer, hex, color, 0.12);
  strokePolygon(outer, hex, color, 0.78, 1.4);

  const core = scene.add.graphics();
  const innerHex = scalePoints(hex, 0.56);
  fillPolygon(core, innerHex, accent, 0.18);
  strokePolygon(core, innerHex, accent, 0.94, 1.2);

  const drill = scene.add.graphics();
  const chevron = [
    { x: -9, y: -2 },
    { x: 0, y: 15 },
    { x: 9, y: -2 },
    { x: 3, y: -2 },
    { x: 3, y: -14 },
    { x: -3, y: -14 },
    { x: -3, y: -2 },
  ];
  fillPolygon(drill, chevron, color, 0.14);
  strokePolygon(drill, chevron, accent, 0.92, 1.2);

  const scan = scene.add.graphics();
  scan.lineStyle(1, accent, 0.42);
  scan.lineBetween(-12, 0, 12, 0);
  scan.lineStyle(1, color, 0.24);
  scan.lineBetween(0, -12, 0, 12);

  return [outer, core, drill, scan];
}

function createReclaimLogoLayers(
  scene: Phaser.Scene,
  color: number,
  accent: number,
): Phaser.GameObjects.GameObject[] {
  const arrows = scene.add.graphics();
  const arrow: PortraitPoint[] = [
    { x: -5, y: -16 },
    { x: 5, y: -16 },
    { x: 5, y: -7 },
    { x: 11, y: -7 },
    { x: 0, y: 5 },
    { x: -11, y: -7 },
    { x: -5, y: -7 },
  ];
  for (const angle of [0, 120, 240]) {
    const rotated = rotatePoints(arrow, Phaser.Math.DegToRad(angle));
    fillPolygon(arrows, rotated, color, 0.1);
    strokePolygon(arrows, rotated, accent, 0.88, 1.1);
  }

  const crate = scene.add.graphics();
  crate.fillStyle(color, 0.08);
  crate.fillRoundedRect(-8, -8, 16, 16, 4);
  crate.lineStyle(1.2, color, 0.68);
  crate.strokeRoundedRect(-8, -8, 16, 16, 4);
  crate.lineStyle(1, accent, 0.44);
  crate.lineBetween(-8, 0, 8, 0);
  crate.lineBetween(0, -8, 0, 8);

  return [arrows, crate];
}

function createIronveilLogoLayers(
  scene: Phaser.Scene,
  color: number,
  accent: number,
): Phaser.GameObjects.GameObject[] {
  const shield = scene.add.graphics();
  const shieldPoints = [
    { x: 0, y: -20 },
    { x: 15, y: -12 },
    { x: 15, y: 3 },
    { x: 0, y: 18 },
    { x: -15, y: 3 },
    { x: -15, y: -12 },
  ];
  fillPolygon(shield, shieldPoints, color, 0.12);
  strokePolygon(shield, shieldPoints, color, 0.84, 1.4);

  const crest = scene.add.graphics();
  crest.fillStyle(accent, 0.18);
  crest.fillRoundedRect(-4, -15, 8, 23, 2);
  crest.lineStyle(1.1, accent, 0.96);
  crest.strokeRoundedRect(-4, -15, 8, 23, 2);
  crest.lineStyle(1.1, accent, 0.82);
  crest.lineBetween(-11, -6, 11, -6);
  crest.lineStyle(1, color, 0.3);
  crest.lineBetween(-7, 10, 7, 10);

  return [shield, crest];
}

function createFreeportLogoLayers(
  scene: Phaser.Scene,
  color: number,
  accent: number,
): Phaser.GameObjects.GameObject[] {
  const rings = scene.add.graphics();
  rings.lineStyle(1.2, color, 0.74);
  rings.strokeCircle(0, 0, 16);
  rings.lineStyle(1.1, accent, 0.82);
  strokeArc(rings, 0, 0, 21, Phaser.Math.DegToRad(210), Phaser.Math.DegToRad(330), accent, 0.84, 1.1);
  strokeArc(rings, 0, 0, 21, Phaser.Math.DegToRad(24), Phaser.Math.DegToRad(150), color, 0.62, 1.1);

  const gate = scene.add.graphics();
  const diamond = [
    { x: 0, y: -11 },
    { x: 11, y: 0 },
    { x: 0, y: 11 },
    { x: -11, y: 0 },
  ];
  fillPolygon(gate, diamond, color, 0.08);
  strokePolygon(gate, diamond, accent, 0.92, 1.2);
  gate.lineStyle(1, accent, 0.86);
  gate.lineBetween(-15, 0, 15, 0);
  gate.lineStyle(1, color, 0.28);
  gate.lineBetween(0, -15, 0, 15);

  const nodes = scene.add.graphics();
  for (const angle of [0, 120, 240]) {
    const x = Math.cos(Phaser.Math.DegToRad(angle)) * 21;
    const y = Math.sin(Phaser.Math.DegToRad(angle)) * 21;
    nodes.fillStyle(accent, 0.24);
    nodes.fillCircle(x, y, 2.8);
    nodes.lineStyle(1, color, 0.74);
    nodes.strokeCircle(x, y, 2.8);
  }

  return [rings, gate, nodes];
}

function scalePoints(points: PortraitPoint[], scale: number): PortraitPoint[] {
  return points.map((point) => ({ x: point.x * scale, y: point.y * scale }));
}

function rotatePoints(points: PortraitPoint[], radians: number): PortraitPoint[] {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return points.map((point) => ({
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  }));
}
