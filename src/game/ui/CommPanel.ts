import Phaser from 'phaser';
import { UI_FONT, readableFontSize } from '../constants';
import { getLayout } from '../layout';
import { colorStr } from '../utils/geometry';

// --- Shared layout constants for all comm panels ---
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

export interface CommPanelStyle {
  nameLabel: string;
  nameColor: number;
  nameFontFamily?: string;
  textColor: number;
  /** Panel background fill color. */
  fillColor: number;
  /** Outer border stroke color. */
  borderColor: number;
  /** Inner border stroke color. */
  innerBorderColor: number;
  /** Direction for wipe-in animation on pinned layout. 'none' = always slide from top. */
  wipeDirection: 'left' | 'right' | 'none';
  /** Default auto-hide duration in ms. */
  autoHideMs: number;
  /** Pulse tween duration (ms). */
  pulseDuration: number;
  /** Pulse tween target alpha. */
  pulseAlpha: number;
  /** Scan tween angle range (radians). */
  scanAngle: number;
  /** Scan tween duration (ms). */
  scanDuration: number;
}

export interface CommPanelOptions {
  width?: number;
  depth?: number;
  autoHideMs?: number;
}

/**
 * Shared base for all comm panels (Slick, Regent, Liaison).
 * Subclasses supply a portrait and a style config; all layout, animation,
 * and panel-drawing logic lives here.
 */
export class CommPanel {
  protected scene: Phaser.Scene;
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

  private readonly style: CommPanelStyle;

  constructor(
    scene: Phaser.Scene,
    style: CommPanelStyle,
    portrait: Phaser.GameObjects.Container,
    options: CommPanelOptions = {},
  ) {
    this.scene = scene;
    this.style = style;
    this.autoHideMs = options.autoHideMs ?? style.autoHideMs;
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

    this.portrait = portrait;
    this.portrait.setPosition(DEFAULT_COMM_PORTRAIT_X, this.panelHeight / 2);
    this.portrait.setScale(DEFAULT_COMM_PORTRAIT_SCALE);

    this.nameText = scene.add.text(DEFAULT_COMM_HEADER_X, DEFAULT_COMM_HEADER_Y, style.nameLabel, {
      fontFamily: style.nameFontFamily ?? UI_FONT,
      fontSize: readableFontSize(14),
      color: colorStr(style.nameColor),
    });

    this.text = scene.add.text(DEFAULT_COMM_HEADER_X, 0, '', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(15),
      color: colorStr(style.textColor),
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
      alpha: style.pulseAlpha,
      duration: style.pulseDuration,
      yoyo: true,
      repeat: -1,
      paused: true,
    });

    this.scanTween = scene.tweens.add({
      targets: this.portrait,
      angle: { from: -style.scanAngle, to: style.scanAngle },
      duration: style.scanDuration,
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

    if (this.wipeIn && this.style.wipeDirection !== 'none') {
      const startX = this.style.wipeDirection === 'left'
        ? -this.panelWidth - 20
        : getLayout().gameWidth + 20;
      this.root.setX(startX);
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
    if (this.style.wipeDirection !== 'none') this.wipeIn = true;
    this.root.setDepth(depth ?? this.root.depth);
    this.scene.tweens.killTweensOf(this.root);
    if (this.root.visible) this.root.setY(y);
  }

  setPinnedCompactLayout(y: number, depth?: number): void {
    this.bottomInset = null;
    this.setCompactLayout(true);
    this.currentY = y;
    if (this.style.wipeDirection !== 'none') this.wipeIn = true;
    this.root.setDepth(depth ?? this.root.depth);
    this.scene.tweens.killTweensOf(this.root);
    if (this.root.visible) this.root.setY(y);
  }

  setBottomPinnedLayout(bottomInset: number, depth?: number): void {
    this.bottomInset = bottomInset;
    this.setCompactLayout(true);
    this.wipeIn = false;
    this.root.setDepth(depth ?? this.root.depth);
    this.scene.tweens.killTweensOf(this.root);
    if (this.root.visible) this.root.setY(this.getTargetY());
  }

  resetLayout(): void {
    this.setPanelWidth(this.defaultPanelWidth);
    this.bottomInset = null;
    this.setCompactLayout(false);
    this.currentY = this.defaultY;
    if (this.style.wipeDirection !== 'none') this.wipeIn = true;
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
    this.panel.fillStyle(this.style.fillColor, panelAlpha);
    this.panel.lineStyle(1, this.style.borderColor, this.compactLayout ? 0.36 : 0.5);
    this.panel.fillRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);
    this.panel.strokeRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);
    this.panel.lineStyle(1, this.style.innerBorderColor, this.compactLayout ? 0.1 : 0.15);
    this.panel.strokeRoundedRect(4, 4, this.panelWidth - 8, this.panelHeight - 8, 6);

    this.portrait.setScale(portraitScale);
    this.portrait.setPosition(portraitX, this.panelHeight / 2);
    this.root.setSize(this.panelWidth, this.panelHeight);
  }
}
