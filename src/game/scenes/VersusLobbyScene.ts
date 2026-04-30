import Phaser from 'phaser';
import { COLORS, SCENE_KEYS, TITLE_FONT, UI_FONT, applyColorPalette, readableFontSize } from '../constants';
import { getLayout, isNarrowViewport, isShortViewport, setLayoutSize } from '../layout';
import { getTopNavMetrics } from '../ui/menuLayout';
import { getSettings } from '../systems/SettingsSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { playUiSelectSfx } from '../systems/SfxSystem';
import { HologramOverlay } from '../ui/HologramOverlay';
import { CustomCursor } from '../ui/CustomCursor';
import { SalvageDebris } from '../entities/SalvageDebris';
import { DrifterHazard } from '../entities/DrifterHazard';
import { NPCShip } from '../entities/NPCShip';
import { GeoSphere } from '../entities/GeoSphere';
import { DRIFTER_SPEED_BASE } from '../data/tuning';
import { pickAsteroidSize } from '../data/phaseConfig';
import {
  NetSession,
  NET_EVENT,
  generatePlayerId,
  generateRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
  type MatchStartPayload,
  type MultiplayerHandoff,
  type PeerPresence,
} from '../systems/NetSystem';
import { RunMode } from '../types';

type LobbyState = 'IDLE' | 'JOINING' | 'WAITING' | 'COUNTDOWN' | 'STARTED' | 'ERROR';

interface LobbyBackgroundHandoffData {
  drifterState?: { x: number; y: number; vx: number; vy: number; radiusScale: number }[];
  debrisState?: { x: number; y: number; vx: number; vy: number }[];
  npcState?: { x: number; y: number; vx: number; vy: number }[];
}

interface LobbyButton {
  bg: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  hit: Phaser.GameObjects.Zone;
  width: number;
  height: number;
  enabled: boolean;
  onClick: () => void;
}

const COUNTDOWN_MS = 3000;
const BG_MAX_DEBRIS = 2;
const BG_MAX_DRIFTERS = 5;
const BG_MAX_NPCS = 2;
const BG_DRIFTER_SPAWN_MS = 800;
const BG_DEBRIS_SPAWN_MS = 2000;
const BG_NPC_SPAWN_MS = 2500;
const BACKGROUND_STARFIELD_OVERSCAN = 96;
const BACKGROUND_STARFIELD_COUNT = 170;

export class VersusLobbyScene extends Phaser.Scene {
  private hologramOverlay!: HologramOverlay;
  private cursor!: CustomCursor;
  private bgDebris: SalvageDebris[] = [];
  private bgDrifters: DrifterHazard[] = [];
  private bgNpcs: NPCShip[] = [];
  private geoSphere!: GeoSphere;
  private drifterTimer = 0;
  private debrisTimer = 0;
  private npcTimer = 0;

  private state: LobbyState = 'IDLE';
  private session: NetSession | null = null;
  private buttons: LobbyButton[] = [];
  private dynamicTexts: Phaser.GameObjects.Text[] = [];

  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private codeText!: Phaser.GameObjects.Text;
  private peerText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private countdownText!: Phaser.GameObjects.Text;

  private localReady = false;
  private countdownTimer: Phaser.Time.TimerEvent | null = null;
  private leaving = false;
  private handingOff = false;
  private saveSystem!: SaveSystem;

  constructor() {
    super(SCENE_KEYS.VERSUS_LOBBY);
  }

