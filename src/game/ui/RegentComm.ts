import Phaser from 'phaser';
import { getLayout } from '../layout';

const REGENT_COLOR = 0xff3366;
const REGENT_ACCENT = 0xff0044;

interface RegentCommOptions {
  width?: number;
  depth?: number;
  autoHideMs?: number;
}

export class RegentComm {
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
  private wipeIn = false;

  constructor(scene: Phaser.Scene, options: RegentCommOptions = {}) {
    this.scene = scene;
    this.autoHideMs = options.autoHideMs ?? 5600;
    const layout = getLayout();

    const width = options.width ?? Math.min(layout.gameWidth - 96, 368);
    const height = 60;
    const x = (layout.gameWidth - width) / 2;
    const y = 2;
    const depth = options.depth ?? 150;
    this.defaultY = y;
    this.defaultDepth = depth;
    this.currentY = y;

    const panel = scene.add.graphics();
    panel.fillStyle(0x180808, 0.92);
    panel.lineStyle(1, REGENT_COLOR, 0.5);
    panel.fillRoundedRect(0, 0, width, height, 8);
    panel.strokeRoundedRect(0, 0, width, height, 8);
    panel.lineStyle(1, REGENT_ACCENT, 0.15);
    panel.strokeRoundedRect(4, 4, width - 8, height - 8, 6);

    this.portrait = this.createPortrait(scene);
    this.portrait.setPosition(34, height / 2);
    this.portrait.setScale(0.72);

    this.nameText = scene.add.text(64, 7, 'REGENT // PATROL', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: `#${REGENT_COLOR.toString(16).padStart(6, '0')}`,
    });

    this.text = scene.add.text(64, 21, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: `#${REGENT_COLOR.toString(16).padStart(6, '0')}`,
      wordWrap: { width: width - 76 },
      lineSpacing: 1,
    });

    this.root = scene.add.container(x, y, [panel, this.portrait, this.nameText, this.text]);
    this.root.setDepth(depth);
    this.root.setAlpha(0);
    this.root.setVisible(false);

    this.pulseTween = scene.tweens.add({
      targets: this.portrait,
      alpha: 0.55,
      duration: 400,
      yoyo: true,
      repeat: -1,
      paused: true,
    });

    this.scanTween = scene.tweens.add({
      targets: this.portrait,
      angle: { from: -1.5, to: 1.5 },
      duration: 1400,
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
    this.root.setVisible(true);
    this.scene.tweens.killTweensOf(this.root);

    if (this.wipeIn) {
      // Horizontal wipe: slide from off-screen right into center
      const layout = getLayout();
      const width = Math.min(layout.gameWidth - 96, 368);
      this.root.setX(layout.gameWidth + 20);
      this.root.setY(this.currentY);
      this.root.setAlpha(1);
      this.scene.tweens.add({
        targets: this.root,
        x: (layout.gameWidth - width) / 2,
        duration: 280,
        ease: 'Back.Out',
      });
    } else {
      // Normal: slide down from top
      this.root.setY(this.currentY - 8);
      this.scene.tweens.add({
        targets: this.root,
        alpha: 1,
        y: this.currentY,
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
    this.scene.tweens.add({
      targets: this.root,
      alpha: 0,
      y: this.currentY - 8,
      duration: 200,
      ease: 'Sine.In',
      onComplete: () => {
        this.root.setVisible(false);
        this.wipeIn = false;
      },
    });
  }

  setPinnedLayout(y: number, depth?: number): void {
    this.currentY = y;
    this.wipeIn = true;
    this.root.setDepth(depth ?? this.root.depth);
    this.scene.tweens.killTweensOf(this.root);
    if (this.root.visible) {
      this.root.setY(y);
    }
  }

  resetLayout(): void {
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

  private createPortrait(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const glow = scene.add.graphics();
    glow.fillStyle(REGENT_COLOR, 0.08);
    glow.fillCircle(0, 0, 28);

    const head = scene.add.graphics();
    head.lineStyle(1.5, REGENT_COLOR, 0.75);
    head.beginPath();
    head.moveTo(0, -22);
    head.lineTo(18, -10);
    head.lineTo(18, 8);
    head.lineTo(10, 22);
    head.lineTo(-10, 22);
    head.lineTo(-18, 8);
    head.lineTo(-18, -10);
    head.closePath();
    head.strokePath();

    const circuits = scene.add.graphics();
    circuits.lineStyle(1, REGENT_COLOR, 0.2);
    circuits.lineBetween(-18, -10, -10, -4);
    circuits.lineBetween(18, -10, 10, -4);
    circuits.lineBetween(-18, 8, -10, 6);
    circuits.lineBetween(18, 8, 10, 6);
    circuits.lineBetween(0, -22, 0, -14);
    circuits.lineBetween(0, 16, 0, 22);
    circuits.lineStyle(1, REGENT_ACCENT, 0.12);
    circuits.lineBetween(-10, -4, 10, -4);

    const eyes = scene.add.graphics();
    eyes.fillStyle(REGENT_COLOR, 0.95);
    eyes.fillRect(-11, -8, 8, 2);
    eyes.fillRect(3, -8, 8, 2);
    eyes.fillStyle(REGENT_ACCENT, 1);
    eyes.fillRect(-6, -8, 3, 2);
    eyes.fillRect(5, -8, 3, 2);

    const nose = scene.add.graphics();
    nose.lineStyle(1, REGENT_COLOR, 0.35);
    nose.lineBetween(-3, 0, 0, 4);
    nose.lineBetween(0, 4, 3, 0);

    const mouth = scene.add.graphics();
    mouth.lineStyle(1.5, REGENT_COLOR, 0.7);
    mouth.lineBetween(-7, 10, 7, 10);
    mouth.lineStyle(1, REGENT_COLOR, 0.5);
    mouth.lineBetween(-7, 10, -9, 12);
    mouth.lineBetween(7, 10, 9, 12);

    const scanLine = scene.add.graphics();
    scanLine.lineStyle(1, REGENT_ACCENT, 0.1);
    scanLine.lineBetween(-18, 0, 18, 0);

    return scene.add.container(0, 0, [glow, head, circuits, eyes, nose, mouth, scanLine]);
  }
}
