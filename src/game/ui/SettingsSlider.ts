import Phaser from 'phaser';
import { COLORS, UI_FONT, readableFontSize } from '../constants';

interface SettingsSliderOptions {
  scene: Phaser.Scene;
  left: number;
  y: number;
  width: number;
  depth: number;
  initialValue: number;
  accentColor?: number;
  fontSize?: string;
  onChange: (value: number) => void;
}

function clamp01(value: number): number {
  return Phaser.Math.Clamp(value, 0, 1);
}

export class SettingsSlider {
  private scene: Phaser.Scene;
  private left: number;
  private y: number;
  private width: number;
  private depth: number;
  private accentColor: number;
  private valueText: Phaser.GameObjects.Text;
  private graphics: Phaser.GameObjects.Graphics;
  private hit: Phaser.GameObjects.Zone;
  private onChange: (value: number) => void;
  private value = 0;

  constructor(options: SettingsSliderOptions) {
    this.scene = options.scene;
    this.left = options.left;
    this.y = options.y;
    this.width = options.width;
    this.depth = options.depth;
    this.accentColor = options.accentColor ?? 0x44ff88;
    this.onChange = options.onChange;

    this.graphics = this.scene.add.graphics().setDepth(this.depth);
    this.valueText = this.scene.add.text(this.left + this.width + 22, this.y, '0%', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(options.fontSize ?? 11),
      color: `#${this.accentColor.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(this.depth + 1);

    this.hit = this.scene.add.zone(this.left, this.y - 15, this.width, 30)
      .setOrigin(0, 0)
      .setDepth(this.depth + 2)
      .setInteractive({ useHandCursor: true });

    this.hit.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.setFromLocalX(localX, true);
      },
    );

    this.hit.on(
      'pointermove',
      (pointer: Phaser.Input.Pointer, localX: number) => {
        if (!pointer.isDown) return;
        this.setFromLocalX(localX, true);
      },
    );

    this.setValue(options.initialValue);
  }

  getObjects(): Phaser.GameObjects.GameObject[] {
    return [this.graphics, this.valueText, this.hit];
  }

  setValue(value: number): void {
    this.value = clamp01(value);
    this.redraw();
  }

  setVisible(visible: boolean): void {
    this.graphics.setVisible(visible);
    this.valueText.setVisible(visible);
    this.hit.setVisible(visible);
    if (this.hit.input) {
      this.hit.input.enabled = visible;
    }
  }

  destroy(): void {
    this.graphics.destroy();
    this.valueText.destroy();
    this.hit.destroy();
  }

  private setFromLocalX(localX: number, emitChange: boolean): void {
    const raw = this.width <= 0 ? 0 : localX / this.width;
    const nextValue = Math.round(clamp01(raw) * 100) / 100;
    if (nextValue === this.value) {
      return;
    }

    this.value = nextValue;
    this.redraw();
    if (emitChange) {
      this.onChange(this.value);
    }
  }

  private redraw(): void {
    const fillWidth = this.width * this.value;
    const trackTop = this.y - 3;
    const knobX = this.left + fillWidth;

    this.graphics.clear();
    this.graphics.fillStyle(COLORS.BG, 0.9);
    this.graphics.lineStyle(1, COLORS.HUD, 0.26);
    this.graphics.fillRoundedRect(this.left, trackTop, this.width, 6, 3);
    this.graphics.strokeRoundedRect(this.left, trackTop, this.width, 6, 3);

    this.graphics.fillStyle(this.accentColor, 0.18);
    this.graphics.fillRoundedRect(this.left, trackTop, this.width, 6, 3);

    if (fillWidth > 0) {
      this.graphics.fillStyle(this.accentColor, 0.95);
      this.graphics.fillRoundedRect(this.left, trackTop, fillWidth, 6, 3);
    }

    this.graphics.fillStyle(COLORS.BG, 1);
    this.graphics.lineStyle(1.2, this.accentColor, 0.92);
    this.graphics.fillCircle(knobX, this.y, 6);
    this.graphics.strokeCircle(knobX, this.y, 6);

    this.valueText.setText(`${Math.round(this.value * 100)}%`);
  }
}
