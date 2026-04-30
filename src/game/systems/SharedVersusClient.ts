import type {
  SharedClientMessage,
  SharedLaserLane,
  SharedServerMessage,
  SharedWorldSnapshot,
} from '../sharedVersus/types';

export type SharedVersusStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error';

export interface SharedVersusClientConfig {
  host: string;
  room: string;
  matchId: string;
  playerId: string;
  playerName: string;
}

type MessageListener = (message: SharedServerMessage) => void;
type StatusListener = (status: SharedVersusStatus) => void;

export class SharedVersusClient {
  private readonly config: SharedVersusClientConfig;
  private socket: WebSocket | null = null;
  private status: SharedVersusStatus = 'idle';
  private readonly messageListeners: MessageListener[] = [];
  private readonly statusListeners: StatusListener[] = [];
  private lastSnapshot: SharedWorldSnapshot | null = null;

  constructor(config: SharedVersusClientConfig) {
    this.config = config;
  }

  getStatus(): SharedVersusStatus {
    return this.status;
  }

  getSnapshot(): SharedWorldSnapshot | null {
    return this.lastSnapshot;
  }

  onMessage(listener: MessageListener): void {
    this.messageListeners.push(listener);
  }

  onStatus(listener: StatusListener): void {
    this.statusListeners.push(listener);
  }

  connect(): void {
    if (this.socket || this.status === 'connecting' || this.status === 'open') return;
    this.setStatus('connecting');
    const socket = new WebSocket(this.getUrl());
    this.socket = socket;
    socket.addEventListener('open', () => {
      this.setStatus('open');
      this.send({
        type: 'join',
        matchId: this.config.matchId,
        playerId: this.config.playerId,
        playerName: this.config.playerName,
      });
    });
    socket.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') return;
      const message = this.parse(event.data);
      if (!message) return;
      if (message.type === 'world_snapshot') {
        this.lastSnapshot = message;
      }
      for (const listener of this.messageListeners) listener(message);
    });
    socket.addEventListener('close', () => {
      this.socket = null;
      this.setStatus('closed');
    });
    socket.addEventListener('error', () => {
      this.setStatus('error');
    });
  }

  close(): void {
    const socket = this.socket;
    this.socket = null;
    if (socket && socket.readyState !== WebSocket.CLOSED) {
      socket.close();
    }
    this.setStatus('closed');
  }

  sendPose(x: number, y: number, angle: number, shielded: boolean): void {
    this.send({
      type: 'player_pose',
      playerId: this.config.playerId,
      x,
      y,
      angle,
      shielded,
    });
  }

  requestExtraction(): void {
    this.send({
      type: 'extract_request',
      playerId: this.config.playerId,
    });
  }

  fireLaser(lane: SharedLaserLane): void {
    this.send({
      type: 'fire_laser',
      playerId: this.config.playerId,
      lane,
    });
  }

  acknowledgeTerminal(): void {
    this.send({
      type: 'terminal_ack',
      playerId: this.config.playerId,
    });
  }

  private send(message: SharedClientMessage): void {
    const socket = this.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(message));
  }

  private parse(raw: string): SharedServerMessage | null {
    try {
      const parsed = JSON.parse(raw) as SharedServerMessage;
      return parsed && typeof parsed.type === 'string' ? parsed : null;
    } catch {
      return null;
    }
  }

  private getUrl(): string {
    const host = this.config.host.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '').replace(/\/$/, '');
    const protocol = this.config.host.startsWith('http://') || host.startsWith('localhost') || host.startsWith('127.0.0.1')
      ? 'ws'
      : 'wss';
    return `${protocol}://${host}/parties/main/${encodeURIComponent(this.config.room)}`;
  }

  private setStatus(status: SharedVersusStatus): void {
    if (this.status === status) return;
    this.status = status;
    for (const listener of this.statusListeners) listener(status);
  }
}

export function getSharedVersusHost(): string {
  const fromEnv = import.meta.env.VITE_SHARED_VERSUS_HOST;
  if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }
  try {
    const fromStorage = window.localStorage.getItem('ssmt_shared_versus_host');
    if (fromStorage && fromStorage.trim().length > 0) return fromStorage.trim();
  } catch {
    // localStorage may be unavailable in embedded shells.
  }
  return 'localhost:1999';
}

export function isSharedVersusEnabled(): boolean {
  const fromEnv = import.meta.env.VITE_SHARED_VERSUS;
  if (fromEnv === '1' || fromEnv === 'true') return true;
  try {
    return window.localStorage.getItem('ssmt_shared_versus') === '1';
  } catch {
    return false;
  }
}
