import Phaser from 'phaser';
import { getLayout } from '../layout';
import type { CompanyDef } from '../data/companyData';

interface LiaisonCommOptions {
  width?: number;
  depth?: number;
  autoHideMs?: number;
}

/**
 * Parameterized comm panel for company liaison NPCs.
 * Portrait shape varies by company; colors come from CompanyDef.
 */
export class LiaisonComm {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private portrait: Phaser.GameObjects.Container;
  private text: Phaser.GameObjects.Text;
  private hideTimer: Phaser.Time.TimerEvent | null = null;
  private pulseTween: Phaser.Tweens.Tween;
  private scanTween: Phaser.Tweens.Tween;
  private autoHideMs: number;
  private readonly defaultY: number;
  private currentY: number;

  constructor(scene: Phaser.Scene, company: CompanyDef, options: LiaisonCommOptions = {}) {
    this.scene = scene;
    this.autoHideMs = options.autoHideMs ?? 5400;
    const layout = getLayout();

    const width = options.width ?? Math.min(layout.gameWidth - 96, 368);
    const height = 60;
    const x = (layout.gameWidth - width) / 2;
    const y = 2;
    const depth = options.depth ?? 148;
    this.defaultY = y;
    this.currentY = y;

    const panelBg = darkenColor(company.color, 0.15);

    const panel = scene.add.graphics();
    panel.fillStyle(panelBg, 0.92);
    panel.lineStyle(1, company.color, 0.5);
    panel.fillRoundedRect(0, 0, width, height, 8);
    panel.strokeRoundedRect(0, 0, width, height, 8);
    panel.lineStyle(1, company.accent, 0.15);
    panel.strokeRoundedRect(4, 4, width - 8, height - 8, 6);

    this.portrait = this.createPortrait(scene, company);
    this.portrait.setPosition(34, height / 2);
    this.portrait.setScale(0.72);

    const nameText = scene.add.text(64, 7, company.liaisonTitle, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: colorStr(company.color),
    });

    this.text = scene.add.text(64, 21, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: colorStr(company.color),
      wordWrap: { width: width - 76 },
      lineSpacing: 1,
    });

    this.root = scene.add.container(x, y, [panel, this.portrait, nameText, this.text]);
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
    this.root.setVisible(true);
    this.scene.tweens.killTweensOf(this.root);

    // Slide down from top
    this.root.setY(this.currentY - 8);
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
    if (this.root.visible) this.root.setY(y);
  }

  resetLayout(): void {
    this.currentY = this.defaultY;
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

  private createPortrait(scene: Phaser.Scene, company: CompanyDef): Phaser.GameObjects.Container {
    return createLiaisonPortrait(scene, company);
  }
}

/** Shared portrait factory — used by LiaisonComm and MissionSelectScene. */
function createLiaisonPortrait(scene: Phaser.Scene, company: CompanyDef): Phaser.GameObjects.Container {
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
