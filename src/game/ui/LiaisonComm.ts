import Phaser from 'phaser';
import type { CompanyDef } from '../data/companyData';
import { CommPanel } from './CommPanel';
import { darkenColor } from '../utils/geometry';
import { createPortraitBackdrop, fillPolygon, strokeArc, strokePolygon } from './portraitPrimitives';

export class LiaisonComm extends CommPanel {
  constructor(scene: Phaser.Scene, company: CompanyDef, options: { width?: number; depth?: number; autoHideMs?: number } = {}) {
    super(
      scene,
      {
        nameLabel: company.liaisonTitle,
        nameColor: company.color,
        textColor: company.color,
        fillColor: darkenColor(company.color, 0.15),
        borderColor: company.color,
        innerBorderColor: company.accent,
        wipeDirection: 'none',
        autoHideMs: 5400,
        pulseDuration: 500,
        pulseAlpha: 0.55,
        scanAngle: 1,
        scanDuration: 1800,
      },
      createLiaisonPortrait(scene, company),
      { ...options, depth: options.depth ?? 148 },
    );
  }
}

/** Shared portrait factory — used by LiaisonComm and MissionSelectScene. */
export function createLiaisonPortrait(scene: Phaser.Scene, company: CompanyDef): Phaser.GameObjects.Container {
  const c = company.color;
  const a = company.accent;
  const backdrop = createPortraitBackdrop(scene, c, a, {
    radius: 28,
    bandWidth: 16,
  });

  let layers: Phaser.GameObjects.GameObject[];
  switch (company.id) {
    case 'DEEPCORE':
      layers = createDeepcorePortraitLayers(scene, c, a);
      break;
    case 'RECLAIM':
      layers = createReclaimPortraitLayers(scene, c, a);
      break;
    case 'IRONVEIL':
      layers = createIronveilPortraitLayers(scene, c, a);
      break;
    case 'FREEPORT':
      layers = createFreeportPortraitLayers(scene, c, a);
      break;
    default:
      layers = [];
      break;
  }

  return scene.add.container(0, 0, [...backdrop, ...layers]);
}

function createDeepcorePortraitLayers(
  scene: Phaser.Scene,
  color: number,
  accent: number,
): Phaser.GameObjects.GameObject[] {
  const shoulders = scene.add.graphics();
  fillPolygon(shoulders, [
    { x: -17, y: 19 },
    { x: -8, y: 9 },
    { x: 8, y: 9 },
    { x: 17, y: 19 },
    { x: 10, y: 22 },
    { x: -10, y: 22 },
  ], color, 0.08);

  const helmet = scene.add.graphics();
  fillPolygon(helmet, [
    { x: 0, y: -22 },
    { x: 15, y: -8 },
    { x: 15, y: 8 },
    { x: 0, y: 21 },
    { x: -15, y: 8 },
    { x: -15, y: -8 },
  ], color, 0.13);
  strokePolygon(helmet, [
    { x: 0, y: -22 },
    { x: 15, y: -8 },
    { x: 15, y: 8 },
    { x: 0, y: 21 },
    { x: -15, y: 8 },
    { x: -15, y: -8 },
  ], color, 0.62, 1.3);

  const face = scene.add.graphics();
  fillPolygon(face, [
    { x: -9, y: -12 },
    { x: 9, y: -12 },
    { x: 11, y: -1 },
    { x: 6, y: 13 },
    { x: 0, y: 17 },
    { x: -6, y: 13 },
    { x: -11, y: -1 },
  ], color, 0.1);
  strokePolygon(face, [
    { x: -9, y: -12 },
    { x: 9, y: -12 },
    { x: 11, y: -1 },
    { x: 6, y: 13 },
    { x: 0, y: 17 },
    { x: -6, y: 13 },
    { x: -11, y: -1 },
  ], accent, 0.42, 1.1);

  const visor = scene.add.graphics();
  fillPolygon(visor, [
    { x: -10, y: -7 },
    { x: -2, y: -10 },
    { x: 10, y: -7 },
    { x: 5, y: -2 },
    { x: -5, y: -2 },
  ], color, 0.16);
  strokePolygon(visor, [
    { x: -10, y: -7 },
    { x: -2, y: -10 },
    { x: 10, y: -7 },
    { x: 5, y: -2 },
    { x: -5, y: -2 },
  ], accent, 0.82, 1.15);

  const respirator = scene.add.graphics();
  respirator.lineStyle(1, color, 0.22);
  respirator.lineBetween(0, -1, 0, 7);
  respirator.lineStyle(1, accent, 0.18);
  respirator.lineBetween(-2.2, 8.5, 0, 7.8);
  respirator.lineBetween(0, 7.8, 2.2, 8.5);

  return [shoulders, helmet, face, visor, respirator];
}

