import Phaser from 'phaser';
import { COLORS } from '../constants';
import { COMPANY_IDS, COMPANIES } from '../data/companyData';
import type { CorporationLeaderboardEntry } from '../services/LeaderboardService';
import type { CompanyId } from '../types';

const TAU = Math.PI * 2;
const RING_DEBRIS_COLOR = 0xc7d2de;
const GLOBE_SPIN_RATE = 0.006 / 1000;
const DEBRIS_SPIN_RATE = 0.00006;
const SLICE_GAP_ANGLE = 0.03;

interface CorporationScoreGraphOptions {
  x: number;
  y: number;
  radius: number;
  depth?: number;
  entries: CorporationLeaderboardEntry[];
}

interface SliceEntry {
  companyId: CompanyId;
  totalScore: number;
}

export class CorporationScoreGraph {
  private readonly root: Phaser.GameObjects.Container;
  private readonly chartBaseGraphic: Phaser.GameObjects.Graphics;
  private readonly debrisGraphic: Phaser.GameObjects.Graphics;
  private readonly chartOverlayGraphic: Phaser.GameObjects.Graphics;
  private readonly globeGraphic: Phaser.GameObjects.Graphics;
  private readonly outerRadius: number;
  private readonly innerRadius: number;
  private readonly globeRadius: number;
  private readonly slices: SliceEntry[];
  private spin = 0;
  private debrisSpin = 0;

  constructor(scene: Phaser.Scene, options: CorporationScoreGraphOptions) {
    this.outerRadius = options.radius;
    this.innerRadius = Math.round(options.radius * 0.7);
    this.globeRadius = Math.round(this.innerRadius * 0.7);

    const totals = new Map<CompanyId, number>();
    for (const companyId of COMPANY_IDS) {
      totals.set(companyId, 0);
    }
    for (const entry of options.entries) {
      totals.set(entry.companyId, Math.max(0, Math.floor(entry.totalScore)));
    }
    this.slices = COMPANY_IDS
      .map((companyId) => ({
        companyId,
        totalScore: totals.get(companyId) ?? 0,
      }))
      .filter((entry) => entry.totalScore > 0)
      .sort((a, b) => b.totalScore - a.totalScore);

    this.root = scene.add.container(options.x, options.y).setDepth(options.depth ?? 10);
    this.chartBaseGraphic = scene.add.graphics();
    this.debrisGraphic = scene.add.graphics();
    this.chartOverlayGraphic = scene.add.graphics();
    this.globeGraphic = scene.add.graphics();
    this.root.add([this.chartBaseGraphic, this.debrisGraphic, this.chartOverlayGraphic, this.globeGraphic]);

    this.drawChartBase();
    this.drawDebris();
    this.drawChartOverlay();
    this.drawGlobe();
  }

  update(delta: number): void {
    this.spin += delta * GLOBE_SPIN_RATE;
    this.debrisSpin += delta * DEBRIS_SPIN_RATE;
    this.drawDebris();
    this.drawGlobe();
  }

  getBottomY(): number {
    return this.root.y + this.outerRadius + 4;
  }

  destroy(): void {
    this.root.destroy(true);
  }

  private drawChartBase(): void {
    const g = this.chartBaseGraphic;
    g.clear();

    g.fillStyle(COLORS.BG, 0.78);
    g.fillCircle(0, 0, this.outerRadius + 6);
    this.forEachSliceSegment((slice, segmentStart, segmentEnd) => {
      const company = COMPANIES[slice.companyId];
      g.fillStyle(company.color, 0.08);
      g.beginPath();
      g.arc(0, 0, this.outerRadius, segmentStart, segmentEnd, false);
      g.arc(0, 0, this.innerRadius, segmentEnd, segmentStart, true);
      g.closePath();
      g.fillPath();
    });
  }

  private drawDebris(): void {
    const g = this.debrisGraphic;
    g.clear();
    this.forEachSliceSegment((slice, segmentStart, segmentEnd) => {
      const company = COMPANIES[slice.companyId];
      this.drawSliceDebris(g, segmentStart, segmentEnd, company.color, company.accent);
    });
  }

