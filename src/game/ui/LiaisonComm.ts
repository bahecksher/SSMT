import Phaser from 'phaser';
import { UI_FONT, readableFontSize } from '../constants';
import { getLayout } from '../layout';
import type { CompanyDef } from '../data/companyData';
import { createPortraitBackdrop, fillPolygon, strokeArc, strokePolygon } from './portraitPrimitives';

interface LiaisonCommOptions {
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

/**
 * Parameterized comm panel for company liaison NPCs.
 * Portrait shape varies by company; colors come from CompanyDef.
 */
export class LiaisonComm {
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
  private readonly panelColor: number;
  private readonly accentColor: number;
  private readonly defaultPanelWidth: number;
  private panelWidth: number;
  private currentY: number;
  private panelHeight: number;
  private bottomInset: number | null = null;
  private compactLayout = false;

  constructor(scene: Phaser.Scene, company: CompanyDef, options: LiaisonCommOptions = {}) {
    this.scene = scene;
    this.autoHideMs = options.autoHideMs ?? 5400;
    const layout = getLayout();

    this.defaultPanelWidth = options.width ?? Math.min(layout.gameWidth - 96, 368);
    this.panelWidth = this.defaultPanelWidth;
    this.panelHeight = DEFAULT_COMM_MIN_HEIGHT;
    const x = (layout.gameWidth - this.panelWidth) / 2;
    const y = 2;
    const depth = options.depth ?? 148;
    this.defaultY = y;
    this.defaultDepth = depth;
    this.currentY = y;
    this.panelColor = company.color;
    this.accentColor = company.accent;

    this.panel = scene.add.graphics();

    this.portrait = this.createPortrait(scene, company);
    this.portrait.setPosition(DEFAULT_COMM_PORTRAIT_X, this.panelHeight / 2);
    this.portrait.setScale(DEFAULT_COMM_PORTRAIT_SCALE);

    this.nameText = scene.add.text(DEFAULT_COMM_HEADER_X, DEFAULT_COMM_HEADER_Y, company.liaisonTitle, {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(14),
      color: colorStr(company.color),
    });

    this.text = scene.add.text(DEFAULT_COMM_HEADER_X, 0, '', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(15),
      color: colorStr(company.color),
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
      alpha: 0.55,
      duration: 500,
      yoyo: true,
      repeat: -1,
      paused: true,
    });

    this.scanTween = scene.tweens.add({
      targets: this.portrait,
      angle: { from: -1, to: 1 },
      duration: 1800,
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

    // Slide down from top
    this.root.setY(targetY - 8);
    this.scene.tweens.add({
      targets: this.root,
      alpha: 1,
      y: targetY,
      duration: 200,
      ease: 'Sine.Out',
    });

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
      onComplete: () => this.root.setVisible(false),
    });
  }

  setPinnedLayout(y: number, depth?: number): void {
    this.bottomInset = null;
    this.setCompactLayout(false);
    this.currentY = y;
    this.root.setDepth(depth ?? this.root.depth);
    this.scene.tweens.killTweensOf(this.root);
    if (this.root.visible) this.root.setY(y);
  }

  setBottomPinnedLayout(bottomInset: number, depth?: number): void {
    this.bottomInset = bottomInset;
    this.setCompactLayout(true);
    this.root.setDepth(depth ?? this.root.depth);
    this.scene.tweens.killTweensOf(this.root);
    if (this.root.visible) this.root.setY(this.getTargetY());
  }

  resetLayout(): void {
    this.setPanelWidth(this.defaultPanelWidth);
    this.bottomInset = null;
    this.setCompactLayout(false);
    this.currentY = this.defaultY;
    this.root.setDepth(this.defaultDepth);
    this.scene.tweens.killTweensOf(this.root);
    if (this.root.visible) this.root.setY(this.currentY);
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
    if (this.root.visible) this.root.setY(this.getTargetY());
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
    const panelBg = darkenColor(this.panelColor, 0.15);
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
    this.panel.fillStyle(panelBg, panelAlpha);
    this.panel.lineStyle(1, this.panelColor, this.compactLayout ? 0.36 : 0.5);
    this.panel.fillRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);
    this.panel.strokeRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);
    this.panel.lineStyle(1, this.accentColor, this.compactLayout ? 0.1 : 0.15);
    this.panel.strokeRoundedRect(4, 4, this.panelWidth - 8, this.panelHeight - 8, 6);

    this.portrait.setScale(portraitScale);
    this.portrait.setPosition(portraitX, this.panelHeight / 2);
    this.root.setSize(this.panelWidth, this.panelHeight);
  }

  private createPortrait(scene: Phaser.Scene, company: CompanyDef): Phaser.GameObjects.Container {
    return createLiaisonPortrait(scene, company);
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

function colorStr(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

function darkenColor(hex: number, factor: number): number {
  const r = Math.floor(((hex >> 16) & 0xff) * factor);
  const g = Math.floor(((hex >> 8) & 0xff) * factor);
  const b = Math.floor((hex & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}
