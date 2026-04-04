import Phaser from 'phaser';
import { CommPanel } from './CommPanel';
import { createPortraitBackdrop, fillPolygon, strokePolygon } from './portraitPrimitives';

const REGENT_COLOR = 0xff3366;
const REGENT_ACCENT = 0xff0044;

export class RegentComm extends CommPanel {
  constructor(scene: Phaser.Scene, options: { width?: number; depth?: number; autoHideMs?: number } = {}) {
    super(
      scene,
      {
        nameLabel: 'REGENT // PATROL',
        nameColor: REGENT_COLOR,
        textColor: REGENT_COLOR,
        fillColor: 0x180808,
        borderColor: REGENT_COLOR,
        innerBorderColor: REGENT_ACCENT,
        wipeDirection: 'right',
        autoHideMs: 5600,
        pulseDuration: 400,
        pulseAlpha: 0.55,
        scanAngle: 1.5,
        scanDuration: 1400,
      },
      createRegentPortrait(scene),
      options,
    );
  }
}

function createRegentPortrait(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const backdrop = createPortraitBackdrop(scene, REGENT_COLOR, REGENT_ACCENT, {
    radius: 29,
    bandWidth: 18,
  });

  const pauldrons = scene.add.graphics();
  fillPolygon(pauldrons, [
    { x: -19, y: 20 },
    { x: -9, y: 8 },
    { x: 9, y: 8 },
    { x: 19, y: 20 },
    { x: 11, y: 23 },
    { x: -11, y: 23 },
  ], REGENT_COLOR, 0.08);
  strokePolygon(pauldrons, [
    { x: -16, y: 18 },
    { x: -7, y: 10 },
    { x: 7, y: 10 },
    { x: 16, y: 18 },
  ], REGENT_ACCENT, 0.22, 1);

  const helmet = scene.add.graphics();
  fillPolygon(helmet, [
    { x: 0, y: -23 },
    { x: 11, y: -19 },
    { x: 17, y: -7 },
    { x: 15, y: 10 },
    { x: 7, y: 20 },
    { x: -7, y: 20 },
    { x: -15, y: 10 },
    { x: -17, y: -7 },
    { x: -11, y: -19 },
  ], REGENT_COLOR, 0.14);
  strokePolygon(helmet, [
    { x: 0, y: -23 },
    { x: 11, y: -19 },
    { x: 17, y: -7 },
    { x: 15, y: 10 },
    { x: 7, y: 20 },
    { x: -7, y: 20 },
    { x: -15, y: 10 },
    { x: -17, y: -7 },
    { x: -11, y: -19 },
  ], REGENT_COLOR, 0.64, 1.4);
  strokePolygon(helmet, [
    { x: -5, y: -23 },
    { x: 0, y: -28 },
    { x: 5, y: -23 },
  ], REGENT_ACCENT, 0.72, 1.1);
  helmet.lineStyle(1, REGENT_ACCENT, 0.22);
  helmet.lineBetween(-12, -15, -4, -20);
  helmet.lineBetween(12, -15, 4, -20);

  const facePlate = scene.add.graphics();
  fillPolygon(facePlate, [
    { x: -10, y: -13 },
    { x: 10, y: -13 },
    { x: 12, y: -2 },
    { x: 8, y: 13 },
    { x: 0, y: 18 },
    { x: -8, y: 13 },
    { x: -12, y: -2 },
  ], REGENT_COLOR, 0.1);
  strokePolygon(facePlate, [
    { x: -10, y: -13 },
    { x: 10, y: -13 },
    { x: 12, y: -2 },
    { x: 8, y: 13 },
    { x: 0, y: 18 },
    { x: -8, y: 13 },
    { x: -12, y: -2 },
  ], REGENT_ACCENT, 0.44, 1.2);

  const jawGuards = scene.add.graphics();
  fillPolygon(jawGuards, [
    { x: -11, y: 1 },
    { x: -5, y: 0 },
    { x: -4, y: 11 },
    { x: -9, y: 13 },
  ], REGENT_ACCENT, 0.12);
  fillPolygon(jawGuards, [
    { x: 5, y: 0 },
    { x: 11, y: 1 },
    { x: 9, y: 13 },
    { x: 4, y: 11 },
  ], REGENT_ACCENT, 0.12);

  const visor = scene.add.graphics();
  fillPolygon(visor, [
    { x: -12, y: -7 },
    { x: -2, y: -9 },
    { x: 12, y: -7 },
    { x: 5, y: -2 },
    { x: -5, y: -2 },
  ], REGENT_COLOR, 0.18);
  strokePolygon(visor, [
    { x: -12, y: -7 },
    { x: -2, y: -9 },
    { x: 12, y: -7 },
    { x: 5, y: -2 },
    { x: -5, y: -2 },
  ], REGENT_ACCENT, 0.8, 1.2);

  const eyes = scene.add.graphics();
  eyes.lineStyle(1.6, REGENT_ACCENT, 0.96);
  eyes.lineBetween(-8, -6, -2, -6);
  eyes.lineBetween(2, -6, 8, -6);
  eyes.lineStyle(1, REGENT_COLOR, 0.34);
  eyes.lineBetween(-1, -5, 1, -5);

  const features = scene.add.graphics();
  features.lineStyle(1.2, REGENT_COLOR, 0.34);
  features.lineBetween(0, -1, 0, 6);
  features.lineStyle(1, REGENT_ACCENT, 0.2);
  features.lineBetween(-2, 8.5, 0, 7.6);
  features.lineBetween(0, 7.6, 2, 8.5);

  return scene.add.container(0, 0, [
    ...backdrop,
    pauldrons,
    helmet,
    facePlate,
    jawGuards,
    visor,
    eyes,
    features,
  ]);
}