  private drawChartOverlay(): void {
    const g = this.chartOverlayGraphic;
    g.clear();

    g.lineStyle(1.1, COLORS.HUD, 0.2);
    g.strokeCircle(0, 0, this.outerRadius + 6);
    g.lineStyle(1, COLORS.GRID, 0.2);
    g.strokeCircle(0, 0, this.outerRadius + 1);

    this.forEachSliceSegment((slice, segmentStart, segmentEnd) => {
      const company = COMPANIES[slice.companyId];
      g.lineStyle(1.2, company.color, 0.86);
      g.beginPath();
      g.arc(0, 0, this.outerRadius, segmentStart, segmentEnd, false);
      g.strokePath();

      g.lineStyle(1, company.accent, 0.42);
      g.beginPath();
      g.arc(0, 0, this.innerRadius, segmentStart, segmentEnd, false);
      g.strokePath();

      const midAngle = (segmentStart + segmentEnd) / 2;
      const markerRadius = this.outerRadius + 4;
      const markerX = Math.cos(midAngle) * markerRadius;
      const markerY = Math.sin(midAngle) * markerRadius;
      g.fillStyle(company.color, 0.95);
      g.fillCircle(markerX, markerY, 2.5);
    });

    g.fillStyle(COLORS.BG, 0.92);
    g.fillCircle(0, 0, this.innerRadius - 2);
    g.lineStyle(1, COLORS.HUD, 0.16);
    g.strokeCircle(0, 0, this.innerRadius - 2);
  }

  private drawSliceDebris(
    g: Phaser.GameObjects.Graphics,
    startAngle: number,
    endAngle: number,
    edgeColor: number,
    accentColor: number,
  ): void {
    const span = endAngle - startAngle;
    const bandWidth = this.outerRadius - this.innerRadius;
    const midRadius = (this.outerRadius + this.innerRadius) * 0.5;
    const dustCount = Math.max(18, Math.floor((midRadius * span) / 2.8));
    const shardCount = Math.max(6, Math.floor((midRadius * span) / 7.5));
    const dustOffset = Phaser.Math.Wrap(this.debrisSpin, 0, span);
    const shardOffset = Phaser.Math.Wrap(this.debrisSpin * 0.58 + span * 0.13, 0, span);

    for (let i = 0; i < dustCount; i += 1) {
      const t = dustCount <= 1 ? 0.5 : (i + 0.5) / dustCount;
      const angle = startAngle + Phaser.Math.Wrap(span * t + dustOffset, 0, span);
      const radialT = 0.18 + ((Math.sin(i * 0.61 + 1.3) + 1) * 0.5) * 0.64;
      const radius = this.innerRadius + bandWidth * radialT;
      const baseX = Math.cos(angle) * radius;
      const baseY = Math.sin(angle) * radius;
      const tx = -Math.sin(angle);
      const ty = Math.cos(angle);
      const nx = Math.cos(angle);
      const ny = Math.sin(angle);
      const alpha = 0.05 + ((Math.sin(i * 0.63 + 0.9) + 1) * 0.5) * 0.12;
      const size = 0.24 + ((Math.sin(i * 0.91 + 0.4) + 1) * 0.5) * Math.max(0.24, bandWidth * 0.045);

      g.fillStyle(RING_DEBRIS_COLOR, alpha);
      g.fillCircle(baseX, baseY, size);

      const companionOffset = (((Math.sin(i * 1.41 + 0.2) + 1) * 0.5) - 0.5) * bandWidth * 0.14;
      g.fillCircle(
        baseX + nx * companionOffset + tx * size * 0.45,
        baseY + ny * companionOffset + ty * size * 0.45,
        size * 0.5,
      );

      if (i % 3 === 0) {
        g.fillCircle(baseX - tx * size * 0.8, baseY - ty * size * 0.8, size * 0.32);
      }

      if (i % 10 === 0) {
        g.fillStyle(accentColor, 0.14);
        g.fillCircle(baseX + tx * size * 0.8, baseY + ty * size * 0.8, size * 0.3);
      }
    }

    for (let i = 0; i < shardCount; i += 1) {
      const t = shardCount <= 1 ? 0.5 : (i + 0.35) / shardCount;
      const angle = startAngle + Phaser.Math.Wrap(span * t + shardOffset, 0, span);
      const radialT = 0.14 + ((Math.sin(i * 0.87 + 1.1) + 1) * 0.5) * 0.72;
      const radius = this.innerRadius + bandWidth * radialT;
      const baseX = Math.cos(angle) * radius;
      const baseY = Math.sin(angle) * radius;
      const tx = -Math.sin(angle);
      const ty = Math.cos(angle);
      const nx = Math.cos(angle);
      const ny = Math.sin(angle);
      const alpha = 0.08 + ((Math.sin(i * 0.52 + 0.6) + 1) * 0.5) * 0.11;
      const size = 0.4 + ((Math.sin(i * 0.59 + 2.3) + 1) * 0.5) * Math.max(0.28, bandWidth * 0.04);
      const shardLen = size * (1.35 + ((Math.sin(i * 0.37 + 0.2) + 1) * 0.5) * 1.2);
      const shardHalf = size * 0.2;
      const skew = (((Math.sin(i * 0.51 + 2.1) + 1) * 0.5) - 0.5) * size * 0.24;

      g.fillStyle(RING_DEBRIS_COLOR, alpha * 0.88);
      g.beginPath();
      g.moveTo(baseX - tx * shardLen * 0.6 - nx * shardHalf, baseY - ty * shardLen * 0.6 - ny * shardHalf);
      g.lineTo(baseX - tx * shardLen * 0.12 + nx * (shardHalf + skew), baseY - ty * shardLen * 0.12 + ny * (shardHalf + skew));
      g.lineTo(baseX + tx * shardLen * 0.82 + nx * shardHalf * 0.18, baseY + ty * shardLen * 0.82 + ny * shardHalf * 0.18);
      g.lineTo(baseX + tx * shardLen * 0.08 - nx * (shardHalf - skew), baseY + ty * shardLen * 0.08 - ny * (shardHalf - skew));
      g.closePath();
      g.fillPath();

      if (i % 2 === 0) {
        g.lineStyle(0.6, RING_DEBRIS_COLOR, alpha * 0.82);
        g.lineBetween(
          baseX - tx * size * 0.95,
          baseY - ty * size * 0.95,
          baseX + tx * size * 1.45,
          baseY + ty * size * 1.45,
        );
      }

      if (i % 4 === 0) {
        g.lineStyle(0.55, edgeColor, 0.18);
        g.lineBetween(
          baseX - nx * size * 0.45,
          baseY - ny * size * 0.45,
          baseX + nx * size * 0.45,
          baseY + ny * size * 0.45,
        );
      }
    }
  }

