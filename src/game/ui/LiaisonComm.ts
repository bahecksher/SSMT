import Phaser from 'phaser';
import { UI_FONT, readableFontSize } from '../constants';
import { getLayout } from '../layout';
import type { CompanyDef } from '../data/companyData';

interface LiaisonCommOptions {
  width?: number;
  depth?: number;
  autoHideMs?: number;
}

const COMM_HEADER_X = 76;
const COMM_HEADER_Y = 8;
const COMM_PORTRAIT_X = 38;
const COMM_MIN_HEIGHT = 96;
const COMM_TEXT_GAP = 6;
const COMM_RIGHT_PADDING = 16;
const COMM_BOTTOM_PADDING = 14;

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
  private readonly panelColor: number;
  private readonly accentColor: number;
  private readonly panelWidth: number;
  private currentY: number;
  private panelHeight: number;

  constructor(scene: Phaser.Scene, company: CompanyDef, options: LiaisonCommOptions = {}) {
    this.scene = scene;
    this.autoHideMs = options.autoHideMs ?? 5400;
    const layout = getLayout();

    this.panelWidth = options.width ?? Math.min(layout.gameWidth - 96, 368);
    this.panelHeight = COMM_MIN_HEIGHT;
    const x = (layout.gameWidth - this.panelWidth) / 2;
    const y = 2;
    const depth = options.depth ?? 148;
    this.defaultY = y;
    this.currentY = y;
    this.panelColor = company.color;
    this.accentColor = company.accent;

    this.panel = scene.add.graphics();

    this.portrait = this.createPortrait(scene, company);
    this.portrait.setPosition(COMM_PORTRAIT_X, this.panelHeight / 2);
    this.portrait.setScale(0.74);

    this.nameText = scene.add.text(COMM_HEADER_X, COMM_HEADER_Y, company.liaisonTitle, {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(14),
      color: colorStr(company.color),
    });

    this.text = scene.add.text(COMM_HEADER_X, 0, '', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(15),
      color: colorStr(company.color),
      wordWrap: { width: this.panelWidth - COMM_HEADER_X - COMM_RIGHT_PADDING },
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

  getPanelHeight(): number {
    return this.panelHeight;
  }

  private redrawPanel(): void {
    const panelBg = darkenColor(this.panelColor, 0.15);
    const bodyY = this.nameText.y + this.nameText.height + COMM_TEXT_GAP;
    this.text.setPosition(COMM_HEADER_X, bodyY);
    this.panelHeight = Math.max(COMM_MIN_HEIGHT, Math.ceil(bodyY + this.text.height + COMM_BOTTOM_PADDING));

    this.panel.clear();
    this.panel.fillStyle(panelBg, 0.92);
    this.panel.lineStyle(1, this.panelColor, 0.5);
    this.panel.fillRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);
    this.panel.strokeRoundedRect(0, 0, this.panelWidth, this.panelHeight, 8);
    this.panel.lineStyle(1, this.accentColor, 0.15);
    this.panel.strokeRoundedRect(4, 4, this.panelWidth - 8, this.panelHeight - 8, 6);

    this.portrait.setPosition(COMM_PORTRAIT_X, this.panelHeight / 2);
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
