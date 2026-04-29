import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

export type NetStatus = 'idle' | 'joining' | 'subscribed' | 'closed' | 'error';

export interface PeerPresence {
  playerId: string;
  playerName: string;
  ready: boolean;
  joinedAt: number;
}

export interface MatchStartPayload {
  matchId: string;
  delayMs: number;
}

export const NET_EVENT = {
  MATCH_START: 'match_start',
  MATCH_CANCEL: 'match_cancel',
  SNAPSHOT: 'snapshot',
  MATCH_EXTRACT: 'match_extract',
  MATCH_DEATH: 'match_death',
  MATCH_REMATCH_READY: 'match_rematch_ready',
  MATCH_REMATCH_CANCEL: 'match_rematch_cancel',
  MATCH_RESULT_PULSE: 'match_result_pulse',
} as const;

/** Sender extracted. `time` = ms since match start (same clock as MirrorSnapshot.t). `rep` reserved for future rep-flux summary. */
export interface MatchExtractPayload {
  score: number;
  time: number;
  rep?: number;
}

/** Sender died. `time` = ms since match start (same clock as MirrorSnapshot.t). */
export interface MatchDeathPayload {
  score: number;
  time: number;
  cause: 'asteroid' | 'enemy' | 'laser';
}

export interface MultiplayerHandoff {
  session: NetSession;
  role: 'host' | 'guest';
  matchId: string;
  peerId: string;
  startAt: number;
}

export interface MirrorSnapshot {
  /** ms since match start (sender clock). */
  t: number;
  /**
   * Ship coords are arena-relative fractions: x = (worldX - arenaLeft) / arenaWidth,
   * y = (worldY - arenaTop) / arenaHeight. Receiver maps fractions into its own
   * mirror viewport, so peers with different screen sizes still align.
   * angle is sender heading in radians.
   */
  ship: {
    x: number;
    y: number;
    angle: number;
    alive: boolean;
    shielded: boolean;
  };
  /** Enemy x/y are arena-relative fractions, same convention as ship. */
  enemies: Array<{ x: number; y: number; type: number }>;
  score: number;
  phase: number;
  extracted: boolean;
}

const ROOM_CODE_ALPHABET = 'ACDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 4;
const PLAYER_ID_LENGTH = 8;

export function generateRoomCode(): string {
  let out = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    out += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }
  return out;
}

export function generatePlayerId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = 'p_';
  for (let i = 0; i < PLAYER_ID_LENGTH; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function normalizeRoomCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, ROOM_CODE_LENGTH);
}

export function isValidRoomCode(code: string): boolean {
  if (code.length !== ROOM_CODE_LENGTH) return false;
  for (const ch of code) {
    if (!ROOM_CODE_ALPHABET.includes(ch)) return false;
  }
  return true;
}

type BroadcastListener = (payload: unknown) => void;
type PresenceListener = (peers: PeerPresence[]) => void;
type StatusListener = (status: NetStatus) => void;

export class NetSession {
  readonly roomCode: string;
  readonly playerId: string;
  readonly playerName: string;
  readonly joinedAt: number;

  private channel: RealtimeChannel | null = null;
  private status: NetStatus = 'idle';
  private localReady = false;
  private broadcastListeners = new Map<string, BroadcastListener[]>();
  private presenceListeners: PresenceListener[] = [];
  private statusListeners: StatusListener[] = [];

  constructor(roomCode: string, playerId: string, playerName: string) {
    this.roomCode = roomCode;
    this.playerId = playerId;
    this.playerName = playerName;
    this.joinedAt = Date.now();
  }

  onBroadcast(event: string, cb: BroadcastListener): void {
    const existing = this.broadcastListeners.get(event);
    const list = existing ?? [];
    list.push(cb);
    this.broadcastListeners.set(event, list);
    // If channel is already live and this is the first listener for this event,
    // bind it now. Pre-join listeners are bound inside join().
    if (!existing && this.channel && this.status === 'subscribed') {
      this.bindBroadcastEvent(this.channel, event);
    }
  }

  private bindBroadcastEvent(channel: RealtimeChannel, event: string): void {
    channel.on('broadcast', { event }, (msg) => {
      const env = msg as { payload?: unknown };
      const list = this.broadcastListeners.get(event);
      if (!list) return;
      for (const cb of list) cb(env.payload);
    });
  }

  onPresence(cb: PresenceListener): void {
    this.presenceListeners.push(cb);
  }

  onStatus(cb: StatusListener): void {
    this.statusListeners.push(cb);
  }

  getStatus(): NetStatus {
    return this.status;
  }