function createReclaimPortraitLayers(
  scene: Phaser.Scene,
  color: number,
  accent: number,
): Phaser.GameObjects.GameObject[] {
  const shoulders = scene.add.graphics();
  fillPolygon(shoulders, [
    { x: -16, y: 20 },
    { x: -8, y: 10 },
    { x: 8, y: 10 },
    { x: 16, y: 20 },
    { x: 9, y: 22 },
    { x: -9, y: 22 },
  ], color, 0.08);

  const hood = scene.add.graphics();
  hood.fillStyle(color, 0.13);
  hood.fillRoundedRect(-15, -20, 30, 40, 8);
  hood.lineStyle(1.3, color, 0.58);
  hood.strokeRoundedRect(-15, -20, 30, 40, 8);
  hood.lineStyle(1, accent, 0.26);
  hood.lineBetween(-11, -13, -5, -18);
  hood.lineBetween(11, 12, 5, 17);

  const patch = scene.add.graphics();
  fillPolygon(patch, [
    { x: 7, y: -18 },
    { x: 15, y: -14 },
    { x: 15, y: -2 },
    { x: 10, y: -5 },
  ], accent, 0.12);

  const face = scene.add.graphics();
  face.fillStyle(color, 0.1);
  face.fillRoundedRect(-10, -14, 20, 30, 6);
  face.lineStyle(1.1, accent, 0.42);
  face.strokeRoundedRect(-10, -14, 20, 30, 6);

  const visor = scene.add.graphics();
  visor.fillStyle(color, 0.16);
  visor.fillRoundedRect(-11, -8, 22, 8, 4);
  visor.lineStyle(1.2, accent, 0.84);
  visor.strokeRoundedRect(-11, -8, 22, 8, 4);

  const details = scene.add.graphics();
  details.lineStyle(1.5, accent, 0.94);
  details.lineBetween(-8, -4, -2, -4);
  details.lineBetween(2, -4, 8, -4);
  details.lineStyle(1.1, color, 0.34);
  details.lineBetween(0, -1, 0, 7);
  details.lineStyle(1, accent, 0.18);
  details.lineBetween(-2, 8.7, 0, 8);
  details.lineBetween(0, 8, 2, 8.7);

  return [shoulders, hood, patch, face, visor, details];
}

