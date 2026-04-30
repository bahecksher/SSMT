import Phaser from 'phaser';
import { COLORS, SCENE_KEYS, TITLE_FONT, UI_FONT, applyColorPalette, readableFontSize } from '../constants';
import { getLayout, isNarrowViewport, isShortViewport, setLayoutSize } from '../layout';
import { getTopNavMetrics } from '../ui/menuLayout';
import { getSettings } from '../systems/SettingsSystem';
import { playUiSelectSfx } from '../systems/SfxSystem';
import { HologramOverlay } from '../ui/HologramOverlay';
import { CustomCursor } from '../ui/CustomCursor';

interface Page {
  title: string;
  body: string[];
}

interface HowToPlaySceneData {
  pageIndex?: number;
}

const PAGES: Page[] = [
  {
    title: 'MOVE',
    body: [
      'DESKTOP // POINT WITH MOUSE — SHIP TRACKS THE CURSOR.',
      'TOUCH   // DRAG ANYWHERE TO STEER. LONGER DRAG = FASTER BURN.',
      'NO BRAKES. DRIFT IS REAL. PLAN YOUR TURNS.',
      '',
      'WATCH FOR HAZARDS // ASTEROIDS, ENEMY SHIPS, BEAM CANNONS, BOSSES.',
      'A SHIELD ABSORBS ONE HIT, THEN DROPS. PICK UP NEW SHIELDS WHEN YOU CAN.',
    ],
  },
  {
    title: 'EXTRACT',
    body: [
      'FLY OVER SALVAGE DEBRIS TO MINE CREDITS. CREDITS ARE UNBANKED UNTIL YOU EXTRACT.',
      'DIE WITH UNBANKED CREDITS // YOU LOSE THEM ALL.',
      '',
      'EVERY 30 SECONDS A GATE OPENS. FLY THROUGH IT TO BANK YOUR CREDITS AND END THE RUN.',
      'PUSH FURTHER FOR HIGHER PHASES, BIGGER PAYOUTS, MEANER ENEMIES.',
      '',
      'CAMPAIGN MODE GIVES YOU 2 LIVES PER CAMPAIGN — RUNS STACK INTO ONE LEADERBOARD ENTRY.',
      'QUICK PLAY IS ONE LIFE, ONE RUN, ONE SHOT AT THE BOARD.',
    ],
  },
  {
    title: 'REP',
    body: [
      'PICK A CORP AT THE MAIN MENU. THEIR BONUS APPLIES TO YOUR RUNS.',
      '',
      'DEEPCORE  // MINING YIELD UP',
      'RECLAIM   // SALVAGE YIELD UP',
      'IRONVEIL  // BANKED SCORE MULTIPLIER',
      'FREEPORT  // BONUS DROP RATE UP',
      '',
      'COMPLETE MISSIONS, EXTRACT, AND BANK CREDITS TO GAIN REP.',
      'IRONVEIL WORK COSTS REP WITH RIVAL CORPS. BETRAYAL HAS A PRICE.',
      'DIE WITHOUT EXTRACTING // FREEPORT DOCKS YOU REP.',
    ],
  },
];