  /**
   * Register all `onBroadcast` listeners BEFORE calling join().
   * Supabase realtime expects channel.on() bindings to be added before subscribe().
   */
  async join(): Promise<void> {
    if (this.status === 'subscribed' || this.status === 'joining') return;
    this.setStatus('joining');

    const channelName = `versus-${this.roomCode}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false, ack: false },
        presence: { key: this.playerId },
      },
    });
    this.channel = channel;

    channel.on('presence', { event: 'sync' }, () => this.emitPresence());
    channel.on('presence', { event: 'join' }, () => this.emitPresence());
    channel.on('presence', { event: 'leave' }, () => this.emitPresence());

    for (const event of this.broadcastListeners.keys()) {
      this.bindBroadcastEvent(channel, event);
    }

    await new Promise<void>((resolve, reject) => {
      channel.subscribe((subStatus) => {
        if (subStatus === 'SUBSCRIBED') {
          this.setStatus('subscribed');
          channel
            .track({
              playerId: this.playerId,
              playerName: this.playerName,
              ready: this.localReady,
              joinedAt: this.joinedAt,
            })
            .catch(() => {
              /* presence track failure is non-fatal; presence will retry on next setReady */
            });
          resolve();
          return;
        }
        if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT') {
          this.setStatus('error');
          reject(new Error(`Realtime subscribe failed: ${subStatus}`));
          return;
        }
        if (subStatus === 'CLOSED') {
          this.setStatus('closed');
        }
      });
    });
  }

  async setReady(ready: boolean): Promise<void> {
    this.localReady = ready;
    if (!this.channel || this.status !== 'subscribed') return;
    await this.channel.track({
      playerId: this.playerId,
      playerName: this.playerName,
      ready,
      joinedAt: this.joinedAt,
    });
  }

  async broadcast<T>(event: string, payload: T): Promise<void> {
    if (!this.channel || this.status !== 'subscribed') return;
    await this.channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  }

  getPeers(): PeerPresence[] {
    if (!this.channel) return [];
    const state = this.channel.presenceState() as Record<string, Array<Record<string, unknown>>>;
    const out: PeerPresence[] = [];
    for (const key of Object.keys(state)) {
      const entries = state[key];
      if (!entries || entries.length === 0) continue;
      // Phoenix Presence appends a new meta on each track() call; the latest
      // entry is at the end of the array.
      const e = entries[entries.length - 1];
      out.push({
        playerId: typeof e.playerId === 'string' ? e.playerId : key,
        playerName: typeof e.playerName === 'string' && e.playerName.trim().length > 0
          ? e.playerName.trim()
          : (typeof e.playerId === 'string' ? e.playerId : key),
        ready: e.ready === true,
        joinedAt: typeof e.joinedAt === 'number' ? e.joinedAt : 0,
      });
    }
    return out;
  }

  /** Returns the peer (not self), or null if no other peer is present. */
  getPeer(): PeerPresence | null {
    for (const peer of this.getPeers()) {
      if (peer.playerId !== this.playerId) return peer;
    }
    return null;
  }

  /**
   * Deterministic host election: smallest playerId (lexicographic) wins.
   * Both clients see the same presence set after sync and arrive at the same answer.
   * Pure string compare — no dependency on presence-payload number serialization.
   */
  isHost(): boolean {
    let smallest = this.playerId;
    for (const peer of this.getPeers()) {
      if (peer.playerId < smallest) smallest = peer.playerId;
    }
    return smallest === this.playerId;
  }

  /**
   * Drop all listeners but keep the channel + bindings alive. Used when the
   * scene is unmounting but a successor scene will reuse the session (e.g.,
   * versus rematch). Empties the per-event listener arrays in place so existing
   * `channel.on('broadcast')` callbacks become no-ops; new `onBroadcast` calls
   * append to the same arrays without triggering a duplicate channel binding.
   */
  clearListeners(): void {
    for (const list of this.broadcastListeners.values()) {
      list.length = 0;
    }
    this.presenceListeners = [];
    this.statusListeners = [];
  }

  async leave(): Promise<void> {
    const channel = this.channel;
    this.channel = null;
    this.broadcastListeners.clear();
    this.presenceListeners = [];
    if (channel) {
      try {
        await channel.untrack();
      } catch {
        /* ignore */
      }
      try {
        await supabase.removeChannel(channel);
      } catch {
        /* ignore */
      }
    }
    this.setStatus('closed');
    this.statusListeners = [];
  }

  private emitPresence(): void {
    const peers = this.getPeers();
    for (const cb of this.presenceListeners) cb(peers);
  }

  private setStatus(status: NetStatus): void {
    if (this.status === status) return;
    this.status = status;
    for (const cb of this.statusListeners) cb(status);
  }
}
