import Phaser from 'phaser';
import { COLORS, UI_FONT, readableFontSize } from '../constants';
import { getLayout } from '../layout';
import { createPortraitBackdrop, fillPolygon, strokeArc, strokePolygon } from './portraitPrimitives';

interface SlickCommOptions {
  width?: number;
  depth?: number;
  autoHideMs?: number;
}

const DEFAULT_COMM_HEADER_X = 76;
const DEFAULT_COMM_HEADER_Y = 8;
const DEFAULT_COMM_PORTRAIT_X = 38;
const DEFAULT_COMM_MIN_HEIGHT = 96;
const DEFAULT_COMM_TEXT_GAP = 6;
const DEFAULT_COMM_RIGHT_PADDING = 16;
const DEFAULT_COMM_BOTTOM_PADDING = 14;
const DEFAULT_COMM_PORTRAIT_SCALE = 0.74;
const DEFAULT_COMM_BG_ALPHA = 0.92;

const COMPACT_COMM_HEADER_X = 68;
const COMPACT_COMM_HEADER_Y = 6;
const COMPACT_COMM_PORTRAIT_X = 30;
const COMPACT_COMM_MIN_HEIGHT = 60;
const COMPACT_COMM_TEXT_GAP = 3;
const COMPACT_COMM_RIGHT_PADDING = 12;
const COMPACT_COMM_BOTTOM_PADDING = 8;
const COMPACT_COMM_PORTRAIT_SCALE = 0.56;
const COMPACT_COMM_BG_ALPHA = 0.8;

export class SlickComm {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private panel: Phaser.GameObjects.Graphics;
  private portrait: Phaser.GameObjects.Container;
  private text: Phaser.GameObjects.Text;
  private nameText: Phaser.GameObjects.Text;
  private hideTimer: Phaser.Time.TimerEvent | null = null;
  private pulseTween: Phaser.Tweens.Tween;
  private scanTween: Phaser.Tweens.Tween;
  private autoHideMs: number;
  private readonly defaultY: number;
  private readonly defaultDepth: number;
  private readonly defaultPanelWidth: number;
  private panelWidth: number;
  private currentY: number;
  private panelHeight: number;
  private bottomInset: number | null = null;
  private wipeIn = false;
  private compactLayout = false;

  constructor(scene: Phaser.Scene, options: SlickCommOptions = {}) {
    this.scene = scene;
    this.autoHideMs = options.autoHideMs ?? 5200;
    const layout = getLayout();

    this.defaultPanelWidth = options.width ?? Math.min(layout.gameWidth - 96, 368);
    this.panelWidth = this.defaultPanelWidth;
    this.panelHeight = DEFAULT_COMM_MIN_HEIGHT;
    const x = (layout.gameWidth - this.panelWidth) / 2;
    const y = 2;
    const depth = options.depth ?? 150;
    this.defaultY = y;
    this.defaultDepth = depth;
    this.currentY = y;

    this.panel = scene.add.graphics();

    this.portrait = this.createPortrait(scene);
    this.portrait.setPosition(DEFAULT_COMM_PORTRAIT_X, this.panelHeight / 2);
    this.portrait.setScale(DEFAULT_COMM_PORTRAIT_SCALE);

    this.nameText = scene.add.text(DEFAULT_COMM_HEADER_X, DEFAULT_COMM_HEADER_Y, 'SLICK // OPS', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(14),
      color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
    });

