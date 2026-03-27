import { BEAM_WIDTH, PLAYER_RADIUS } from '../data/tuning';
import { pointInPolygon } from '../utils/collision';
import type { Player } from '../entities/Player';
import type { DrifterHazard } from '../entities/DrifterHazard';
import type { BeamHazard } from '../entities/BeamHazard';
import type { EnemyShip } from '../entities/EnemyShip';

export class CollisionSystem {
  private player: Player;

  constructor(player: Player) {
    this.player = player;
  }

  /** Returns the first drifter whose polygon contains the player center, or null. */
  checkDrifters(drifters: DrifterHazard[]): DrifterHazard | null {
    for (const drifter of drifters) {
      if (!drifter.active) continue;

      if (pointInPolygon(this.player.x, this.player.y, drifter.getWorldVertices())) {
        return drifter;
      }
    }

    return null;
  }

  checkBeams(beams: BeamHazard[]): boolean {
    const killDist = BEAM_WIDTH / 2 + PLAYER_RADIUS;

    for (const beam of beams) {
      if (!beam.active || !beam.isLethal()) continue;

      // For axis-aligned beams, distance check is simple
      if (beam.isHorizontal) {
        const dist = Math.abs(this.player.y - beam.y1);
        if (dist < killDist) return true;
      } else {
        const dist = Math.abs(this.player.x - beam.x1);
        if (dist < killDist) return true;
      }
    }

    return false;
  }

  /** Returns the first enemy whose polygon contains the player center, or null. */
  checkEnemies(enemies: EnemyShip[]): EnemyShip | null {
    for (const enemy of enemies) {
      if (!enemy.active) continue;

      if (pointInPolygon(this.player.x, this.player.y, enemy.getWorldVertices())) {
        return enemy;
      }
    }
    return null;
  }

  destroy(): void {
    // No cleanup needed
  }
}
