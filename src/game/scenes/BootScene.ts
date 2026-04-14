import Phaser from 'phaser';
import { GeoSphere } from '../entities/GeoSphere';
import { COLORS, SCENE_KEYS, TITLE_FONT, UI_FONT, readableFontSize } from '../constants';
import { getSlickLine } from '../data/slickLines';
import { getLayout, setLayoutSize } from '../layout';
import { preloadMusic } from '../systems/MusicSystem';
import { preloadSfx } from '../systems/SfxSystem';
import { HologramOverlay } from '../ui/HologramOverlay';

const BOOT_STARFIELD_OVERSCAN = 96;
const BOOT_STARFIELD_COUNT = 170;
const BOOT_BAR_HEIGHT = 18;
const BOOT_MESSAGE = 'Securing Connection';
const BOOT_MIN_DISPLAY_MS = 1500;

interface BootStar {
  x: number;
  y: number;
  speed: number;
  alpha: number;
  size: number;
  color: number;
  twinkle: number;
  twinkleSpeed: number;
}

export class BootScene extends Phaser.Scene {
  private loaderBarRect = { x: 0, y: 0, width: 0, height: BOOT_BAR_HEIGHT };
  private bootDisplayStartedAt = 0;
  private menuHandoffAt: number | null = null;
  private starfield!: Phaser.GameObjects.Graphics;
  private starfieldStars: BootStar[] = [];
  private geoSphere!: GeoSphere;
  private hologramOverlay!: HologramOverlay;
  private loaderPanel!: Phaser.GameObjects.Graphics;
  private loaderFrame!: Phaser.GameObjects.Graphics;
  private loaderFill!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private flavorText!: Phaser.GameObjects.Text;
  private currentProgress = 0;
  private fontsReady = false;
  private fontPromise: Promise<void> | null = null;

  constructor() {
    super(SCENE_KEYS.BOOT);
  }

  preload(): void {
    this.events.once('shutdown', this.cleanup, this);
    setLayoutSize(this.scale.width, this.scale.height);
    this.bootDisplayStartedAt = this.getNow();
    this.menuHandoffAt = null;
    this.createBackdrop();
    this.createLoaderUi();
    this.refreshLoaderProgress(0);
    this.startFontLoad();

    preloadMusic(this);
    preloadSfx(this);
  }

  create(): void {
    const startMenu = () => {
      setLayoutSize(this.scale.width, this.scale.height);
      this.scene.start(SCENE_KEYS.MENU, { bootTransition: true });
    };

    if (this.fontsReady) {
      this.scheduleMenuHandoff(startMenu);
      return;
    }

    if (this.fontPromise) {
      void this.fontPromise.then(() => {
        if (!this.sys.isActive()) return;
        this.scheduleMenuHandoff(startMenu);
      });
    } else {
      this.scheduleMenuHandoff(startMenu);
    }
  }

  update(_time: number, delta: number): void {
    this.updateStarfield(delta);
    this.updateLoaderProgress();
    this.geoSphere?.update(delta);
    this.hologramOverlay?.update(delta);
  }

  private createBackdrop(): void {
    const layout = getLayout();
    this.starfield = this.add.graphics().setDepth(-1);
    this.starfieldStars = [];
    for (let i = 0; i < BOOT_STARFIELD_COUNT; i++) {
      this.starfieldStars.push({
        x: Phaser.Math.Between(-BOOT_STARFIELD_OVERSCAN, layout.gameWidth + BOOT_STARFIELD_OVERSCAN),
        y: Phaser.Math.Between(-BOOT_STARFIELD_OVERSCAN, layout.gameHeight + BOOT_STARFIELD_OVERSCAN),
        speed: Phaser.Math.FloatBetween(2, 8),
        alpha: Phaser.Math.FloatBetween(0.08, 0.36),
        size: Phaser.Math.FloatBetween(0.6, 1.3),
        color: Math.random() < 0.68 ? COLORS.PLAYER : 0xffffff,
        twinkle: Phaser.Math.FloatBetween(0, Math.PI * 2),
        twinkleSpeed: Phaser.Math.FloatBetween(1.1, 2.5),
      });
    }
    this.drawStarfield();
    this.geoSphere = new GeoSphere(this);
    this.hologramOverlay = new HologramOverlay(this);
  }