    this.text = scene.add.text(DEFAULT_COMM_HEADER_X, 0, '', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(15),
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      wordWrap: { width: this.panelWidth - DEFAULT_COMM_HEADER_X - DEFAULT_COMM_RIGHT_PADDING },
      lineSpacing: 2,
    });

    this.root = scene.add.container(x, y, [this.panel, this.portrait, this.nameText, this.text]);
    this.redrawPanel();
    this.root.setDepth(depth);
    this.root.setAlpha(0);
    this.root.setVisible(false);

    this.pulseTween = scene.tweens.add({
      targets: this.portrait,
      alpha: 0.6,
      duration: 600,
      yoyo: true,
      repeat: -1,
      paused: true,
    });

    // Scan line effect on portrait
    this.scanTween = scene.tweens.add({
      targets: this.portrait,
      angle: { from: -1, to: 1 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      paused: true,
    });
  }

  show(message: string, autoHideMs = this.autoHideMs): void {
    if (this.hideTimer) {
      this.hideTimer.remove(false);
      this.hideTimer = null;
    }

    this.text.setText(message);
    this.redrawPanel();
    this.root.setVisible(true);
    this.scene.tweens.killTweensOf(this.root);
    const targetY = this.getTargetY();

    if (this.wipeIn) {
      // Horizontal wipe: slide from off-screen left into center
      this.root.setX(-this.panelWidth - 20);
      this.root.setY(targetY);
      this.root.setAlpha(1);
      this.scene.tweens.add({
        targets: this.root,
        x: (getLayout().gameWidth - this.panelWidth) / 2,
        duration: 280,
        ease: 'Back.Out',
      });
    } else {
      // Normal: slide down from top
      this.root.setY(targetY - 8);
      this.scene.tweens.add({
        targets: this.root,
        alpha: 1,
        y: targetY,
        duration: 200,
        ease: 'Sine.Out',
      });
    }

    this.pulseTween.resume();
    this.scanTween.resume();

    if (autoHideMs > 0) {
      this.hideTimer = this.scene.time.delayedCall(autoHideMs, () => this.hide());
    }
  }

  hide(): void {
    if (!this.root.visible) return;
    if (this.hideTimer) {
      this.hideTimer.remove(false);
      this.hideTimer = null;
    }
    this.pulseTween.pause();
    this.scanTween.pause();
    this.scene.tweens.killTweensOf(this.root);
    const targetY = this.getTargetY();
    this.scene.tweens.add({
      targets: this.root,
      alpha: 0,
      y: targetY - 8,
      duration: 200,
      ease: 'Sine.In',
      onComplete: () => {
        this.root.setVisible(false);
        this.wipeIn = false;
      },
    });
  }

  setPinnedLayout(y: number, depth?: number): void {
    this.bottomInset = null;
    this.setCompactLayout(false);
    this.currentY = y;
    this.wipeIn = true;
    this.root.setDepth(depth ?? this.root.depth);
    this.scene.tweens.killTweensOf(this.root);
    if (this.root.visible) {
      this.root.setY(y);
    }
  }

  setPinnedCompactLayout(y: number, depth?: number): void {
    this.bottomInset = null;
    this.setCompactLayout(true);
    this.currentY = y;
    this.wipeIn = true;
    this.root.setDepth(depth ?? this.root.depth);
    this.scene.tweens.killTweensOf(this.root);
    if (this.root.visible) {
      this.root.setY(y);
    }
  }

  setBottomPinnedLayout(bottomInset: number, depth?: number): void {
    this.bottomInset = bottomInset;
    this.setCompactLayout(true);
    this.wipeIn = false;
    this.root.setDepth(depth ?? this.root.depth);
    this.scene.tweens.killTweensOf(this.root);
    if (this.root.visible) {
      this.root.setY(this.getTargetY());
    }
  }

  resetLayout(): void {
    this.setPanelWidth(this.defaultPanelWidth);
    this.bottomInset = null;
    this.setCompactLayout(false);
    this.currentY = this.defaultY;
    this.wipeIn = true;
    this.root.setDepth(this.defaultDepth);
    this.scene.tweens.killTweensOf(this.root);
    if (this.root.visible) {
      this.root.setY(this.currentY);
    }
  }

  destroy(): void {
    if (this.hideTimer) {
      this.hideTimer.remove(false);
      this.hideTimer = null;
    }
    this.pulseTween.stop();
    this.scanTween.stop();
    this.root.destroy(true);
  }

  getPanelHeight(): number {
    return this.panelHeight;
  }

  setPanelWidth(width: number): void {
    const layout = getLayout();
    const clampedWidth = Phaser.Math.Clamp(Math.round(width), 220, layout.gameWidth);
    if (clampedWidth === this.panelWidth) return;
    this.panelWidth = clampedWidth;
    this.redrawPanel();
    this.root.setX((layout.gameWidth - this.panelWidth) / 2);
    if (this.root.visible) {
      this.root.setY(this.getTargetY());
    }
  }

  private setCompactLayout(compact: boolean): void {
    if (this.compactLayout === compact) return;
    this.compactLayout = compact;
    this.redrawPanel();
  }

  private getTargetY(): number {
    if (this.bottomInset === null) return this.currentY;
    return Math.max(0, getLayout().gameHeight - this.panelHeight - this.bottomInset);
  }

  private redrawPanel(): void {
    const headerX = this.compactLayout ? COMPACT_COMM_HEADER_X : DEFAULT_COMM_HEADER_X;
    const headerY = this.compactLayout ? COMPACT_COMM_HEADER_Y : DEFAULT_COMM_HEADER_Y;
    const portraitX = this.compactLayout ? COMPACT_COMM_PORTRAIT_X : DEFAULT_COMM_PORTRAIT_X;
    const minHeight = this.compactLayout ? COMPACT_COMM_MIN_HEIGHT : DEFAULT_COMM_MIN_HEIGHT;
    const textGap = this.compactLayout ? COMPACT_COMM_TEXT_GAP : DEFAULT_COMM_TEXT_GAP;
    const rightPadding = this.compactLayout ? COMPACT_COMM_RIGHT_PADDING : DEFAULT_COMM_RIGHT_PADDING;
    const bottomPadding = this.compactLayout ? COMPACT_COMM_BOTTOM_PADDING : DEFAULT_COMM_BOTTOM_PADDING;
    const portraitScale = this.compactLayout ? COMPACT_COMM_PORTRAIT_SCALE : DEFAULT_COMM_PORTRAIT_SCALE;
    const panelAlpha = this.compactLayout ? COMPACT_COMM_BG_ALPHA : DEFAULT_COMM_BG_ALPHA;

    this.nameText.setPosition(headerX, headerY);
    this.text.setWordWrapWidth(this.panelWidth - headerX - rightPadding);
    this.text.setLineSpacing(this.compactLayout ? 1 : 2);
    const bodyY = this.nameText.y + this.nameText.height + textGap;
    this.text.setPosition(headerX, bodyY);
    this.panelHeight = Math.max(minHeight, Math.ceil(bodyY + this.text.height + bottomPadding));

    this.panel.clear();
    this.panel.fillStyle(0x03110e, panelAlpha);
    this.panel.lineStyle(1, COLORS.HUD, this.compactLayout ? 0.36 : 0.5);
    this.panel.fillRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);
    this.panel.strokeRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);
    this.panel.lineStyle(1, COLORS.PLAYER, this.compactLayout ? 0.1 : 0.15);
    this.panel.strokeRoundedRect(4, 4, this.panelWidth - 8, this.panelHeight - 8, 6);

    this.portrait.setScale(portraitScale);
    this.portrait.setPosition(portraitX, this.panelHeight / 2);
    this.root.setSize(this.panelWidth, this.panelHeight);
  }

  private createPortrait(scene: Phaser.Scene): Phaser.GameObjects.Container {
    return createSlickPortrait(scene);
  }

}