export class HowToPlayScene extends Phaser.Scene {
  private pageIndex = 0;
  private pageObjects: Phaser.GameObjects.GameObject[] = [];
  private hologramOverlay!: HologramOverlay;
  private cursor!: CustomCursor;
  private prevButton!: { bg: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text; hit: Phaser.GameObjects.Zone };
  private nextButton!: { bg: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text; hit: Phaser.GameObjects.Zone };
  private tutorialButton!: { bg: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text; hit: Phaser.GameObjects.Zone };
  private pageDots: Phaser.GameObjects.Graphics[] = [];
  private backButtonBg!: Phaser.GameObjects.Graphics;
  private backButtonLabel!: Phaser.GameObjects.Text;
  private backButtonHit!: Phaser.GameObjects.Zone;
  private titleText!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.HOW_TO_PLAY);
  }

  create(data?: HowToPlaySceneData): void {
    this.events.once('shutdown', this.cleanup, this);
    setLayoutSize(this.scale.width, this.scale.height);
    applyColorPalette(getSettings().paletteId);
    this.hologramOverlay = new HologramOverlay(this);
    this.cursor = new CustomCursor(this);
    this.pageIndex = Phaser.Math.Clamp(data?.pageIndex ?? 0, 0, PAGES.length - 1);

    const layout = getLayout();
    const compact = isNarrowViewport(layout) || isShortViewport(layout);
    const titleSize = readableFontSize(compact ? 22 : 28);
    const subtitleSize = readableFontSize(compact ? 14 : 16);
    const buttonHeight = compact ? 36 : 42;
    const buttonWidth = compact ? 110 : 140;
    const tutorialWidth = compact ? 132 : 170;
    const sideMargin = Math.max(24, Math.round(layout.gameWidth * 0.06));

    this.add.text(layout.centerX, layout.gameHeight * 0.08, 'HOW TO PLAY', {
      fontFamily: TITLE_FONT,
      fontSize: titleSize,
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(10);

    this.titleText = this.add.text(layout.centerX, layout.gameHeight * 0.16, '', {
      fontFamily: TITLE_FONT,
      fontSize: subtitleSize,
      color: `#${COLORS.GATE.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(10);

    // Prev / Next buttons at the bottom
    const navY = layout.gameHeight - buttonHeight - 24;
    this.prevButton = this.createButton(sideMargin + buttonWidth / 2, navY, buttonWidth, buttonHeight, 'PREV', () => this.changePage(-1));
    this.nextButton = this.createButton(layout.gameWidth - sideMargin - buttonWidth / 2, navY, buttonWidth, buttonHeight, 'NEXT', () => this.changePage(1));
    this.tutorialButton = this.createButton(layout.centerX, navY, tutorialWidth, buttonHeight, compact ? 'TUTORIAL' : 'TUTORIAL ARENA', () => {
      playUiSelectSfx(this);
      this.scene.start(SCENE_KEYS.TUTORIAL_ARENA, { returnPageIndex: this.pageIndex });
    });

    // Back button top-left — shared corner-button metrics
    const nav = getTopNavMetrics(layout);
    const backButton = this.createButton(nav.leftCenterX, nav.centerY, nav.width, nav.height, 'BACK', () => this.exit(), nav.fontSizePx);
    this.backButtonBg = backButton.bg;
    this.backButtonLabel = backButton.label;
    this.backButtonHit = backButton.hit;

    // Page dots
    const dotsY = layout.gameHeight - 8 - buttonHeight - 8;
    const dotSpacing = 18;
    const dotsTotalWidth = (PAGES.length - 1) * dotSpacing;
    for (let i = 0; i < PAGES.length; i++) {
      const dot = this.add.graphics().setDepth(10);
      dot.x = layout.centerX - dotsTotalWidth / 2 + i * dotSpacing;
      dot.y = dotsY;
      this.pageDots.push(dot);
    }

    this.renderPage();

    this.input.keyboard?.on('keydown-LEFT', () => this.changePage(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.changePage(1));
    this.input.keyboard?.on('keydown-ESC', () => this.exit());
  }

  update(_time: number, delta: number): void {
    this.hologramOverlay.update(delta);
    this.cursor.update(this);
  }

  private renderPage(): void {
    for (const obj of this.pageObjects) obj.destroy();
    this.pageObjects = [];

    const layout = getLayout();
    const page = PAGES[this.pageIndex];
    const compact = isNarrowViewport(layout) || isShortViewport(layout);
    const bodySize = readableFontSize(compact ? 12 : 14);
    const lineGap = compact ? 6 : 8;
    const startY = layout.gameHeight * 0.28;
    const sideMargin = Math.max(24, Math.round(layout.gameWidth * 0.08));
    const wrapWidth = layout.gameWidth - sideMargin * 2;

    this.titleText.setText(`// ${page.title}`);

    let y = startY;
    for (const line of page.body) {
      const text = this.add.text(layout.centerX, y, line, {
        fontFamily: UI_FONT,
        fontSize: bodySize,
        color: line === '' ? `#${COLORS.HUD.toString(16).padStart(6, '0')}` : `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
        align: 'center',
        wordWrap: { width: wrapWidth, useAdvancedWrap: true },
      }).setOrigin(0.5, 0).setDepth(10).setAlpha(line === '' ? 0 : 0.92);
      this.pageObjects.push(text);
      y += text.height + lineGap;
    }

    // Update dots
    for (let i = 0; i < this.pageDots.length; i++) {
      const dot = this.pageDots[i];
      dot.clear();
      const active = i === this.pageIndex;
      dot.fillStyle(active ? COLORS.GATE : COLORS.HUD, active ? 0.95 : 0.4);
      dot.fillCircle(0, 0, active ? 5 : 3);
    }

    // Update prev/next visibility
    this.setButtonEnabled(this.prevButton, this.pageIndex > 0);
    const isLast = this.pageIndex === PAGES.length - 1;
    this.nextButton.label.setText(isLast ? 'DONE' : 'NEXT');
  }

  private changePage(delta: number): void {
    const next = this.pageIndex + delta;
    if (next < 0) return;
    if (next >= PAGES.length) {
      this.exit();
      return;
    }
    this.pageIndex = next;
    playUiSelectSfx(this);
    this.renderPage();
  }

  private exit(): void {
    playUiSelectSfx(this);
    this.scene.start(SCENE_KEYS.MENU);
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onClick: () => void,
    fontSizePx = 13,
  ): { bg: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text; hit: Phaser.GameObjects.Zone } {
    const bg = this.add.graphics().setDepth(10);
    this.drawButton(bg, x, y, width, height, true);
    const labelText = this.add.text(x, y, label, {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(fontSizePx),
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(11);
    const hit = this.add.zone(x - width / 2, y - height / 2, width, height).setOrigin(0, 0).setDepth(12).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      onClick();
    });
    return { bg, label: labelText, hit };
  }

  private drawButton(bg: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, enabled: boolean): void {
    bg.clear();
    bg.fillStyle(COLORS.BG, 0.6);
    bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
    bg.lineStyle(1.5, COLORS.HUD, enabled ? 0.7 : 0.2);
    bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 8);
  }

  private setButtonEnabled(
    button: { bg: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text; hit: Phaser.GameObjects.Zone },
    enabled: boolean,
  ): void {
    button.label.setAlpha(enabled ? 0.95 : 0.3);
    button.hit.input!.enabled = enabled;
    const w = (button.hit.input?.hitArea as Phaser.Geom.Rectangle)?.width ?? 0;
    const h = (button.hit.input?.hitArea as Phaser.Geom.Rectangle)?.height ?? 0;
    if (w > 0 && h > 0) {
      this.drawButton(button.bg, button.hit.x + w / 2, button.hit.y + h / 2, w, h, enabled);
    }
  }

  private cleanup(): void {
    for (const obj of this.pageObjects) obj.destroy();
    this.pageObjects = [];
    for (const dot of this.pageDots) dot.destroy();
    this.pageDots = [];
    this.titleText?.destroy();
    this.prevButton?.bg.destroy();
    this.prevButton?.label.destroy();
    this.prevButton?.hit.destroy();
    this.nextButton?.bg.destroy();
    this.nextButton?.label.destroy();
    this.nextButton?.hit.destroy();
    this.tutorialButton?.bg.destroy();
    this.tutorialButton?.label.destroy();
    this.tutorialButton?.hit.destroy();
    this.backButtonBg?.destroy();
    this.backButtonLabel?.destroy();
    this.backButtonHit?.destroy();
    this.hologramOverlay?.destroy();
    this.cursor?.destroy(this);
    this.input.keyboard?.removeAllListeners();
  }
}
