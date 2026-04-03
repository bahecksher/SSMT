import Phaser from 'phaser';
import { COLORS, UI_FONT, readableFontSize } from '../constants';
import { getLayout } from '../layout';

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

export function createSlickPortrait(scene: Phaser.Scene): Phaser.GameObjects.Container {
    // Outer glow
    const glow = scene.add.graphics();
    glow.fillStyle(COLORS.PLAYER, 0.06);
    glow.fillCircle(0, 0, 28);

    // Hexagonal head outline
    const head = scene.add.graphics();
    head.lineStyle(1.5, COLORS.PLAYER, 0.7);
    head.beginPath();
    head.moveTo(0, -22);
    head.lineTo(16, -12);
    head.lineTo(16, 12);
    head.lineTo(0, 22);
    head.lineTo(-16, 12);
    head.lineTo(-16, -12);
    head.closePath();
    head.strokePath();

    // Inner circuit lines
    const circuits = scene.add.graphics();
    circuits.lineStyle(1, COLORS.PLAYER, 0.25);
    circuits.lineBetween(-16, -12, -8, -6);
    circuits.lineBetween(16, -12, 8, -6);
    circuits.lineBetween(-16, 12, -8, 8);
    circuits.lineBetween(16, 12, 8, 8);
    // Vertical center line
    circuits.lineBetween(0, -22, 0, -14);
    circuits.lineBetween(0, 14, 0, 22);

    // Eyes — two horizontal bars
    const eyes = scene.add.graphics();
    eyes.fillStyle(COLORS.PLAYER, 0.95);
    eyes.fillRect(-10, -8, 6, 3);
    eyes.fillRect(4, -8, 6, 3);
    // Pupil dots
    eyes.fillStyle(COLORS.SALVAGE, 1);
    eyes.fillRect(-8, -7, 2, 1);
    eyes.fillRect(6, -7, 2, 1);

    // Nose — small chevron
    const nose = scene.add.graphics();
    nose.lineStyle(1, COLORS.PLAYER, 0.4);
    nose.lineBetween(-2, 0, 0, 3);
    nose.lineBetween(0, 3, 2, 0);

    // Mouth — equalizer bars (animated feel)
    const mouth = scene.add.graphics();
    mouth.fillStyle(COLORS.PLAYER, 0.7);
    mouth.fillRect(-8, 9, 3, 2);
    mouth.fillRect(-3, 9, 3, 3);
    mouth.fillRect(2, 9, 3, 2);
    mouth.fillRect(7, 9, 3, 4);

    // Scan line
    const scanLine = scene.add.graphics();
    scanLine.lineStyle(1, COLORS.PLAYER, 0.12);
    scanLine.lineBetween(-16, 0, 16, 0);

    return scene.add.container(0, 0, [glow, head, circuits, eyes, nose, mouth, scanLine]);
  }
