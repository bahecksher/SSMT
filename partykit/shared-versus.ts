import type * as Party from 'partykit/server';
import { SharedWorldSimulation } from '../src/game/sharedVersus/SharedWorldSimulation';
import type { SharedClientMessage, SharedServerMessage } from '../src/game/sharedVersus/types';

const TICK_MS = 50;
const SNAPSHOT_MS = 100;

function parseMessage(raw: string | ArrayBuffer | ArrayBufferView): SharedClientMessage | null {
  if (typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw) as SharedClientMessage;
    return parsed && typeof parsed.type === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export default class SharedVersusServer implements Party.Server {
  private simulation: SharedWorldSimulation;
  private interval: ReturnType<typeof setInterval> | null = null;
  private snapshotAccumMs = 0;
  private readonly playerByConnection = new Map<string, string>();

  constructor(readonly room: Party.Room) {
    this.simulation = new SharedWorldSimulation({ matchId: room.id });
  }

  onConnect(connection: Party.Connection): void {
    connection.send(JSON.stringify(this.simulation.getSnapshot()));
    this.ensureRunning();
  }

  onMessage(message: string | ArrayBuffer | ArrayBufferView, connection: Party.Connection): void {
    const parsed = parseMessage(message);
    if (!parsed) return;
    if (parsed.type === 'join') {
      this.playerByConnection.set(connection.id, parsed.playerId);
    }
    this.simulation.handleMessage(parsed, {
      send: (serverMessage) => this.send(serverMessage),
    });
    this.send(this.simulation.getSnapshot());
    this.ensureRunning();
  }

  onClose(connection: Party.Connection): void {
    const playerId = this.playerByConnection.get(connection.id);
    if (!playerId) return;
    this.playerByConnection.delete(connection.id);
    const message = this.simulation.markLeft(playerId);
    if (message) this.send(message);
  }

  private ensureRunning(): void {
    if (this.interval) return;
    this.interval = setInterval(() => {
      this.simulation.tick(TICK_MS, {
        send: (message) => this.send(message),
      });
      this.snapshotAccumMs += TICK_MS;
      if (this.snapshotAccumMs >= SNAPSHOT_MS) {
        this.snapshotAccumMs = 0;
        this.send(this.simulation.getSnapshot());
      }
      if ([...this.room.getConnections()].length === 0 && this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    }, TICK_MS);
  }

  private send(message: SharedServerMessage): void {
    const encoded = JSON.stringify(message);
    this.room.broadcast(encoded);
  }
}