export function createSlickPortraitLegacy(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const backdrop = createPortraitBackdrop(scene, COLORS.PLAYER, COLORS.SALVAGE, {
    radius: 29,
    bandWidth: 17,
  });

  const shoulders = scene.add.graphics();
  fillPolygon(shoulders, [
    { x: -17, y: 20 },
    { x: -9, y: 9 },
    { x: 9, y: 9 },
    { x: 17, y: 20 },
    { x: 10, y: 22 },
    { x: -10, y: 22 },
  ], COLORS.PLAYER, 0.08);
  strokePolygon(shoulders, [
    { x: -15, y: 18 },
    { x: -7, y: 10 },
    { x: 7, y: 10 },
    { x: 15, y: 18 },
  ], COLORS.SALVAGE, 0.18, 1);

  const hair = scene.add.graphics();
  fillPolygon(hair, [
    { x: -15, y: -19 },
    { x: -6, y: -24 },
    { x: 8, y: -22 },
    { x: 15, y: -11 },
    { x: 14, y: 12 },
    { x: 6, y: 20 },
    { x: -8, y: 18 },
    { x: -15, y: 5 },
  ], COLORS.PLAYER, 0.14);
  strokePolygon(hair, [
    { x: -15, y: -19 },
    { x: -6, y: -24 },
    { x: 8, y: -22 },
    { x: 15, y: -11 },
    { x: 14, y: 10 },
    { x: 6, y: 19 },
    { x: -8, y: 18 },
    { x: -15, y: 4 },
  ], COLORS.PLAYER, 0.52, 1.4);
  hair.lineStyle(1, COLORS.SALVAGE, 0.22);
  hair.lineBetween(-11, -16, 5, -19);
  hair.lineBetween(-13, -4, -8, 10);

    // Eyes — two horizontal bars
  const face = scene.add.graphics();
  fillPolygon(face, [
    { x: -10, y: -16 },
    { x: 8, y: -15 },
    { x: 11, y: -2 },
    { x: 7, y: 13 },
    { x: 0, y: 18 },
    { x: -7, y: 13 },
    { x: -11, y: -1 },
  ], COLORS.PLAYER, 0.12);
  strokePolygon(face, [
    { x: -10, y: -16 },
    { x: 8, y: -15 },
    { x: 11, y: -2 },
    { x: 7, y: 13 },
    { x: 0, y: 18 },
    { x: -7, y: 13 },
    { x: -11, y: -1 },
  ], COLORS.SALVAGE, 0.42, 1.2);

    // Nose — small chevron
  const cheekPanels = scene.add.graphics();
  fillPolygon(cheekPanels, [
    { x: -10, y: -1 },
    { x: -5, y: -1 },
    { x: -3, y: 8 },
    { x: -8, y: 10 },
  ], COLORS.SALVAGE, 0.1);
  fillPolygon(cheekPanels, [
    { x: 5, y: -1 },
    { x: 10, y: -1 },
    { x: 8, y: 10 },
    { x: 3, y: 8 },
  ], COLORS.SALVAGE, 0.1);

    // Mouth — equalizer bars (animated feel)
  const visor = scene.add.graphics();
  fillPolygon(visor, [
    { x: -12, y: -6 },
    { x: -4, y: -10 },
    { x: 9, y: -9 },
    { x: 12, y: -2 },
    { x: 4, y: 1 },
    { x: -10, y: 0 },
  ], COLORS.PLAYER, 0.16);
  strokePolygon(visor, [
    { x: -12, y: -6 },
    { x: -4, y: -10 },
    { x: 9, y: -9 },
    { x: 12, y: -2 },
    { x: 4, y: 1 },
    { x: -10, y: 0 },
  ], COLORS.SALVAGE, 0.72, 1.1);

  const eyes = scene.add.graphics();
  eyes.lineStyle(1.6, COLORS.SALVAGE, 0.95);
  eyes.lineBetween(-9, -5, -4, -6);
  eyes.lineBetween(3, -6, 8, -5);
  eyes.lineStyle(1, COLORS.PLAYER, 0.45);
  eyes.lineBetween(-2, -4, 2, -4);

  const features = scene.add.graphics();
  features.lineStyle(1, COLORS.PLAYER, 0.24);
  features.lineBetween(0, -2, 0, 6);
  features.lineStyle(1, COLORS.SALVAGE, 0.28);
  features.lineBetween(-12, -12, -15, -8);
  features.lineBetween(12, -12, 15, -8);

  const earpiece = scene.add.graphics();
  earpiece.lineStyle(1, COLORS.PLAYER, 0.46);
  earpiece.strokeCircle(-13, -2, 2.2);
  earpiece.lineBetween(-11, -2, -8, -2);
  earpiece.lineStyle(1, COLORS.SALVAGE, 0.28);
  earpiece.lineBetween(10, -13, 14, -11);

  return scene.add.container(0, 0, [
    ...backdrop,
    shoulders,
    hair,
    face,
    cheekPanels,
    visor,
    eyes,
    features,
    earpiece,
  ]);
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
