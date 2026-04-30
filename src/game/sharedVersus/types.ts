export type SharedPlayerStatus = 'active' | 'extracted' | 'dead' | 'left';

export type SharedLaserLane = 'top' | 'middle' | 'bottom' | 'left' | 'center' | 'right';

export interface SharedPlayerState {
  id: string;
  name: string;
  x: number;
  y: number;
  angle: number;
  shielded: boolean;
  status: SharedPlayerStatus;
  score: number;
  terminalTime: number | null;
}

export interface SharedDrifterState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  radiusScale: number;
  mineable: boolean;
  hp: number;
  maxHp: number;
  depleted: boolean;
}

export interface SharedSalvageState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rare: boolean;
  hp: number;
  maxHp: number;
  depleted: boolean;
}

export interface SharedLaserState {
  id: string;
  lane: SharedLaserLane;
  axis: 'h' | 'v';
  pos: number;
  width: number;
  lethal: boolean;
  remainingMs: number;
}

export interface SharedGateState {
  x: number;
  y: number;
  radius: number;
  extractable: boolean;
  timeRemaining: number;
  phase: number;
}

export interface SharedWorldSnapshot {
  type: 'world_snapshot';
  matchId: string;
  tick: number;
  timeMs: number;
  phase: number;
  players: SharedPlayerState[];
  drifters: SharedDrifterState[];
  salvage: SharedSalvageState[];
  lasers: SharedLaserState[];
  gate: SharedGateState | null;
}

export type SharedClientMessage =
  | {
      type: 'join';
      matchId: string;
      playerId: string;
      playerName: string;
    }
  | {
      type: 'player_pose';
      playerId: string;
      x: number;
      y: number;
      angle: number;
      shielded: boolean;
    }
  | {
      type: 'extract_request';
      playerId: string;
    }
  | {
      type: 'fire_laser';
      playerId: string;
      lane: SharedLaserLane;
    }
  | {
      type: 'terminal_ack';
      playerId: string;
    };

export type SharedServerMessage =
  | {
      type: 'welcome';
      matchId: string;
      playerId: string;
      serverTimeMs: number;
    }
  | SharedWorldSnapshot
  | {
      type: 'score_delta';
      playerId: string;
      salvage: number;
      mining: number;
      totalScore: number;
    }
  | {
      type: 'player_terminal';
      playerId: string;
      status: 'extracted' | 'dead';
      score: number;
      timeMs: number;
      cause?: 'asteroid' | 'laser' | 'enemy';
    }
  | {
      type: 'peer_left';
      playerId: string;
    };

export interface SharedWorldConfig {
  matchId: string;
  seed?: number;
}
