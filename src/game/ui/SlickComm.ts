import Phaser from 'phaser';
import { COLORS } from '../constants';
import { CommPanel } from './CommPanel';
import { createPortraitBackdrop, fillPolygon, strokeArc, strokePolygon } from './portraitPrimitives';

export class SlickComm extends CommPanel {
  constructor(scene: Phaser.Scene, options: { width?: number; depth?: number; autoHideMs?: number } = {}) {
    super(
      scene,
      {
        nameLabel: 'SLICK // OPS',
        nameColor: COLORS.SALVAGE,
        textColor: COLORS.HUD,
        fillColor: COLORS.BG,
        borderColor: COLORS.HUD,
        innerBorderColor: COLORS.PLAYER,
        wipeDirection: 'left',
        autoHideMs: 5200,
        pulseDuration: 600,
        pulseAlpha: 0.6,
        scanAngle: 1,
        scanDuration: 2000,
      },
      createSlickPortrait(scene),
      options,
    );
  }
}

export function createSlickPortrait(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const backdrop = createPortraitBackdrop(scene, COLORS.PLAYER, COLORS.SALVAGE, {
    radius: 29,
    bandWidth: 17,
  });

  const shoulders = scene.add.graphics();
  fillPolygon(shoulders, [
    { x: -16, y: 21 },
    { x: -8, y: 10 },
    { x: 8, y: 10 },
    { x: 16, y: 21 },
    { x: 9, y: 23 },
    { x: -9, y: 23 },
  ], COLORS.PLAYER, 0.08);
  strokePolygon(shoulders, [
    { x: -13, y: 18 },
    { x: -5, y: 10 },
    { x: 5, y: 10 },
    { x: 13, y: 18 },
  ], COLORS.SALVAGE, 0.18, 1);

  const neck = scene.add.graphics();
  fillPolygon(neck, [
    { x: -4, y: 10 },
    { x: 4, y: 10 },
    { x: 5, y: 18 },
    { x: -5, y: 18 },
  ], COLORS.PLAYER, 0.1);
  strokePolygon(neck, [
    { x: -4, y: 10 },
    { x: 4, y: 10 },
    { x: 5, y: 18 },
    { x: -5, y: 18 },
  ], COLORS.SALVAGE, 0.18, 1);

  const hairBack = scene.add.graphics();
  fillPolygon(hairBack, [
    { x: -14, y: -16 },
    { x: -5, y: -24 },
    { x: 8, y: -23 },
    { x: 15, y: -12 },
    { x: 15, y: 7 },
    { x: 11, y: 18 },
    { x: 4, y: 21 },
    { x: -8, y: 19 },
    { x: -14, y: 6 },
  ], COLORS.PLAYER, 0.12);
  strokePolygon(hairBack, [
    { x: -14, y: -16 },
    { x: -5, y: -24 },
    { x: 8, y: -23 },
    { x: 15, y: -12 },
    { x: 15, y: 7 },
    { x: 11, y: 18 },
    { x: 4, y: 21 },
    { x: -8, y: 19 },
    { x: -14, y: 6 },
  ], COLORS.PLAYER, 0.48, 1.4);

  const face = scene.add.graphics();
  fillPolygon(face, [
    { x: -8, y: -15 },
    { x: 7, y: -15 },
    { x: 10, y: -4 },
    { x: 8, y: 9 },
    { x: 3, y: 16 },
    { x: 0, y: 18 },
    { x: -4, y: 16 },
    { x: -8, y: 9 },
    { x: -10, y: -4 },
  ], COLORS.PLAYER, 0.13);
  strokePolygon(face, [
    { x: -8, y: -15 },
    { x: 7, y: -15 },
    { x: 10, y: -4 },
    { x: 8, y: 9 },
    { x: 3, y: 16 },
    { x: 0, y: 18 },
    { x: -4, y: 16 },
    { x: -8, y: 9 },
    { x: -10, y: -4 },
  ], COLORS.SALVAGE, 0.44, 1.15);

  const jawLight = scene.add.graphics();
  fillPolygon(jawLight, [
    { x: -7, y: 1 },
    { x: 7, y: 1 },
    { x: 5, y: 12 },
    { x: 0, y: 16 },
    { x: -5, y: 12 },
  ], COLORS.SALVAGE, 0.08);

  const hairFront = scene.add.graphics();
  fillPolygon(hairFront, [
    { x: -12, y: -11 },
    { x: -4, y: -19 },
    { x: 5, y: -20 },
    { x: 11, y: -13 },
    { x: 6, y: -9 },
    { x: -1, y: -10 },
    { x: -9, y: -6 },
  ], COLORS.PLAYER, 0.16);
  strokePolygon(hairFront, [
    { x: -12, y: -11 },
    { x: -4, y: -19 },
    { x: 5, y: -20 },
    { x: 11, y: -13 },
    { x: 6, y: -9 },
    { x: -1, y: -10 },
    { x: -9, y: -6 },
  ], COLORS.PLAYER, 0.62, 1.1);
  hairFront.lineStyle(1, COLORS.SALVAGE, 0.24);
  hairFront.lineBetween(-7, -15, 4, -17);
  hairFront.lineBetween(7, -12, 9, 1);

  const eyes = scene.add.graphics();
  strokeArc(eyes, -5, -4, 3.2, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(350), COLORS.SALVAGE, 0.78, 1.2);
  strokeArc(eyes, 5, -4, 3.2, Phaser.Math.DegToRad(190), Phaser.Math.DegToRad(335), COLORS.SALVAGE, 0.78, 1.2);
  eyes.lineStyle(1.2, COLORS.SALVAGE, 0.92);
  eyes.lineBetween(-8, -5, -2.5, -5.5);
  eyes.lineBetween(2.5, -5.5, 8, -5);
  eyes.fillStyle(COLORS.SALVAGE, 0.9);
  eyes.fillCircle(-4.8, -4.4, 0.9);
  eyes.fillCircle(4.8, -4.4, 0.9);

  const features = scene.add.graphics();
  features.lineStyle(1.1, COLORS.PLAYER, 0.38);
  features.lineBetween(-7.5, -8.5, -2.5, -9);
  features.lineBetween(2.5, -9, 7.5, -8.4);
  features.lineStyle(1, COLORS.PLAYER, 0.28);
  features.lineBetween(0, -1, 0, 6);
  features.lineBetween(-1.5, 6, 0, 7.5);
  features.lineBetween(0, 7.5, 1.6, 6);
  features.lineStyle(1, COLORS.SALVAGE, 0.24);
  features.lineBetween(-2.2, 9.5, 0, 8.6);
  features.lineBetween(0, 8.6, 2.2, 9.5);

  const earpiece = scene.add.graphics();
  earpiece.lineStyle(1, COLORS.PLAYER, 0.46);
  earpiece.strokeCircle(-12.5, -1.5, 2.1);
  earpiece.lineBetween(-10.5, -1.5, -7.8, -0.8);
  earpiece.lineStyle(1, COLORS.SALVAGE, 0.28);
  earpiece.lineBetween(9.5, -12.5, 13.5, -10.5);

  const collar = scene.add.graphics();
  collar.lineStyle(1, COLORS.PLAYER, 0.24);
  collar.lineBetween(-8, 18, -3, 11);
  collar.lineBetween(3, 11, 8, 18);
  collar.lineStyle(1, COLORS.SALVAGE, 0.2);
  collar.lineBetween(-4, 18, 4, 18);

  return scene.add.container(0, 0, [
    ...backdrop,
    shoulders,
    neck,
    hairBack,
    face,
    jawLight,
    hairFront,
    eyes,
    features,
    earpiece,
    collar,
  ]);
}
