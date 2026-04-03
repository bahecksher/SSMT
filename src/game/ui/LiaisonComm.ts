import Phaser from 'phaser';
import { UI_FONT, readableFontSize } from '../constants';
import { getLayout } from '../layout';
import type { CompanyDef } from '../data/companyData';

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

  const glow = scene.add.graphics();
  glow.fillStyle(c, 0.06);
  glow.fillCircle(0, 0, 28);

  const outline = scene.add.graphics();
  outline.lineStyle(1.5, c, 0.7);

  switch (company.id) {
    case 'DEEPCORE': // Diamond
      outline.beginPath();
      outline.moveTo(0, -22);
      outline.lineTo(18, 0);
      outline.lineTo(0, 22);
      outline.lineTo(-18, 0);
      outline.closePath();
      outline.strokePath();
      break;
    case 'RECLAIM': // Rounded rectangle
      outline.strokeRoundedRect(-16, -18, 32, 36, 6);
      break;
    case 'IRONVEIL': // Shield / chevron
      outline.beginPath();
      outline.moveTo(-16, -18);
      outline.lineTo(16, -18);
      outline.lineTo(16, 8);
      outline.lineTo(0, 22);
      outline.lineTo(-16, 8);
      outline.closePath();
      outline.strokePath();
      break;
    case 'FREEPORT': // Circle
      outline.strokeCircle(0, 0, 20);
      break;
  }

  const circuits = scene.add.graphics();
  circuits.lineStyle(1, a, 0.25);
  circuits.lineBetween(-10, -8, -4, -4);
  circuits.lineBetween(10, -8, 4, -4);
  circuits.lineBetween(-10, 10, -4, 6);
  circuits.lineBetween(10, 10, 4, 6);

  const eyes = scene.add.graphics();
  eyes.fillStyle(c, 0.9);
  eyes.fillRect(-9, -6, 5, 3);
  eyes.fillRect(4, -6, 5, 3);
  eyes.fillStyle(a, 1);
  eyes.fillRect(-7, -5, 2, 1);
  eyes.fillRect(6, -5, 2, 1);

  const mouth = scene.add.graphics();
  mouth.fillStyle(c, 0.6);
  mouth.fillRect(-6, 8, 3, 2);
  mouth.fillRect(-1, 8, 3, 3);
  mouth.fillRect(4, 8, 3, 2);

  return scene.add.container(0, 0, [glow, outline, circuits, eyes, mouth]);
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
