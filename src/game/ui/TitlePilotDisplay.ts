import Phaser from 'phaser';
import { COLORS } from '../constants';

type Vec3 = { x: number; y: number; z: number };
type ProjectedVertex = Vec3 & { screenX: number; screenY: number };

type FaceDefinition = {
  indices: number[];
  fillColor: number;
  fillAlpha: number;
  strokeColor: number;
  strokeAlpha: number;
};

const MODEL_VERTICES: Vec3[] = [
  { x: 0, y: -1.72, z: 0.24 },
  { x: -0.92, y: 0.68, z: 0.3 },
  { x: 0.92, y: 0.68, z: 0.3 },
  { x: 0, y: -1.34, z: -0.46 },
  { x: -0.56, y: 1.12, z: -0.46 },
  { x: 0.56, y: 1.12, z: -0.46 },
];

export class TitlePilotDisplay {
  private readonly graphic: Phaser.GameObjects.Graphics;
  private readonly size: number;
  private spinAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
  private bobPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);

  constructor(scene: Phaser.Scene, x: number, y: number, size: number) {
    this.graphic = scene.add.graphics().setPosition(x, y);
    this.size = size;
    this.draw();
  }

  setDepth(depth: number): this {
    this.graphic.setDepth(depth);
    return this;
  }

  setAlpha(alpha: number): this {
    this.graphic.setAlpha(alpha);
    return this;
  }

  update(delta: number): void {
    this.spinAngle += delta * 0.00032;
    this.bobPhase += delta * 0.0011;
    this.draw();
  }

  destroy(): void {
    this.graphic.destroy();
  }

  private draw(): void {
    const g = this.graphic;
    g.clear();

    const yaw = this.spinAngle;
    const pitch = -0.28 + Math.sin(this.bobPhase) * 0.08;
    const roll = Math.sin(this.spinAngle * 0.55) * 0.14;
    const projected = MODEL_VERTICES.map((vertex) => this.projectVertex(vertex, yaw, pitch, roll));
    const lineWidth = Math.max(1.1, this.size * 0.045);

    g.lineStyle(1, COLORS.PLAYER, 0.08);
    g.strokeEllipse(0, 0, this.size * 3.2, this.size * 1.7);
    g.lineStyle(1, COLORS.HUD, 0.06);
    g.strokeEllipse(0, this.size * 0.14, this.size * 2.45, this.size * 1.05);

    const faces: FaceDefinition[] = [
      {
        indices: [3, 5, 4],
        fillColor: COLORS.BG,
        fillAlpha: 0.34,
        strokeColor: COLORS.HUD,
        strokeAlpha: 0.18,
      },
      {
        indices: [0, 3, 4, 1],
        fillColor: COLORS.HUD,
        fillAlpha: 0.08,
        strokeColor: COLORS.HUD,
        strokeAlpha: 0.34,
      },
      {
        indices: [0, 2, 5, 3],
        fillColor: COLORS.PLAYER,
        fillAlpha: 0.1,
        strokeColor: COLORS.PLAYER,
        strokeAlpha: 0.38,
      },
      {
        indices: [1, 4, 5, 2],
        fillColor: COLORS.GLOBE,
        fillAlpha: 0.08,
        strokeColor: COLORS.GLOBE,
        strokeAlpha: 0.24,
      },
      {
        indices: [0, 1, 2],
        fillColor: COLORS.PLAYER,
        fillAlpha: 0.18,
        strokeColor: COLORS.PLAYER,
        strokeAlpha: 0.82,
      },
    ];

    const orderedFaces = faces
      .map((face) => ({
        ...face,
        depth: face.indices.reduce((sum, index) => sum + projected[index].z, 0) / face.indices.length,
      }))
      .sort((a, b) => a.depth - b.depth);

    for (const face of orderedFaces) {
      this.drawFace(
        face.indices.map((index) => projected[index]),
        face.fillColor,
        face.fillAlpha,
        face.strokeColor,
        face.strokeAlpha,
        lineWidth,
      );
    }

    const nose = projected[0];
    const rearCenter = this.average(projected[4], projected[5]);
    const frontCenter = this.average(projected[1], projected[2]);
    const backNose = projected[3];

    g.lineStyle(lineWidth, COLORS.GATE, 0.42);
    g.beginPath();
    g.moveTo(nose.screenX, nose.screenY);
    g.lineTo(rearCenter.screenX, rearCenter.screenY);
    g.strokePath();

    g.lineStyle(Math.max(1, lineWidth * 0.8), COLORS.HUD, 0.34);
    g.beginPath();
    g.moveTo(frontCenter.screenX, frontCenter.screenY);
    g.lineTo(backNose.screenX, backNose.screenY);
    g.strokePath();

    g.fillStyle(COLORS.PLAYER, 0.65);
    g.fillCircle(nose.screenX, nose.screenY, Math.max(1.5, this.size * 0.06));
    g.fillStyle(COLORS.GATE, 0.35);
    g.fillCircle(rearCenter.screenX, rearCenter.screenY, Math.max(1.4, this.size * 0.05));
  }

  private drawFace(
    points: ProjectedVertex[],
    fillColor: number,
    fillAlpha: number,
    strokeColor: number,
    strokeAlpha: number,
    lineWidth: number,
  ): void {
    const g = this.graphic;
    g.fillStyle(fillColor, fillAlpha);
    g.lineStyle(lineWidth, strokeColor, strokeAlpha);
    g.beginPath();
    g.moveTo(points[0].screenX, points[0].screenY);
    for (let i = 1; i < points.length; i++) {
      g.lineTo(points[i].screenX, points[i].screenY);
    }
    g.closePath();
    g.fillPath();
    g.strokePath();
  }

  private projectVertex(vertex: Vec3, yaw: number, pitch: number, roll: number): ProjectedVertex {
    const rolled = this.rotateZ(vertex, roll);
    const pitched = this.rotateX(rolled, pitch);
    const yawed = this.rotateY(pitched, yaw);
    const perspective = 4.8 / (4.8 - yawed.z);

    return {
      ...yawed,
      screenX: yawed.x * this.size * perspective,
      screenY: yawed.y * this.size * perspective,
    };
  }

  private rotateX(vertex: Vec3, angle: number): Vec3 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: vertex.x,
      y: vertex.y * cos - vertex.z * sin,
      z: vertex.y * sin + vertex.z * cos,
    };
  }

  private rotateY(vertex: Vec3, angle: number): Vec3 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: vertex.x * cos + vertex.z * sin,
      y: vertex.y,
      z: vertex.z * cos - vertex.x * sin,
    };
  }

  private rotateZ(vertex: Vec3, angle: number): Vec3 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: vertex.x * cos - vertex.y * sin,
      y: vertex.x * sin + vertex.y * cos,
      z: vertex.z,
    };
  }

  private average(a: ProjectedVertex, b: ProjectedVertex): ProjectedVertex {
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      z: (a.z + b.z) / 2,
      screenX: (a.screenX + b.screenX) / 2,
      screenY: (a.screenY + b.screenY) / 2,
    };
  }
}
