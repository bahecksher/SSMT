import Phaser from 'phaser';
import { COLORS, SCENE_KEYS, TITLE_FONT, UI_FONT, applyColorPalette, readableFontSize } from '../constants';
import { getLayout, isNarrowViewport, isShortViewport, setLayoutSize } from '../layout';
import { getSettings } from '../systems/SettingsSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { playUiSelectSfx } from '../systems/SfxSystem';
import { HologramOverlay } from '../ui/HologramOverlay';
import { CustomCursor } from '../ui/CustomCursor';
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

type LobbyState = 'IDLE' | 'JOINING' | 'WAITING' | 'COUNTDOWN' | 'STARTED' | 'ERROR';

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

export class VersusLobbyScene extends Phaser.Scene {
  private hologramOverlay!: HologramOverlay;
  private cursor!: CustomCursor;

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

  create(): void {
    this.events.once('shutdown', this.cleanup, this);
    setLayoutSize(this.scale.width, this.scale.height);
    applyColorPalette(getSettings().paletteId);
    this.saveSystem = new SaveSystem();
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

    const sideMargin = Math.max(24, Math.round(layout.gameWidth * 0.06));
    const backW = compact ? 80 : 100;
    const backH = compact ? 28 : 32;
    const backX = sideMargin + backW / 2;
    const backY = 24 + backH / 2;
    this.makeButton(backX, backY, backW, backH, 'BACK', () => this.exitToMenu());

    this.renderState();

    this.input.keyboard?.on('keydown-ESC', () => this.exitToMenu());
  }

  update(_time: number, delta: number): void {
    this.hologramOverlay.update(delta);
    this.cursor.update(this);
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
    this.scene.start(SCENE_KEYS.GAME, { multiplayer: handoff });
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
    if (this.session) {
      try {
        await this.session.leave();
      } catch {
        /* ignore */
      }
      this.session = null;
    }
    playUiSelectSfx(this);
    this.scene.start(SCENE_KEYS.MENU);
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
  ): LobbyButton {
    const bg = this.add.graphics().setDepth(10);
    const labelText = this.add.text(x, y, label, {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(13),
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