  private getTotalScore(): number {
    return this.slices.reduce((sum, entry) => sum + entry.totalScore, 0);
  }

  private forEachSliceSegment(
    render: (slice: SliceEntry, segmentStart: number, segmentEnd: number) => void,
  ): void {
    const total = this.getTotalScore();
    if (total <= 0) {
      return;
    }

    let startAngle = -Math.PI / 2;
    for (const slice of this.slices) {
      const fraction = slice.totalScore / total;
      const fullSpan = fraction * TAU;
      const endAngle = startAngle + fullSpan;
      const segmentStart = startAngle + Math.min(SLICE_GAP_ANGLE * 0.5, fullSpan * 0.2);
      const segmentEnd = endAngle - Math.min(SLICE_GAP_ANGLE * 0.5, fullSpan * 0.2);
      if (segmentEnd > segmentStart) {
        render(slice, segmentStart, segmentEnd);
      }
      startAngle = endAngle;
    }
  }

  private drawGlobe(): void {
    const g = this.globeGraphic;
    g.clear();

    const r = this.globeRadius;
    const hazard = COLORS.HAZARD;
    const highlight = 0xffffff;

    g.fillStyle(hazard, 0.12);
    g.fillCircle(0, 0, r);
    g.lineStyle(1.25, hazard, 0.82);
    g.strokeCircle(0, 0, r);
    g.lineStyle(1, highlight, 0.1);
    g.strokeCircle(0, 0, r * 0.94);

    const meridianOffsets = [0, Math.PI / 3, (Math.PI * 2) / 3];
    for (const offset of meridianOffsets) {
      const phase = this.spin + offset;
      const width = Math.max(r * 0.18, Math.abs(Math.cos(phase)) * r);
      const alpha = 0.14 + Math.abs(Math.cos(phase)) * 0.26;
      g.lineStyle(1, hazard, alpha);
      g.strokeEllipse(0, 0, width * 2, r * 2);
    }

    const latitudeBands = [-0.58, -0.24, 0, 0.24, 0.58];
    for (const band of latitudeBands) {
      const bandScale = Math.cos(band * Math.PI * 0.5);
      const y = Math.sin(band * Math.PI * 0.5) * r * 0.95;
      g.lineStyle(1, hazard, band === 0 ? 0.28 : 0.18);
      g.strokeEllipse(0, y, r * 2 * bandScale, Math.max(4, r * 0.16 * bandScale));
    }

    const highlightX = Math.cos(this.spin * 1.35) * r * 0.28;
    g.fillStyle(highlight, 0.14);
    g.fillCircle(highlightX, -r * 0.3, r * 0.16);

    g.lineStyle(1.1, hazard, 0.34);
    g.beginPath();
    g.moveTo(-r * 0.42, -r * 0.08);
    g.lineTo(-r * 0.16, -r * 0.28);
    g.lineTo(r * 0.1, -r * 0.16);
    g.lineTo(r * 0.34, r * 0.08);
    g.strokePath();

    g.beginPath();
    g.moveTo(-r * 0.3, r * 0.12);
    g.lineTo(-r * 0.05, r * 0.28);
    g.lineTo(r * 0.22, r * 0.2);
    g.strokePath();
  }
}