function createIronveilPortraitLayers(
  scene: Phaser.Scene,
  color: number,
  accent: number,
): Phaser.GameObjects.GameObject[] {
  const pauldrons = scene.add.graphics();
  fillPolygon(pauldrons, [
    { x: -18, y: 20 },
    { x: -8, y: 9 },
    { x: 8, y: 9 },
    { x: 18, y: 20 },
    { x: 10, y: 23 },
    { x: -10, y: 23 },
  ], color, 0.08);

  const helmet = scene.add.graphics();
  fillPolygon(helmet, [
    { x: -14, y: -19 },
    { x: 14, y: -19 },
    { x: 14, y: 7 },
    { x: 0, y: 21 },
    { x: -14, y: 7 },
  ], color, 0.14);
  strokePolygon(helmet, [
    { x: -14, y: -19 },
    { x: 14, y: -19 },
    { x: 14, y: 7 },
    { x: 0, y: 21 },
    { x: -14, y: 7 },
  ], color, 0.64, 1.35);

  const face = scene.add.graphics();
  fillPolygon(face, [
    { x: -9, y: -13 },
    { x: 9, y: -13 },
    { x: 11, y: -2 },
    { x: 7, y: 13 },
    { x: 0, y: 17 },
    { x: -7, y: 13 },
    { x: -11, y: -2 },
  ], color, 0.1);
  strokePolygon(face, [
    { x: -9, y: -13 },
    { x: 9, y: -13 },
    { x: 11, y: -2 },
    { x: 7, y: 13 },
    { x: 0, y: 17 },
    { x: -7, y: 13 },
    { x: -11, y: -2 },
  ], accent, 0.44, 1.15);

  const visor = scene.add.graphics();
  fillPolygon(visor, [
    { x: -11, y: -7 },
    { x: 11, y: -7 },
    { x: 4, y: -1 },
    { x: -4, y: -1 },
  ], color, 0.16);
  strokePolygon(visor, [
    { x: -11, y: -7 },
    { x: 11, y: -7 },
    { x: 4, y: -1 },
    { x: -4, y: -1 },
  ], accent, 0.82, 1.15);

  const jawGuards = scene.add.graphics();
  fillPolygon(jawGuards, [
    { x: -10, y: 1 },
    { x: -4, y: 0 },
    { x: -4, y: 12 },
    { x: -8, y: 14 },
  ], accent, 0.12);
  fillPolygon(jawGuards, [
    { x: 4, y: 0 },
    { x: 10, y: 1 },
    { x: 8, y: 14 },
    { x: 4, y: 12 },
  ], accent, 0.12);

  const details = scene.add.graphics();
  details.lineStyle(1.5, accent, 0.96);
  details.lineBetween(-8, -4, -2, -4);
  details.lineBetween(2, -4, 8, -4);
  details.lineStyle(1, accent, 0.2);
  details.lineBetween(-2.2, 8.8, 0, 8);
  details.lineBetween(0, 8, 2.2, 8.8);

  return [pauldrons, helmet, face, visor, jawGuards, details];
}

function createFreeportPortraitLayers(
  scene: Phaser.Scene,
  color: number,
  accent: number,
): Phaser.GameObjects.GameObject[] {
  const shoulders = scene.add.graphics();
  fillPolygon(shoulders, [
    { x: -17, y: 20 },
    { x: -9, y: 10 },
    { x: 9, y: 10 },
    { x: 17, y: 20 },
    { x: 10, y: 22 },
    { x: -10, y: 22 },
  ], color, 0.08);

  const halo = scene.add.graphics();
  halo.lineStyle(1.2, color, 0.6);
  halo.strokeCircle(0, -2, 19);
  halo.lineStyle(1, accent, 0.32);
  halo.strokeCircle(0, -2, 14);
  strokeArc(halo, 0, -2, 22, Phaser.Math.DegToRad(210), Phaser.Math.DegToRad(330), accent, 0.26, 1);
  strokeArc(halo, 0, -2, 22, Phaser.Math.DegToRad(24), Phaser.Math.DegToRad(140), color, 0.22, 1);

  const face = scene.add.graphics();
  fillPolygon(face, [
    { x: -8, y: -14 },
    { x: 8, y: -14 },
    { x: 11, y: -2 },
    { x: 7, y: 12 },
    { x: 0, y: 17 },
    { x: -7, y: 12 },
    { x: -11, y: -2 },
  ], color, 0.1);
  strokePolygon(face, [
    { x: -8, y: -14 },
    { x: 8, y: -14 },
    { x: 11, y: -2 },
    { x: 7, y: 12 },
    { x: 0, y: 17 },
    { x: -7, y: 12 },
    { x: -11, y: -2 },
  ], accent, 0.42, 1.1);

  const visor = scene.add.graphics();
  fillPolygon(visor, [
    { x: -10, y: -7 },
    { x: -3, y: -10 },
    { x: 10, y: -7 },
    { x: 6, y: 0 },
    { x: -6, y: 0 },
  ], color, 0.16);
  strokePolygon(visor, [
    { x: -10, y: -7 },
    { x: -3, y: -10 },
    { x: 10, y: -7 },
    { x: 6, y: 0 },
    { x: -6, y: 0 },
  ], accent, 0.82, 1.1);

  const details = scene.add.graphics();
  details.lineStyle(1.5, accent, 0.94);
  details.lineBetween(-7, -5, -2, -6);
  details.lineBetween(2, -6, 7, -5);
  details.lineStyle(1.1, color, 0.34);
  details.lineBetween(0, 0, 0, 7);
  details.lineStyle(1, accent, 0.3);
  details.lineBetween(-14, -2, -18, 2);
  details.lineBetween(14, -2, 18, 2);

  return [shoulders, halo, face, visor, details];
}