  create(data?: LobbyBackgroundHandoffData): void {
    this.events.once('shutdown', this.cleanup, this);
    setLayoutSize(this.scale.width, this.scale.height);
    applyColorPalette(getSettings().paletteId);
    this.saveSystem = new SaveSystem();
    this.state = 'IDLE';
    this.session = null;
    this.buttons = [];
    this.dynamicTexts = [];
    this.localReady = false;
    this.countdownTimer = null;
    this.leaving = false;
    this.handingOff = false;
    this.bgDebris = [];
    this.bgDrifters = [];
    this.bgNpcs = [];
    this.drifterTimer = 0;
    this.debrisTimer = 0;
    this.npcTimer = 0;
    this.hologramOverlay = new HologramOverlay(this);
    this.cursor = new CustomCursor(this);

    const layout = getLayout();
    const compact = isNarrowViewport(layout) || isShortViewport(layout);
    const titleSize = readableFontSize(compact ? 24 : 32);
    const subtitleSize = readableFontSize(compact ? 13 : 15);
    const statusSize = readableFontSize(compact ? 14 : 17);
    const codeSize = readableFontSize(compact ? 28 : 36);
    const hintSize = readableFontSize(compact ? 11 : 13);
    const countdownSize = readableFontSize(compact ? 56 : 80);
    const backgroundHandoff = data ?? {};

    const starfield = this.add.graphics().setDepth(-1);
    starfield.fillStyle(COLORS.STARFIELD_BG, 1);
    starfield.fillRect(
      -BACKGROUND_STARFIELD_OVERSCAN,
      -BACKGROUND_STARFIELD_OVERSCAN,
      layout.gameWidth + BACKGROUND_STARFIELD_OVERSCAN * 2,
      layout.gameHeight + BACKGROUND_STARFIELD_OVERSCAN * 2,
    );
    for (let i = 0; i < BACKGROUND_STARFIELD_COUNT; i++) {
      const sx = Phaser.Math.Between(-BACKGROUND_STARFIELD_OVERSCAN, layout.gameWidth + BACKGROUND_STARFIELD_OVERSCAN);
      const sy = Phaser.Math.Between(-BACKGROUND_STARFIELD_OVERSCAN, layout.gameHeight + BACKGROUND_STARFIELD_OVERSCAN);
      const brightness = Phaser.Math.FloatBetween(0.1, 0.4);
      const size = Phaser.Math.FloatBetween(0.5, 1.2);
      const starColor = Math.random() < 0.6 ? COLORS.PLAYER : 0xffffff;
      starfield.fillStyle(starColor, brightness);
      starfield.fillCircle(sx, sy, size);
    }
    this.geoSphere = new GeoSphere(this);
    this.restoreBackgroundEntities(backgroundHandoff);

    const backingTop = layout.gameHeight * (compact ? 0.045 : 0.06);
    const backing = this.add.graphics().setDepth(9);
    backing.fillStyle(COLORS.BG, 0.7);
    backing.fillRoundedRect(20, backingTop, layout.gameWidth - 40, layout.gameHeight - backingTop - 20, 12);

    this.titleText = this.add.text(layout.centerX, layout.gameHeight * 0.10, 'VERSUS', {
      fontFamily: TITLE_FONT,
      fontSize: titleSize,
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(10);

    this.subtitleText = this.add.text(layout.centerX, layout.gameHeight * 0.16, '1V1 MIRRORED ARENA — RACE TO EXTRACT', {
      fontFamily: UI_FONT,
      fontSize: subtitleSize,
      color: `#${COLORS.GATE.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(10).setAlpha(0.85);

    this.statusText = this.add.text(layout.centerX, layout.gameHeight * 0.30, '', {
      fontFamily: UI_FONT,
      fontSize: statusSize,
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(10);

    this.codeText = this.add.text(layout.centerX, layout.gameHeight * 0.40, '', {
      fontFamily: TITLE_FONT,
      fontSize: codeSize,
      color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(10);

    this.peerText = this.add.text(layout.centerX, layout.gameHeight * 0.50, '', {
      fontFamily: UI_FONT,
      fontSize: statusSize,
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(10).setAlpha(0.9);

    this.hintText = this.add.text(layout.centerX, layout.gameHeight * 0.92, '', {
      fontFamily: UI_FONT,
      fontSize: hintSize,
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(10).setAlpha(0.6);

    this.countdownText = this.add.text(layout.centerX, layout.gameHeight * 0.55, '', {
      fontFamily: TITLE_FONT,
      fontSize: countdownSize,
      color: `#${COLORS.GATE.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(11).setAlpha(0);

    const nav = getTopNavMetrics(layout);
    this.makeButton(nav.leftCenterX, nav.centerY, nav.width, nav.height, 'BACK', () => this.exitToMenu(), true, nav.fontSizePx);

    this.renderState();

    this.input.keyboard?.on('keydown-ESC', () => this.exitToMenu());
  }

  update(_time: number, delta: number): void {
    this.updateBackground(delta);
    this.hologramOverlay.update(delta);
    this.cursor.update(this);
    this.geoSphere.update(delta);
  }

  // -- State machine --

  private renderState(): void {
    this.clearActionButtons();
    this.clearDynamicTexts();

    const layout = getLayout();
    const compact = isNarrowViewport(layout) || isShortViewport(layout);
    const buttonW = compact ? 160 : 200;
    const buttonH = compact ? 44 : 52;
    const centerX = layout.centerX;
    const buttonRowY = layout.gameHeight * 0.74;

    switch (this.state) {
      case 'IDLE': {
        this.statusText.setText('CHOOSE A ROLE');
        this.codeText.setText('');
        this.peerText.setText('');
        this.hintText.setText('CREATE A ROOM AND SHARE THE CODE, OR JOIN ONE.');
        this.countdownText.setAlpha(0);

        this.makeButton(centerX - buttonW / 2 - 12, buttonRowY, buttonW, buttonH, 'CREATE ROOM', () => this.createRoom());
        this.makeButton(centerX + buttonW / 2 + 12, buttonRowY, buttonW, buttonH, 'JOIN ROOM', () => this.joinRoomPrompt());
        break;
      }

      case 'JOINING': {
        this.statusText.setText('CONNECTING…');
        this.codeText.setText(this.session?.roomCode ?? '');
        this.peerText.setText('');
        this.hintText.setText('OPENING REALTIME CHANNEL.');
        this.countdownText.setAlpha(0);
        break;
      }

      case 'WAITING': {
        const peer = this.session?.getPeer() ?? null;
        const code = this.session?.roomCode ?? '';
        this.codeText.setText(code);
        this.statusText.setText(peer ? 'OPPONENT CONNECTED' : 'WAITING FOR OPPONENT…');
        this.peerText.setText(this.formatPresence(peer));
        this.hintText.setText('SHARE THE ROOM CODE. PRESS READY WHEN BOTH SIDES ARE SET.');
        this.countdownText.setAlpha(0);

        const readyEnabled = !!peer;
        const readyLabel = this.localReady ? 'UNREADY' : 'READY';
        this.makeButton(centerX - buttonW / 2 - 12, buttonRowY, buttonW, buttonH, readyLabel, () => {
          this.toggleReady();
        }, readyEnabled);
        this.makeButton(centerX + buttonW / 2 + 12, buttonRowY, buttonW, buttonH, 'CANCEL', () => this.cancelRoom());
        break;
      }

      case 'COUNTDOWN': {
        this.statusText.setText('MATCH STARTING');
        this.peerText.setText(this.formatPresence(this.session?.getPeer() ?? null));
        this.hintText.setText('STAY ON THIS SCREEN.');
        this.makeButton(centerX, buttonRowY, buttonW, buttonH, 'CANCEL', () => this.cancelRoom());
        break;
      }

      case 'STARTED': {
        this.statusText.setText('MATCH START — RETURNING TO MENU');
        this.codeText.setText('');
        this.peerText.setText('');
        this.hintText.setText('GAMESCENE WIRING IS PHASE 2.');
        this.countdownText.setAlpha(0);
        break;
      }

      case 'ERROR': {
        this.statusText.setText('CONNECTION FAILED');
        this.peerText.setText('');
        this.hintText.setText('CHECK NETWORK AND TRY AGAIN.');
        this.makeButton(centerX, buttonRowY, buttonW, buttonH, 'BACK', () => this.exitToMenu());
        break;
      }
    }
  }

  private async createRoom(): Promise<void> {
    if (this.state !== 'IDLE') return;
    playUiSelectSfx(this);
    const code = generateRoomCode();
    await this.startSession(code);
  }

  private async joinRoomPrompt(): Promise<void> {
    if (this.state !== 'IDLE') return;
    playUiSelectSfx(this);
    const raw = window.prompt('Enter room code (4 letters/numbers):');
    if (raw === null) return;
    const code = normalizeRoomCode(raw);
    if (!isValidRoomCode(code)) {
      this.statusText.setText('INVALID CODE');
      return;
    }
    await this.startSession(code);
  }

  private async startSession(roomCode: string): Promise<void> {
    this.session = new NetSession(roomCode, generatePlayerId(), this.saveSystem.getPlayerName());
    this.session.onPresence((peers) => this.handlePresence(peers));
    this.session.onBroadcast(NET_EVENT.MATCH_START, (payload) => this.handleMatchStart(payload as MatchStartPayload));
    this.session.onBroadcast(NET_EVENT.MATCH_CANCEL, () => this.handleMatchCancel());

    this.setState('JOINING');
    try {
      await this.session.join();
      this.localReady = false;
      this.setState('WAITING');
    } catch (err) {
      console.error('[VersusLobby] join failed', err);
      this.setState('ERROR');
    }
  }

  private async toggleReady(): Promise<void> {
    if (!this.session || this.state !== 'WAITING') return;
    const peer = this.session.getPeer();
    if (!peer) return;
    playUiSelectSfx(this);
    this.localReady = !this.localReady;
    try {
      await this.session.setReady(this.localReady);
    } catch (err) {
      console.warn('[VersusLobby] setReady failed', err);
    }
    this.renderState();
    this.maybeStartCountdown();
  }

  private async cancelRoom(): Promise<void> {
    if (!this.session) {
      this.setState('IDLE');
      return;
    }
    playUiSelectSfx(this);
    if (this.session.isHost()) {
      try {
        await this.session.broadcast(NET_EVENT.MATCH_CANCEL, { reason: 'host_cancel' });
      } catch {
        /* ignore */
      }
    }
    await this.session.leave();
    this.session = null;
    this.localReady = false;
    this.cancelCountdown();
    this.setState('IDLE');
  }

  private handlePresence(_peers: PeerPresence[]): void {
    if (!this.session) return;
    if (this.state === 'WAITING') {
      this.renderState();
      this.maybeStartCountdown();
    } else if (this.state === 'COUNTDOWN') {
      const peer = this.session.getPeer();
      if (!peer || !peer.ready) {
        this.cancelCountdown();
        this.setState('WAITING');
      }
    }
  }

  private maybeStartCountdown(): void {
    if (!this.session || this.state !== 'WAITING') return;
    const peer = this.session.getPeer();
    if (!peer || !peer.ready || !this.localReady) return;
    if (!this.session.isHost()) return;

    const matchId = `m_${this.session.roomCode}_${Date.now().toString(36)}`;
    const payload: MatchStartPayload = { matchId, delayMs: COUNTDOWN_MS };
    this.session
      .broadcast(NET_EVENT.MATCH_START, payload)
      .catch((err) => console.warn('[VersusLobby] match_start broadcast failed', err));
    this.beginCountdown(matchId);
  }

  private handleMatchStart(payload: MatchStartPayload): void {
    if (!this.session) return;
    if (this.state !== 'WAITING') return;
    if (this.session.isHost()) return;
    this.beginCountdown(payload.matchId);
  }

  private handleMatchCancel(): void {
    if (this.state === 'COUNTDOWN') {
      this.cancelCountdown();
      this.setState('WAITING');
    }
  }

  private beginCountdown(matchId: string): void {
    if (!this.session) return;
    this.setState('COUNTDOWN');
    const startAt = Date.now() + COUNTDOWN_MS;
    let remaining = Math.ceil(COUNTDOWN_MS / 1000);
    this.showCountdownNumber(remaining);

    this.cancelCountdown();
    this.countdownTimer = this.time.addEvent({
      delay: 250,
      loop: true,
      callback: () => {
        const msLeft = Math.max(0, startAt - Date.now());
        const secs = Math.ceil(msLeft / 1000);
        if (secs !== remaining) {
          remaining = secs;
          this.showCountdownNumber(remaining);
        }
        if (msLeft <= 0) {
          this.cancelCountdown();
          this.fireMatchStart(matchId);
        }
      },
    });
  }

  private fireMatchStart(matchId: string): void {
    if (!this.session) return;
    const peer = this.session.getPeer();
    const role: 'host' | 'guest' = this.session.isHost() ? 'host' : 'guest';
    const handoff: MultiplayerHandoff = {
      session: this.session,
      role,
      matchId,
      peerId: peer?.playerId ?? '',
      startAt: Date.now(),
    };
    this.handingOff = true;
    this.setState('STARTED');
    // Versus runs through MissionSelect now: each side picks own contracts and
    // favors, then the host broadcasts MATCH_DEPLOY when both lock in. Pass
    // mode=VERSUS so MissionSelect knows to hide campaign-only controls and
    // render the lock-in flow instead of plain DEPLOY.
    this.scene.start(SCENE_KEYS.MISSION_SELECT, {
      ...this.buildBackgroundHandoff(),
      multiplayer: handoff,
      mode: RunMode.VERSUS,
    });
  }

  private cancelCountdown(): void {
    if (this.countdownTimer) {
      this.countdownTimer.remove(false);
      this.countdownTimer = null;
    }
    this.countdownText.setText('');
    this.countdownText.setAlpha(0);
  }

  private showCountdownNumber(secs: number): void {
    if (secs <= 0) {
      this.countdownText.setText('GO');
    } else {
      this.countdownText.setText(String(secs));
    }
    this.countdownText.setAlpha(1);
    this.tweens.add({
      targets: this.countdownText,
      scale: { from: 1.4, to: 1 },
      duration: 250,
      ease: 'Quad.easeOut',
    });
  }

  private formatPresence(peer: PeerPresence | null): string {
    if (!peer) return 'NO OPPONENT';
    const tag = peer.playerName.trim().toUpperCase();
    return peer.ready ? `OPPONENT ${tag} — READY` : `OPPONENT ${tag} — STANDBY`;
  }

  private setState(state: LobbyState): void {
    this.state = state;
    this.renderState();
  }

  private async exitToMenu(): Promise<void> {
    if (this.leaving) return;
    this.leaving = true;
    this.cancelCountdown();
    const backgroundHandoff = this.buildBackgroundHandoff();
    if (this.session) {
      try {
        await this.session.leave();
      } catch {
        /* ignore */
      }
      this.session = null;
    }
    playUiSelectSfx(this);
    this.scene.start(SCENE_KEYS.MENU, backgroundHandoff);
  }

  private restoreBackgroundEntities(handoff: LobbyBackgroundHandoffData): void {
    if (handoff.debrisState) {
      for (const debris of handoff.debrisState) {
        this.bgDebris.push(SalvageDebris.createAt(this, debris.x, debris.y, debris.vx, debris.vy));
      }
    } else {
      for (let i = 0; i < BG_MAX_DEBRIS; i++) {
        this.bgDebris.push(new SalvageDebris(this));
      }
    }

    if (handoff.drifterState) {
      for (const drifter of handoff.drifterState) {
        this.bgDrifters.push(
          DrifterHazard.createFragment(this, drifter.x, drifter.y, drifter.vx, drifter.vy, drifter.radiusScale),
        );
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const sizeScale = pickAsteroidSize(1);
        const speed = DRIFTER_SPEED_BASE * (1 / Math.sqrt(sizeScale));
        this.bgDrifters.push(new DrifterHazard(this, speed, sizeScale));
      }
    }

    if (handoff.npcState) {
      for (const npc of handoff.npcState) {
        this.bgNpcs.push(NPCShip.createAt(this, npc.x, npc.y, npc.vx, npc.vy));
      }
    } else {
      for (let i = 0; i < BG_MAX_NPCS; i++) {
        this.bgNpcs.push(new NPCShip(this));
      }
    }
  }

  private buildBackgroundHandoff(): LobbyBackgroundHandoffData {
    return {
      drifterState: this.bgDrifters
        .filter((drifter) => drifter.active)
        .map((drifter) => ({
          x: drifter.x,
          y: drifter.y,
          vx: drifter.vx,
          vy: drifter.vy,
          radiusScale: drifter.radiusScale,
        })),
      debrisState: this.bgDebris
        .filter((debris) => debris.active)
        .map((debris) => ({
          x: debris.x,
          y: debris.y,
          vx: debris.driftVx,
          vy: debris.driftVy,
        })),
      npcState: this.bgNpcs
        .filter((npc) => npc.active)
        .map((npc) => ({
          x: npc.x,
          y: npc.y,
          vx: npc.vx,
          vy: npc.vy,
        })),
    };
  }

  private updateBackground(delta: number): void {
    for (let i = this.bgDebris.length - 1; i >= 0; i--) {
      this.bgDebris[i].update(delta);
      if (!this.bgDebris[i].active) {
        this.bgDebris[i].destroy();
        this.bgDebris.splice(i, 1);
      }
    }

    for (let i = this.bgDrifters.length - 1; i >= 0; i--) {
      this.bgDrifters[i].update(delta);
      if (!this.bgDrifters[i].active) {
        this.bgDrifters[i].destroy();
        this.bgDrifters.splice(i, 1);
      }
    }

    for (const npc of this.bgNpcs) {
      if (!npc.active) continue;

      let bestTarget: SalvageDebris | null = null;
      let bestDist = Infinity;
      for (const debris of this.bgDebris) {
        if (!debris.active || debris.depleted) continue;
        const dist = Phaser.Math.Distance.Between(npc.x, npc.y, debris.x, debris.y);
        if (dist < bestDist) {
          bestDist = dist;
          bestTarget = debris;
        }
      }

      if (bestTarget) {
        npc.setTarget(bestTarget.x, bestTarget.y);
      } else {
        npc.clearTarget();
      }
    }

    for (let i = this.bgNpcs.length - 1; i >= 0; i--) {
      const npc = this.bgNpcs[i];
      npc.update(delta);
      if (!npc.active) {
        npc.destroy();
        this.bgNpcs.splice(i, 1);
      }
    }

    for (const npc of this.bgNpcs) {
      if (!npc.active || !npc.isSalvaging()) continue;
      for (const debris of this.bgDebris) {
        if (!debris.active || debris.depleted) continue;
        const dist = Phaser.Math.Distance.Between(npc.x, npc.y, debris.x, debris.y);
        if (dist < debris.salvageRadius) {
          debris.hp -= delta / 1000;
          if (debris.hp <= 0) {
            debris.hp = 0;
            debris.depleted = true;
          }
        }
      }
    }

    for (const npc of this.bgNpcs) {
      if (!npc.active) continue;
      for (const drifter of this.bgDrifters) {
        if (!drifter.active) continue;
        const dx = npc.x - drifter.x;
        const dy = npc.y - drifter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < npc.radius + drifter.radius) {
          npc.active = false;
          npc.killedByHazard = true;
          break;
        }
      }
    }

    this.debrisTimer += delta;
    if (this.debrisTimer >= BG_DEBRIS_SPAWN_MS && this.bgDebris.length < BG_MAX_DEBRIS) {
      this.bgDebris.push(new SalvageDebris(this));
      this.debrisTimer = 0;
    }

    this.drifterTimer += delta;
    if (this.drifterTimer >= BG_DRIFTER_SPAWN_MS && this.bgDrifters.length < BG_MAX_DRIFTERS) {
      const sizeScale = pickAsteroidSize(1);
      const speed = DRIFTER_SPEED_BASE * (1 / Math.sqrt(sizeScale));
      this.bgDrifters.push(new DrifterHazard(this, speed, sizeScale));
      this.drifterTimer = 0;
    }

    this.npcTimer += delta;
    if (this.npcTimer >= BG_NPC_SPAWN_MS && this.bgNpcs.length < BG_MAX_NPCS) {
      this.bgNpcs.push(new NPCShip(this));
      this.npcTimer = 0;
    }
  }

  private cleanupBackground(): void {
    for (const debris of this.bgDebris) debris.destroy();
    this.bgDebris = [];
    for (const drifter of this.bgDrifters) drifter.destroy();
    this.bgDrifters = [];
    for (const npc of this.bgNpcs) npc.destroy();
    this.bgNpcs = [];
    this.geoSphere?.destroy();
  }

  // -- Button helpers --

  private makeButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onClick: () => void,
    enabled = true,
    fontSizePx = 13,
  ): LobbyButton {
    const bg = this.add.graphics().setDepth(10);
    const labelText = this.add.text(x, y, label, {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(fontSizePx),
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(11);
    const hit = this.add.zone(x - width / 2, y - height / 2, width, height)
      .setOrigin(0, 0)
      .setDepth(12)
      .setInteractive({ useHandCursor: enabled });
    const btn: LobbyButton = { bg, label: labelText, hit, width, height, enabled, onClick };
    hit.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      if (!btn.enabled) return;
      btn.onClick();
    });
    this.drawButton(btn, x, y);
    this.buttons.push(btn);
    return btn;
  }

  private drawButton(button: LobbyButton, centerX: number, centerY: number): void {
    button.bg.clear();
    button.bg.fillStyle(COLORS.BG, 0.65);
    button.bg.fillRoundedRect(centerX - button.width / 2, centerY - button.height / 2, button.width, button.height, 8);
    button.bg.lineStyle(1.5, COLORS.HUD, button.enabled ? 0.7 : 0.2);
    button.bg.strokeRoundedRect(centerX - button.width / 2, centerY - button.height / 2, button.width, button.height, 8);
    button.label.setAlpha(button.enabled ? 0.95 : 0.35);
  }

  private clearActionButtons(): void {
    for (let i = this.buttons.length - 1; i >= 0; i--) {
      const btn = this.buttons[i];
      // keep the BACK button at the top-left (always at index 0)
      if (i === 0) continue;
      btn.bg.destroy();
      btn.label.destroy();
      btn.hit.destroy();
      this.buttons.splice(i, 1);
    }
  }

  private clearDynamicTexts(): void {
    for (const t of this.dynamicTexts) t.destroy();
    this.dynamicTexts = [];
  }

  private cleanup(): void {
    this.cancelCountdown();
    if (this.session && !this.handingOff) {
      this.session.leave().catch(() => { /* ignore */ });
    }
    this.session = null;
    this.cleanupBackground();
    for (const btn of this.buttons) {
      btn.bg.destroy();
      btn.label.destroy();
      btn.hit.destroy();
    }
    this.buttons = [];
    this.clearDynamicTexts();
    this.titleText?.destroy();
    this.subtitleText?.destroy();
    this.statusText?.destroy();
    this.codeText?.destroy();
    this.peerText?.destroy();
    this.hintText?.destroy();
    this.countdownText?.destroy();
    this.hologramOverlay?.destroy();
    this.cursor?.destroy(this);
    this.input.keyboard?.removeAllListeners();
  }
}
