import type Phaser from 'phaser';
import { PHASE_LENGTH } from '../data/tuning';
import { ExitGate } from '../entities/ExitGate';

export class ExtractionSystem {
  private scene: Phaser.Scene;
  private phaseTimer = 0;
  private gate: ExitGate | null = null;
  private closingGate: ExitGate | null = null;
  private phaseCount = 1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  update(delta: number): void {
    this.phaseTimer += delta;
    // Clear previous frame's closing gate
    if (this.closingGate) {
      this.closingGate.destroy();
      this.closingGate = null;
    }

    // Update active gate
    if (this.gate) {
      this.gate.update(delta);
      if (!this.gate.active) {
        // Keep reference for one frame so extraction check can use final position
        this.closingGate = this.gate;
        this.gate = null;
        // Phase advances when gate closes
        this.phaseCount++;
        this.phaseTimer = 0;
      }
    }

    // Spawn gate at phase boundary
    if (!this.gate && !this.closingGate && this.phaseTimer >= PHASE_LENGTH) {
      this.gate = new ExitGate(this.scene);
    }
  }

  updateVisual(delta: number): void {
    this.gate?.updateVisual(delta);
  }

  /** Returns the gate that just closed this frame (if any). */
  getClosingGate(): ExitGate | null {
    return this.closingGate;
  }

  getGate(): ExitGate | null {
    return this.gate;
  }

  isGateActive(): boolean {
    return this.gate !== null && this.gate.active;
  }

  getTimeToGate(): number {
    if (this.gate) return 0;
    return Math.max(0, PHASE_LENGTH - this.phaseTimer);
  }

  getPhaseCount(): number {
    return this.phaseCount;
  }

  destroy(): void {
    if (this.gate) {
      this.gate.destroy();
      this.gate = null;
    }
    if (this.closingGate) {
      this.closingGate.destroy();
      this.closingGate = null;
    }
  }
}