  private createLoaderUi(): void {
    const layout = getLayout();
    const compact = layout.gameWidth <= 390 || layout.gameHeight <= 700;
    const panelWidth = Math.min(layout.gameWidth - 32, compact ? 348 : 460);
    const panelHeight = compact ? 154 : 164;
    const panelX = layout.centerX - panelWidth / 2;
    const panelY = layout.gameHeight * (compact ? 0.62 : 0.64) - panelHeight / 2;
    const uiDepth = 20;
    const gateColor = `#${COLORS.GATE.toString(16).padStart(6, '0')}`;
    const hudColor = `#${COLORS.HUD.toString(16).padStart(6, '0')}`;

    this.loaderPanel = this.add.graphics().setDepth(uiDepth);
    this.loaderPanel.fillStyle(COLORS.BG, 0.76);
    this.loaderPanel.lineStyle(1.1, COLORS.HUD, 0.3);
    this.loaderPanel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 14);
    this.loaderPanel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 14);
    this.loaderPanel.lineStyle(1, COLORS.GRID, 0.75);
    this.loaderPanel.strokeRoundedRect(panelX + 4, panelY + 4, panelWidth - 8, panelHeight - 8, 12);

    this.titleText = this.add.text(layout.centerX, panelY + 22, BOOT_MESSAGE, {
      fontFamily: TITLE_FONT,
      fontSize: readableFontSize(compact ? 16 : 18),
      color: gateColor,
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(uiDepth + 1).setAlpha(0);
    this.fitSingleLineText(this.titleText, panelWidth - 48, compact ? 12 : 14);

    this.flavorText = this.add.text(layout.centerX, this.titleText.y + this.titleText.height + 12, getSlickLine('menuIntro'), {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(compact ? 15 : 17),
      color: hudColor,
      align: 'center',
    }).setOrigin(0.5, 0).setDepth(uiDepth + 1).setAlpha(0);
    this.fitSingleLineText(this.flavorText, panelWidth - 56, compact ? 9 : 10);

    const barWidth = panelWidth - (compact ? 44 : 52);
    const barX = layout.centerX - barWidth / 2;
    const barY = this.flavorText.y + this.flavorText.height + (compact ? 16 : 18);
    this.loaderBarRect = { x: barX, y: barY, width: barWidth, height: BOOT_BAR_HEIGHT };
    this.loaderFrame = this.add.graphics().setDepth(uiDepth + 1);
    this.loaderFrame.fillStyle(COLORS.BG, 0.92);
    this.loaderFrame.lineStyle(1.2, COLORS.HUD, 0.36);
    this.loaderFrame.fillRoundedRect(barX, barY, barWidth, BOOT_BAR_HEIGHT, 8);
    this.loaderFrame.strokeRoundedRect(barX, barY, barWidth, BOOT_BAR_HEIGHT, 8);
    this.loaderFrame.lineStyle(1, COLORS.GATE, 0.2);
    this.loaderFrame.strokeRoundedRect(barX + 3, barY + 3, barWidth - 6, BOOT_BAR_HEIGHT - 6, 6);

    this.loaderFill = this.add.graphics().setDepth(uiDepth + 2);

    const accent = this.add.graphics().setDepth(uiDepth + 1);
    accent.lineStyle(1.25, COLORS.GATE, 0.6);
    accent.lineBetween(panelX + 16, panelY + 18, panelX + 44, panelY + 18);
    accent.lineBetween(panelX + 16, panelY + 18, panelX + 16, panelY + 46);
    accent.lineBetween(panelX + panelWidth - 16, panelY + 18, panelX + panelWidth - 44, panelY + 18);
    accent.lineBetween(panelX + panelWidth - 16, panelY + 18, panelX + panelWidth - 16, panelY + 46);
  }

  private startFontLoad(): void {
    if (typeof document === 'undefined' || !('fonts' in document)) {
      this.fontsReady = true;
      this.titleText?.setAlpha(1);
      this.flavorText?.setAlpha(0.82);
      return;
    }

    this.fontPromise = Promise.allSettled([
      document.fonts.load('16px "FreePixel"'),
      document.fonts.load('16px "pixel_lcd"'),
    ]).then(() => {
      if (!this.sys.isActive()) return;
      this.fontsReady = true;
      this.titleText?.setStyle({ fontFamily: TITLE_FONT });
      this.titleText?.setAlpha(1);
      this.flavorText?.setAlpha(0.82);
    });
  }

  private scheduleMenuHandoff(startMenu: () => void): void {
    const handoffAt = Math.max(this.bootDisplayStartedAt + BOOT_MIN_DISPLAY_MS, this.getNow());
    this.menuHandoffAt = handoffAt;
    const delay = Math.max(0, handoffAt - this.getNow());
    if (delay <= 0) {
      this.refreshLoaderProgress(1);
      startMenu();
      return;
    }

    this.time.delayedCall(delay, () => {
      if (!this.sys.isActive()) {
        return;
      }

      this.refreshLoaderProgress(1);
      startMenu();
    });
  }

  private updateLoaderProgress(): void {
    const now = this.getNow();
    const elapsed = now - this.bootDisplayStartedAt;
    let targetProgress: number;

    if (this.menuHandoffAt !== null) {
      const totalDuration = Math.max(1, this.menuHandoffAt - this.bootDisplayStartedAt);
      targetProgress = Phaser.Math.Clamp(elapsed / totalDuration, 0, 1);
    } else {
      targetProgress = Phaser.Math.Clamp((elapsed / BOOT_MIN_DISPLAY_MS) * 0.95, 0, 0.95);
    }

    const easedProgress = Phaser.Math.Linear(this.currentProgress, targetProgress, 0.18);
    if (Math.abs(easedProgress - targetProgress) < 0.002) {
      this.refreshLoaderProgress(targetProgress);
      return;
    }

    this.refreshLoaderProgress(easedProgress);
  }

  private refreshLoaderProgress(progress: number): void {
    this.currentProgress = Phaser.Math.Clamp(progress, 0, 1);
    this.redrawLoaderFill();
  }

  private redrawLoaderFill(): void {
    if (!this.loaderFill || !this.loaderFrame) {
      return;
    }

    const frameBounds = this.loaderBarRect;
    const inset = 4;
    const fillWidth = Math.max(0, (frameBounds.width - inset * 2) * this.currentProgress);
    const fillHeight = frameBounds.height - inset * 2;
    this.loaderFill.clear();
    if (fillWidth <= 0 || fillHeight <= 0) {
      return;
    }

    this.loaderFill.fillStyle(COLORS.PLAYER, 0.2);
    this.loaderFill.fillRoundedRect(frameBounds.x + inset, frameBounds.y + inset, fillWidth, fillHeight, 6);
    if (fillWidth > 18) {
      this.loaderFill.fillStyle(COLORS.GATE, 0.78);
      this.loaderFill.fillRoundedRect(frameBounds.x + inset, frameBounds.y + inset, fillWidth - 18, fillHeight, 6);
    }
    const highlightWidth = Math.min(22, fillWidth);
    if (highlightWidth > 0) {
      this.loaderFill.fillStyle(COLORS.SALVAGE, 0.95);
      this.loaderFill.fillRoundedRect(
        Math.max(frameBounds.x + inset, frameBounds.x + inset + fillWidth - highlightWidth),
        frameBounds.y + inset,
        highlightWidth,
        fillHeight,
        6,
      );
    }
  }

  private fitSingleLineText(text: Phaser.GameObjects.Text, maxWidth: number, minFontSize: number): void {
    let fontSize = Number.parseFloat(String(text.style.fontSize));
    if (!Number.isFinite(fontSize)) {
      return;
    }

    text.setScale(1);
    while (text.width > maxWidth && fontSize > minFontSize) {
      fontSize -= 1;
      text.setFontSize(`${fontSize}px`);
    }

    if (text.width > maxWidth && text.width > 0) {
      const scale = maxWidth / text.width;
      text.setScale(scale);
    }
  }

  private updateStarfield(delta: number): void {
    if (!this.starfield) {
      return;
    }

    const layout = getLayout();
    const dt = delta / 1000;
    for (const star of this.starfieldStars) {
      star.x -= star.speed * dt;
      star.twinkle += star.twinkleSpeed * dt;
      if (star.x < -BOOT_STARFIELD_OVERSCAN - star.size) {
        star.x = layout.gameWidth + BOOT_STARFIELD_OVERSCAN + star.size;
        star.y = Phaser.Math.Between(-BOOT_STARFIELD_OVERSCAN, layout.gameHeight + BOOT_STARFIELD_OVERSCAN);
      }
    }
    this.drawStarfield();
  }

  private drawStarfield(): void {
    const layout = getLayout();
    this.starfield.clear();
    this.starfield.fillStyle(COLORS.STARFIELD_BG, 1);
    this.starfield.fillRect(
      -BOOT_STARFIELD_OVERSCAN,
      -BOOT_STARFIELD_OVERSCAN,
      layout.gameWidth + BOOT_STARFIELD_OVERSCAN * 2,
      layout.gameHeight + BOOT_STARFIELD_OVERSCAN * 2,
    );
    for (const star of this.starfieldStars) {
      const twinkleAlpha = Phaser.Math.Clamp(star.alpha + Math.sin(star.twinkle) * 0.08, 0.05, 0.44);
      this.starfield.fillStyle(star.color, twinkleAlpha);
      this.starfield.fillCircle(star.x, star.y, star.size);
    }
  }

  private getNow(): number {
    if (typeof performance !== 'undefined') {
      return performance.now();
    }

    return Date.now();
  }

  private cleanup(): void {
    this.hologramOverlay?.destroy();
    this.geoSphere?.destroy();
    this.starfield?.destroy();
    this.menuHandoffAt = null;
  }
}
