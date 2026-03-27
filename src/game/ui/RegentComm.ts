import Phaser from 'phaser';
import { GAME_WIDTH } from '../constants';

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
  private readonly baseY: number;

  constructor(scene: Phaser.Scene, options: RegentCommOptions = {}) {
    this.scene = scene;
    this.autoHideMs = options.autoHideMs ?? 3600;

    const width = options.width ?? Math.min(GAME_WIDTH - 72, 360);
    const height = 70;
    const x = (GAME_WIDTH - width) / 2;
    const y = 8;
    const depth = options.depth ?? 150;
    this.baseY = y;

    const panel = scene.add.graphics();
    panel.fillStyle(0x180808, 0.92);
    panel.lineStyle(1, REGENT_COLOR, 0.5);
    panel.fillRoundedRect(0, 0, width, height, 8);
    panel.strokeRoundedRect(0, 0, width, height, 8);
    panel.lineStyle(1, REGENT_ACCENT, 0.15);
    panel.strokeRoundedRect(4, 4, width - 8, height - 8, 6);

    this.portrait = this.createPortrait(scene);
    this.portrait.setPosition(38, height / 2);
    this.portrait.setScale(0.82);

    this.nameText = scene.add.text(72, 10, 'REGENT // PATROL', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: `#${REGENT_COLOR.toString(16).padStart(6, '0')}`,
    });

    this.text = scene.add.text(72, 24, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: `#${REGENT_COLOR.toString(16).padStart(6, '0')}`,
      wordWrap: { width: width - 84 },
      lineSpacing: 2,
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
    this.root.setY(this.baseY - 8);
    this.root.setVisible(true);
    this.scene.tweens.killTweensOf(this.root);
    this.scene.tweens.add({
      targets: this.root,
      alpha: 1,
      y: this.baseY,
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
      y: this.baseY - 8,
      duration: 200,
      ease: 'Sine.In',
      onComplete: () => this.root.setVisible(false),
    });
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
