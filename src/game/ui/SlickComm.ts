import Phaser from 'phaser';
import { COLORS, GAME_WIDTH } from '../constants';

interface SlickCommOptions {
  width?: number;
  depth?: number;
  autoHideMs?: number;
}

export class SlickComm {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private portrait: Phaser.GameObjects.Container;
  private text: Phaser.GameObjects.Text;
  private nameText: Phaser.GameObjects.Text;
  private hideTimer: Phaser.Time.TimerEvent | null = null;
  private pulseTween: Phaser.Tweens.Tween;
  private scanTween: Phaser.Tweens.Tween;
  private autoHideMs: number;
  private readonly defaultY: number;
  private readonly defaultDepth: number;
  private currentY: number;

  constructor(scene: Phaser.Scene, options: SlickCommOptions = {}) {
    this.scene = scene;
    this.autoHideMs = options.autoHideMs ?? 3200;

    const width = options.width ?? Math.min(GAME_WIDTH - 72, 360);
    const height = 70;
    const x = (GAME_WIDTH - width) / 2;
    const y = 8;
    const depth = options.depth ?? 150;
    this.defaultY = y;
    this.defaultDepth = depth;
    this.currentY = y;

    const panel = scene.add.graphics();
    panel.fillStyle(0x03110e, 0.92);
    panel.lineStyle(1, COLORS.HUD, 0.5);
    panel.fillRoundedRect(0, 0, width, height, 8);
    panel.strokeRoundedRect(0, 0, width, height, 8);
    // Inner border
    panel.lineStyle(1, COLORS.PLAYER, 0.15);
    panel.strokeRoundedRect(4, 4, width - 8, height - 8, 6);

    this.portrait = this.createPortrait(scene);
    this.portrait.setPosition(38, height / 2);
    this.portrait.setScale(0.82);

    this.nameText = scene.add.text(72, 10, 'SLICK // OPS', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
    });

    this.text = scene.add.text(72, 24, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      wordWrap: { width: width - 84 },
      lineSpacing: 2,
    });

    this.root = scene.add.container(x, y, [panel, this.portrait, this.nameText, this.text]);
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
    this.root.setY(this.currentY - 8);
    this.root.setVisible(true);
    this.scene.tweens.killTweensOf(this.root);
    this.scene.tweens.add({
      targets: this.root,
      alpha: 1,
      y: this.currentY,
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
    this.scene.tweens.add({
      targets: this.root,
      alpha: 0,
      y: this.currentY - 8,
      duration: 200,
      ease: 'Sine.In',
      onComplete: () => this.root.setVisible(false),
    });
  }

  setPinnedLayout(y: number, depth?: number): void {
    this.currentY = y;
    this.root.setDepth(depth ?? this.root.depth);
    this.scene.tweens.killTweensOf(this.root);
    if (this.root.visible) {
      this.root.setY(y);
    }
  }

  resetLayout(): void {
    this.currentY = this.defaultY;
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

  private createPortrait(scene: Phaser.Scene): Phaser.GameObjects.Container {
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
}
