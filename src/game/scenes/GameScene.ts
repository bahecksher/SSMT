import Phaser from 'phaser';
import {
  applyColorPalette,
  COLORS,
  POCKET_PALETTE_ID,
  SCENE_KEYS,
  TITLE_FONT,
  UI_FONT,
  type RuntimePaletteId,
  readableFontSize,
} from '../constants';
import { GameState, CompanyId } from '../types';
import type { ActiveMission, RunBoosts } from '../types';
import { SALVAGE_RESPAWN_DELAY, PLAYER_RADIUS, PLAYER_SHIELD_BREAK_INVULN_MS, NPC_BUMP_RADIUS, NPC_BONUS_POINTS } from '../data/tuning';
import { MissionSystem, loadOrGenerateMissions } from '../systems/MissionSystem';
import { InputSystem } from '../systems/InputSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { SalvageSystem } from '../systems/SalvageSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { ExtractionSystem } from '../systems/ExtractionSystem';
import { BankingSystem } from '../systems/BankingSystem';
import { DifficultySystem } from '../systems/DifficultySystem';
import { SaveSystem } from '../systems/SaveSystem';
import {
  RepFluxTracker,
  applyRepDeltas,
  formatRepDeltasOneLine,
  hasAnyRepDelta,
  type RepDeltaMap,
} from '../systems/RepFluxSystem';
import { Player } from '../entities/Player';
import { SalvageDebris } from '../entities/SalvageDebris';
import { DrifterHazard } from '../entities/DrifterHazard';
import { ShieldPickup } from '../entities/ShieldPickup';
import { BonusPickup } from '../entities/BonusPickup';
import { BombPickup } from '../entities/BombPickup';
import { WormholePickup } from '../entities/WormholePickup';
import { VersusLaserPickup } from '../entities/VersusLaserPickup';
import { VersusLaserStrike, type VersusLaserLane } from '../entities/VersusLaserStrike';
import { VersusRepulsorCharge } from '../entities/VersusRepulsorCharge';
import { ShipDebris } from '../entities/ShipDebris';
import { ExitGate } from '../entities/ExitGate';
import { NPCShip } from '../entities/NPCShip';
import { EnemyShip } from '../entities/EnemyShip';
import { Hud } from '../ui/Hud';
import { Overlays } from '../ui/Overlays';
import { GeoSphere } from '../entities/GeoSphere';
import { HologramOverlay } from '../ui/HologramOverlay';
import { SlickComm } from '../ui/SlickComm';
import { LiaisonComm } from '../ui/LiaisonComm';
import {
  COMPANIES,
  getCompanyAffiliation,
  getLeaderboardCompanyId,
  getRepLevel,
  REP_PER_TIER,
  getSlickCutPercent,
  getWalletSharePercent,
  loadCompanyRep,
} from '../data/companyData';
import { runModeToLeaderboardMode, submitLoss, submitScore } from '../services/LeaderboardService';
import { getLiaisonLine } from '../data/liaisonLines';
import { RegentComm } from '../ui/RegentComm';
import { getSlickLine } from '../data/slickLines';
import { getRegentLine } from '../data/regentLines';
import { getRenderTuningProfile, type RenderTuningProfile } from '../data/renderTuning';
import { getLayout, isNarrowViewport, isShortViewport, setLayoutSize } from '../layout';
import { getSettings, updateSettings } from '../systems/SettingsSystem';
import {
  refreshMusicForSettings,
  setGameplayMusicForPhase,
  setPauseMusic,
  setResultMusic,
  setWormholeMusic,
  warmMusicCache,
} from '../systems/MusicSystem';
import { playSfx, playUiSelectSfx } from '../systems/SfxSystem';
import { CustomCursor } from '../ui/CustomCursor';
import { SettingsSlider } from '../ui/SettingsSlider';
import { RunMode } from '../types';
import {
  NET_EVENT,
  type MirrorSnapshot,
  type MirrorDrifterSnapshot,
  type MirrorSalvageSnapshot,
  type MirrorLaserSnapshot,
  type MirrorNpcSnapshot,
  type MirrorGateSnapshot,
  type MultiplayerHandoff,
  type MatchExtractPayload,
  type MatchDeathPayload,
  type MatchLaserPayload,
  type MatchRepulsorPayload,
  type MatchEnemyPayload,
  type MatchRematchPayload,
  type PeerPresence,
} from '../systems/NetSystem';
import {
  DRIFTER_MINING_RADIUS_MULT,
  EXIT_GATE_HITBOX,
  EXIT_GATE_DURATION,
  EXIT_GATE_PREVIEW,
  EXIT_GATE_RADIUS,
  VERSUS_LASER_SEND_COOLDOWN_MS,
  VERSUS_LASER_WARNING_MS,
  VERSUS_LASER_LETHAL_MS,
  VERSUS_LASER_WIDTH,
  SPECTATE_LASER_REGEN_MS,
  SPECTATE_LASER_MAX_CHARGES,
  SPECTATE_REPULSOR_COOLDOWN_MS,
  SPECTATE_REPULSOR_OBJECT_FORCE,
  SPECTATE_REPULSOR_PLAYER_FORCE,
  SPECTATE_REPULSOR_RADIUS,
  VERSUS_LASER_COLOR,
  WORMHOLE_DROP_CHANCE_RARE_SALVAGE,
  WORMHOLE_EVENT_ACTIVE_MS,
  WORMHOLE_EVENT_PREVIEW_MS,
  WORMHOLE_EVENT_SPAWN_DELAY_MS,
  WORMHOLE_MAX_PHASE,
  WORMHOLE_MIN_PHASE,
  WORMHOLE_PICKUP_LIFETIME,
  POST_BOSS_COLLAPSE_DURATION_MS,
  POST_BOSS_ESCAPE_GATE_DURATION_MS,
  POST_BOSS_EXTRACT_DELAY_MS,
  WORMHOLE_POCKET_BONUS_INTERVAL_MS,
  WORMHOLE_POCKET_BONUS_POINTS,
  WORMHOLE_POCKET_BOUNDARY_BURN_MS,
  WORMHOLE_POCKET_BOUNDARY_END_RADIUS_MULT,
  WORMHOLE_POCKET_DURATION_MS,
  WORMHOLE_POCKET_RARE_SALVAGE_INTERVAL_MS,
  WORMHOLE_POCKET_SALVAGE_MULT,
  WORMHOLE_SCHEDULED_RUN_CHANCE,
} from '../data/tuning';

const MULTI_SPECTATE_LASER_REGEN_MS = 10000;
const MULTI_SPECTATE_ENEMY_REGEN_MS = 20000;

function lerpAngleShortest(from: number, to: number, alpha: number): number {
  const delta = Phaser.Math.Angle.Wrap(to - from);
  return from + delta * alpha;
}

interface MenuHandoff {
  drifterState?: { x: number; y: number; vx: number; vy: number; radiusScale: number }[];
  debrisState?: { x: number; y: number; vx: number; vy: number }[];
  npcState?: { x: number; y: number; vx: number; vy: number }[];
  retryFromDeath?: boolean;
  selectedMissions?: ActiveMission[];
  runBoosts?: RunBoosts;
  mode?: RunMode;
  startPhase?: number;
  multiplayer?: MultiplayerHandoff;
}

interface StarfieldStar {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
  color: number;
}

interface ResultData {
  score: number;
  lostScore?: number;
  cause: 'death' | 'extract';
  mode: RunMode;
  scoreRecorded: boolean;
  missionBonus?: number;
  missionRepEarned?: number;
  walletPayout?: number;
  slickCut?: number;
  walletBalance?: number;
  campaignLivesRemaining?: number;
  campaignMissionsCompleted?: number;
  campaignTotalExtracted?: number;
  campaignGameOver?: boolean;
  missionProgress?: { label: string; progress: number; target: number; completed: boolean; reward: number; repGain: number }[];
  repFluxDeltas?: RepDeltaMap;
}

type DeathCause = 'asteroid' | 'enemy' | 'laser';

interface VersusOutcome {
  cause: 'extract' | 'death' | 'survived';
  score: number;
  time: number;
  phase: number;
  deathCause?: DeathCause;
  killer?: string;
}
interface MirrorLaserEcho {
  laser: MirrorLaserSnapshot;
  elapsed: number;
}
type CommSpeaker = 'slick' | 'regent' | 'liaison';

interface GameplayCommOptions {
  allowInterrupt?: boolean;
  ignoreCooldown?: boolean;
}

export class GameScene extends Phaser.Scene {
  private static readonly COUNTDOWN_PHRASES = ['GET IN', 'GET YOURS', 'GET OUT', 'GO'];
  private static readonly START_COUNTDOWN_MS = GameScene.COUNTDOWN_PHRASES.length * 1000;
  private static readonly CAMPAIGN_RESPAWN_WARP_MS = 1000;
  private static readonly PAUSE_SLOW_SCALE = 0.025;
  private static readonly STARFIELD_OVERSCAN = 96;
  private static readonly GAMEPLAY_COMM_GAP_MS = 2200;
  private static readonly DEFAULT_COMM_HIDE_MS = {
    slick: 5200,
    regent: 5600,
    liaison: 5400,
  } as const;

  private inputSystem!: InputSystem;
  private scoreSystem!: ScoreSystem;
  private salvageSystem!: SalvageSystem;
  private collisionSystem!: CollisionSystem;
  private extractionSystem!: ExtractionSystem;
  private bankingSystem!: BankingSystem;
  private difficultySystem!: DifficultySystem;
  private saveSystem!: SaveSystem;
  private missionSystem!: MissionSystem;
  private repFluxTracker!: RepFluxTracker;
  private player!: Player;
  private debrisList: SalvageDebris[] = [];
  private shields: ShieldPickup[] = [];
  private bonusPickups: BonusPickup[] = [];
  private bombPickups: BombPickup[] = [];
  private wormholePickups: WormholePickup[] = [];
  private versusLaserPickups: VersusLaserPickup[] = [];
  private versusLaserStrikes: VersusLaserStrike[] = [];
  private versusLaserLastSendAt = 0;
  private versusLaserRecvDedup = new Set<number>();
  private versusRepulsorCharges: VersusRepulsorCharge[] = [];
  private versusRepulsorApplied = new WeakSet<VersusRepulsorCharge>();
  private versusRepulsorRecvDedup = new Set<number>();
  private spectateLaserCharges = 0;
  private spectateLaserAccumMs = 0;
  private spectateEnemyCharges = 0;
  private spectateEnemyAccumMs = 0;
  private spectateRepulsorLastSendMs = 0;
  private spectateInventoryUi: Phaser.GameObjects.GameObject[] = [];
  private spectateLaserButtonText: Phaser.GameObjects.Text | null = null;
  private spectateEnemyButtonText: Phaser.GameObjects.Text | null = null;
  private spectateRepulsorButtonText: Phaser.GameObjects.Text | null = null;
  private hud!: Hud;
  private state: GameState = GameState.PLAYING;
  private debrisRespawnTimer: Phaser.Time.TimerEvent | null = null;
  private rareSalvageTimer = 0;
  private wormholeEventTimer = 0;
  private wormholeEventPhase = 0;
  private scheduledWormholePhase: number | null = null;
  private naturalWormholeSpawnedThisRun = false;
  private countdownTimer = 0;
  private countdownDurationMs = GameScene.START_COUNTDOWN_MS;
  private starfield!: Phaser.GameObjects.Graphics;
  private starfieldStars: StarfieldStar[] = [];
  private renderTuning!: RenderTuningProfile;
  private starfieldAccumMs = 0;
  private geoSphere!: GeoSphere;
  private arenaBorder!: Phaser.GameObjects.Graphics;
  private hologramOverlay!: HologramOverlay;
  private entryGate: ExitGate | null = null;
  private slickComm!: SlickComm;
  private regentComm!: RegentComm;
  private regentIntroduced = false;
  private regentEnemyAnnounced = false;
  private regentBeamAnnounced = false;
  private regentLastPhase = 0;
  private enemyEntranceSfxPlayed = false;
  private liaisonComm: LiaisonComm | null = null;
  private liaisonCompanyId: CompanyId | null = null;
  private liaisonRepLevel = 0;
  private playerDebris: ShipDebris[] = [];
  private invulnerableTimer = 0;
  private debugInvulnerable = false;
  private countdownText: Phaser.GameObjects.Text | null = null;
  private resultData: ResultData | null = null;
  private resultUi: Phaser.GameObjects.GameObject[] = [];
  private resultInputLocked = false;
  private lastGateActive = false;
  private runMode: RunMode = RunMode.ARCADE;
  private activeRunBoosts: RunBoosts | null = null;
  private activePaletteId: RuntimePaletteId = 'blue';
  private restorePaletteId: RuntimePaletteId = 'blue';
  private pocketActive = false;
  private pocketTimerMs = 0;
  private pocketEntryPhase = 1;
  private pocketRareSalvageTimer = 0;
  private pocketBonusTimer = 0;
  private pocketBoundaryGraphic: Phaser.GameObjects.Graphics | null = null;
  private pocketBoundaryBurnMs = 0;
  private postBossEscapePending = false;
  private postBossEscapeTimerMs = 0;
  private postBossCollapseActive = false;
  private postBossCollapseTimerMs = 0;
  private activeCommSpeaker: CommSpeaker | null = null;
  private activeCommPriority = 0;
  private activeCommVisibleUntil = 0;
  private nextGameplayCommAt = 0;
  private pauseButtonBg!: Phaser.GameObjects.Graphics;
  private pauseButtonText!: Phaser.GameObjects.Text;
  private pauseButtonHit!: Phaser.GameObjects.Zone;
  private pauseUi: Phaser.GameObjects.GameObject[] = [];
  private pausedFromState: GameState = GameState.PLAYING;
  private cursor!: CustomCursor;
  private scoreRecordingBlocked = false;
  private affiliatedCompanyId: CompanyId | null = null;

  // Multiplayer (mirrored versus) state
  private static readonly SNAPSHOT_INTERVAL_MS = 100;
  // Render this far behind the newest sample so we always have an older sample
  // to lerp from. Matches the sender's tick interval.
  private static readonly MIRROR_INTERP_BUFFER_MS = 100;
  // Peer mirror fills the arena and renders behind local gameplay.
  private static readonly MIRROR_BG_DEPTH = -0.25;
  private static readonly MIRROR_ENTITY_DEPTH = -0.1;
  private static readonly MIRROR_TEXT_DEPTH = 0.25;
  // Spectate-mode mirror depths: above the local-run backing and below the
  // title bar/buttons so the peer's arena is the only readable playfield.
  private static readonly MIRROR_SPECTATE_BG_DEPTH = 204;
  private static readonly MIRROR_SPECTATE_GEOSPHERE_DEPTH = 203.5;
  private static readonly MIRROR_SPECTATE_ENTITY_DEPTH = 207;
  private static readonly MIRROR_SPECTATE_TEXT_DEPTH = 211;
  private static readonly MIRROR_SPECTATE_BG_ALPHA = 1;
  private static readonly MIRROR_SPECTATE_ENEMY_RADIUS = 8;
  private static readonly MIRROR_SPECTATE_SHIP_RADIUS = 14;
  private static readonly MIRROR_LABEL_INSET_PX = 12;
  private static readonly MIRROR_BG_ALPHA = 0.08;
  private static readonly MIRROR_ENEMY_RADIUS = 4;
  private static readonly MIRROR_SHIP_RADIUS = 8;
  // Lone-extractor wait window. See plan revision 2026-04-29 1009.
  private static readonly VERSUS_PEER_WAIT_MS = 15000;
  private static readonly RESULT_PULSE_INTERVAL_MS = 1000;
  private static readonly RESULT_PEER_STALE_MS = 3500;
  private multiplayer: MultiplayerHandoff | null = null;
  private snapshotAccumMs = 0;
  private peerSnapshots: { snap: MirrorSnapshot; arr: number }[] = [];
  private peerSnapshotMap = new Map<string, { snap: MirrorSnapshot; arr: number }[]>();
  private peerOutcomeMap = new Map<string, VersusOutcome>();
  private multiplayerRoster: PeerPresence[] = [];
  private localPlayerColor = COLORS.PLAYER;
  private matchClockStartMs = 0;
  private peerEpoch: number | null = null;
  private mirrorRect: { x: number; y: number; w: number; h: number } | null = null;
  private mirrorBg: Phaser.GameObjects.Graphics | null = null;
  private mirrorEntities: Phaser.GameObjects.Graphics | null = null;
  private mirrorLabel: Phaser.GameObjects.Text | null = null;
  private mirrorWaiting: Phaser.GameObjects.Text | null = null;
  private mirrorRenderAccumMs = 0;
  private mirrorNeedsRedraw = false;
  private mirrorLaserEchoes: MirrorLaserEcho[] = [];
  private localTerminalFired = false;
  private localOutcome: VersusOutcome | null = null;
  private peerOutcome: VersusOutcome | null = null;
  private versusResultRendered = false;
  private versusPeerWaitTimer: Phaser.Time.TimerEvent | null = null;
  private localRematch = false;
  private peerRematch = false;
  /** Multi-pilot only: per-peer rematch ready state keyed by playerId. */
  private peerRematchMap = new Map<string, boolean>();
  /** Cached pilot colors snapshotted at match start; survives disconnects. */
  private versusColorByPlayerId = new Map<string, number>();
  private rematchInFlight = false;
  private peerLeft = false;
  private rematchPrimaryRefresh: (() => void) | null = null;
  private lastPeerSeenAt = 0;
  private resultPulseAccumMs = 0;
  private versusSpectating = false;

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  create(data?: MenuHandoff): void {
    this.events.once('shutdown', this.cleanup, this);
    setLayoutSize(this.scale.width, this.scale.height);
    const initialPaletteId = getSettings().paletteId;
    applyColorPalette(initialPaletteId);
    warmMusicCache(this);
    const handoff = data ?? {};
    const layout = getLayout();
    this.renderTuning = getRenderTuningProfile(layout);
    this.state = GameState.COUNTDOWN;
    this.rareSalvageTimer = 0;
    this.wormholeEventTimer = 0;
    this.wormholeEventPhase = 0;
    this.scheduledWormholePhase = this.rollScheduledWormholePhase();
    this.naturalWormholeSpawnedThisRun = false;
    this.countdownTimer = GameScene.START_COUNTDOWN_MS;
    this.resultData = null;
    this.resultUi = [];
    this.resultInputLocked = false;
    this.lastGateActive = false;
    this.activeCommSpeaker = null;
    this.activeCommPriority = 0;
    this.activeCommVisibleUntil = 0;
    this.nextGameplayCommAt = 0;
    this.pauseUi = [];
    this.pausedFromState = GameState.COUNTDOWN;
    this.regentIntroduced = false;
    this.regentEnemyAnnounced = false;
    this.regentBeamAnnounced = false;
    this.regentLastPhase = 0;
    this.enemyEntranceSfxPlayed = false;
    this.invulnerableTimer = 2000;
    this.bombPickups = [];
    this.wormholePickups = [];
    this.versusLaserPickups = [];
    this.versusLaserStrikes = [];
    this.versusLaserLastSendAt = 0;
    this.versusLaserRecvDedup = new Set<number>();
    this.versusRepulsorCharges = [];
    this.versusRepulsorApplied = new WeakSet<VersusRepulsorCharge>();
    this.versusRepulsorRecvDedup = new Set<number>();
    this.spectateLaserCharges = 0;
    this.spectateLaserAccumMs = 0;
    this.spectateEnemyCharges = 0;
    this.spectateEnemyAccumMs = 0;
    this.spectateRepulsorLastSendMs = 0;
    this.spectateInventoryUi = [];
    this.spectateLaserButtonText = null;
    this.spectateEnemyButtonText = null;
    this.spectateRepulsorButtonText = null;
    this.scoreRecordingBlocked = false;
    this.activePaletteId = initialPaletteId;
    this.restorePaletteId = initialPaletteId;
    this.pocketActive = false;
    this.pocketTimerMs = 0;
    this.pocketEntryPhase = 1;
    this.pocketRareSalvageTimer = 0;
    this.pocketBonusTimer = 0;
    this.pocketBoundaryBurnMs = 0;
    this.localTerminalFired = false;
    this.localOutcome = null;
    this.peerOutcome = null;
    this.peerSnapshotMap = new Map();
    this.peerOutcomeMap = new Map();
    this.multiplayerRoster = [];
    this.localPlayerColor = COLORS.PLAYER;
    this.versusResultRendered = false;
    this.versusSpectating = false;
    this.versusPeerWaitTimer = null;
    this.localRematch = false;
    this.peerRematch = false;
    this.peerRematchMap = new Map();
    this.versusColorByPlayerId = new Map();
    this.rematchInFlight = false;
    this.peerLeft = false;
    this.rematchPrimaryRefresh = null;
    this.lastPeerSeenAt = 0;
    this.resultPulseAccumMs = 0;
    this.starfieldAccumMs = 0;
    this.mirrorRenderAccumMs = 0;
    this.mirrorNeedsRedraw = false;
    this.mirrorLaserEchoes = [];

    this.saveSystem = new SaveSystem();
    this.runMode = handoff.multiplayer
      ? (handoff.mode ?? RunMode.VERSUS)
      : (handoff.mode ?? this.saveSystem.getSelectedMode());
    this.saveSystem.setSelectedMode(this.runMode);
    if (this.runMode === RunMode.CAMPAIGN) {
      this.saveSystem.ensureCampaignSession();
    }
    this.activeRunBoosts = this.runMode === RunMode.VERSUS
      ? null
      : (handoff.runBoosts ?? null);
    this.inputSystem = new InputSystem(this);
    this.scoreSystem = new ScoreSystem();
    this.scoreSystem.setBest(this.saveSystem.getBestScore());
    const affiliationRepSave = loadCompanyRep();
    this.affiliatedCompanyId = getLeaderboardCompanyId(affiliationRepSave);

    // Starfield background (hologram-tinted)
    this.starfield = this.add.graphics().setDepth(-1);
    this.starfieldStars = [];
    for (let i = 0; i < this.renderTuning.gameStarfieldCount; i++) {
      this.starfieldStars.push({
        x: Phaser.Math.Between(-GameScene.STARFIELD_OVERSCAN, layout.gameWidth + GameScene.STARFIELD_OVERSCAN),
        y: Phaser.Math.Between(-GameScene.STARFIELD_OVERSCAN, layout.gameHeight + GameScene.STARFIELD_OVERSCAN),
        speed: Phaser.Math.FloatBetween(3, 12),
        alpha: Phaser.Math.FloatBetween(0.1, 0.4),
        size: Phaser.Math.FloatBetween(0.5, 1.2),
        color: Math.random() < 0.6 ? COLORS.PLAYER : 0xffffff,
      });
    }
    this.drawStarfield();

    // Rotating geometric sphere behind the arena
    this.geoSphere = new GeoSphere(this);

    // Draw arena boundary (hologram style)
    this.arenaBorder = this.add.graphics().setDepth(0);
    this.redrawArenaBorder();

    // Hologram scanline overlay
    this.hologramOverlay = new HologramOverlay(this);
    this.cursor = new CustomCursor(this);
    this.slickComm = new SlickComm(this, { width: layout.gameWidth });
    this.regentComm = new RegentComm(this, { width: layout.gameWidth });

    const spawnX = layout.arenaLeft + layout.arenaWidth / 2;
    const spawnY = layout.arenaTop + layout.arenaHeight * 0.75;
    this.player = new Player(this, spawnX, spawnY);

    this.salvageSystem = new SalvageSystem(this, this.player, this.scoreSystem);
    this.collisionSystem = new CollisionSystem(this.player);
    this.extractionSystem = new ExtractionSystem(this);
    this.bankingSystem = new BankingSystem(this.player, this.scoreSystem, this.saveSystem);
    this.difficultySystem = new DifficultySystem(this, 1);

    // Carry over background entities from menu for seamless transition
    if (handoff.drifterState?.length) {
      for (const d of handoff.drifterState) {
        const drifter = DrifterHazard.createFragment(this, d.x, d.y, d.vx, d.vy, d.radiusScale);
        this.difficultySystem.getDrifters().push(drifter);
      }
    }
    if (handoff.debrisState?.length) {
      for (const d of handoff.debrisState) {
        const debris = SalvageDebris.createAt(this, d.x, d.y, d.vx, d.vy);
        this.debrisList.push(debris);
        this.salvageSystem.addDebris(debris);
      }
    }
    if (handoff.npcState?.length) {
      for (const npc of handoff.npcState) {
        this.difficultySystem.getNPCs().push(NPCShip.createAt(this, npc.x, npc.y, npc.vx, npc.vy));
      }
    }

    // Mission system — use selected missions from briefing, or reload from persistence on retry
    const missionList = this.runMode === RunMode.VERSUS
      ? []
      : (handoff.selectedMissions ?? loadOrGenerateMissions().filter((m) => m.accepted));
    this.missionSystem = new MissionSystem(missionList);
    this.repFluxTracker = new RepFluxTracker();

    // Company affiliation boosts apply in non-versus runs when handed off from Mission Select.
    if (this.activeRunBoosts) {
      this.salvageSystem.setBoosts(this.activeRunBoosts.salvageYieldMult, this.activeRunBoosts.miningYieldMult);
      this.difficultySystem.setBoosts(this.activeRunBoosts.bonusDropChanceAdd);
      this.scoreSystem.setScoreMult(this.activeRunBoosts.scoreMult);
    }
    this.salvageSystem.setPocketYieldMult(1);

    // Liaison is locked to the player's selected corp affiliation. No corp = no liaison.
    this.liaisonComm = null;
    this.liaisonCompanyId = null;
    this.liaisonRepLevel = 0;
    const repSave = loadCompanyRep();
    const affiliatedCompanyId = this.runMode === RunMode.VERSUS
      ? null
      : getCompanyAffiliation(repSave).companyId;
    if (affiliatedCompanyId) {
      this.liaisonCompanyId = affiliatedCompanyId;
      this.liaisonRepLevel = Math.max(1, getRepLevel(repSave.rep[affiliatedCompanyId] ?? 0));
      this.liaisonComm = new LiaisonComm(this, COMPANIES[affiliatedCompanyId], { width: layout.gameWidth });
    }
    this.applyGameplayCommLayout();

    // Only spawn fresh debris if none carried over
    if (this.debrisList.length === 0) {
      this.spawnDebris();
    }

    setGameplayMusicForPhase(this, 1);

    this.installDebugPhaseShortcuts();

    this.hud = new Hud(this);
    this.createPauseButton();
    this.startWarpInAt(spawnX, spawnY);
    if (this.runMode === RunMode.CAMPAIGN && (handoff.startPhase ?? 1) > 1) {
      this.applyPhaseState(handoff.startPhase ?? 1, false);
    }
    if (!this.liaisonComm || !this.liaisonCompanyId) {
      const openingLineKey = handoff.retryFromDeath && Math.random() < 0.45 ? 'gameOverRetry' : 'runStart';
      this.showSlickExclusive(getSlickLine(openingLineKey));
    }

    if (handoff.multiplayer) {
      this.scoreRecordingBlocked = true;
      this.setupMultiplayer(handoff.multiplayer);
    }

    // Liaison intro — show after Slick's opener fades
    if (this.liaisonComm && this.liaisonCompanyId) {
      const openingLiaisonKey = handoff.retryFromDeath ? 'runStart' : 'intro';
      this.showLiaisonExclusive(getLiaisonLine(this.liaisonCompanyId, this.liaisonRepLevel, openingLiaisonKey), 4200);
    }

    this.refreshPauseUi();

  }

  update(_time: number, delta: number): void {
    if (
      this.state !== GameState.COUNTDOWN &&
      this.state !== GameState.PAUSED &&
      this.state !== GameState.PLAYING &&
      this.state !== GameState.RESULTS &&
      this.state !== GameState.DEAD &&
      this.state !== GameState.EXTRACTING
    ) return;

    const paused = this.state === GameState.PAUSED;
    const runFrozen = (
      this.state === GameState.DEAD ||
      this.state === GameState.EXTRACTING ||
      this.state === GameState.RESULTS
    );
    const effectiveDelta = paused ? delta * GameScene.PAUSE_SLOW_SCALE : delta;
    const activeState = paused ? this.pausedFromState : this.state;
    const gameplayActive = activeState === GameState.PLAYING;
    const countdownActive = activeState === GameState.COUNTDOWN;

    if (!runFrozen) {
      this.updateEntryGate(effectiveDelta);
    }

    if (gameplayActive) {
      const target = paused ? null : (this.inputSystem.update(), this.inputSystem.getTarget());
      const swipe = paused ? null : this.inputSystem.getSwipe();
      this.applyBossForceToPlayer(effectiveDelta);
      this.player.update(effectiveDelta, target, swipe);
      if (this.debugInvulnerable) {
        const blink = Math.sin(this.time.now * 0.01) > 0;
        this.player.graphic.setAlpha(blink ? 1 : 0.55);
      } else if (this.invulnerableTimer > 0) {
        this.invulnerableTimer -= effectiveDelta;
        // Flicker player to indicate invulnerability
        const blink = Math.sin(this.invulnerableTimer * 0.012) > 0;
        this.player.graphic.setAlpha(blink ? 1 : 0.3);
      } else {
        this.player.graphic.setAlpha(1);
      }
    }

    // Update all debris
    for (let i = this.debrisList.length - 1; i >= 0; i--) {
      const d = this.debrisList[i];
      d.update(effectiveDelta);
      if (!d.active) {
        // Shatter effect if depleted/expired (not just drifting offscreen)
        const layout = getLayout();
        const onScreen = d.x > -40 && d.x < layout.gameWidth + 40 && d.y > -40 && d.y < layout.gameHeight + 40;
        if (onScreen) {
          const color = d.isRare ? 0xff44ff : COLORS.SALVAGE;
          this.playerDebris.push(new ShipDebris(this, d.x, d.y, d.driftVx, d.driftVy, color, 20));
        }
        if (!runFrozen && d.isRare) {
          this.maybeSpawnWormholeFromRareDebris(d, onScreen);
        }
        this.salvageSystem.removeDebris(d);
        d.destroy();
        this.debrisList.splice(i, 1);
        if (!runFrozen && !this.pocketActive && !d.isRare) {
          this.scheduleDebrisRespawn();
        }
      }
    }

    // Beams destroy salvage
    if (!runFrozen) {
      for (const beam of this.difficultySystem.getBeams()) {
        if (!beam.active || !beam.isLethal()) continue;
        const halfBeam = beam.width / 2;
        for (const debris of this.debrisList) {
          if (!debris.active) continue;
          const dist = beam.isHorizontal
            ? Math.abs(debris.y - beam.y1)
            : Math.abs(debris.x - beam.x1);
          if (dist < halfBeam + 30) {
            debris.active = false;
          }
        }
      }

      for (const debris of this.debrisList) {
        if (!debris.active) continue;
        if (this.difficultySystem.checkBossBeamHit(debris.x, debris.y, 30)) {
          debris.active = false;
        }
      }
    }

    // Ensure at least one normal debris exists or is scheduled
    const hasNormal = this.debrisList.some(d => !d.isRare);
    if (!runFrozen && !this.pocketActive && !hasNormal && !this.debrisRespawnTimer) {
      this.scheduleDebrisRespawn();
    }

    // Update shield pickups
    for (let i = this.shields.length - 1; i >= 0; i--) {
      const s = this.shields[i];
      s.update(effectiveDelta);
      if (!s.active) {
        s.destroy();
        this.shields.splice(i, 1);
        continue;
      }
      // Check pickup collision
      if (gameplayActive && !this.player.hasShield) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, s.x, s.y);
        if (dist < PLAYER_RADIUS + s.radius) {
          this.player.hasShield = true;
          playSfx(this, 'pickup');
          this.missionSystem.trackShieldCollected();
          this.tryShowSlick('shieldPickup', 0.22);
          s.active = false;
          s.destroy();
          this.shields.splice(i, 1);
          continue;
        }
      }

      if (gameplayActive) {
        for (const npc of this.difficultySystem.getNPCs()) {
          if (!npc.active || npc.hasShield) continue;
          const dist = Phaser.Math.Distance.Between(npc.x, npc.y, s.x, s.y);
          if (dist < npc.radius + s.radius) {
            npc.hasShield = true;
            s.active = false;
            s.destroy();
            this.shields.splice(i, 1);
            break;
          }
        }
      }
    }

    for (let i = this.bonusPickups.length - 1; i >= 0; i--) {
      const pickup = this.bonusPickups[i];
      pickup.update(effectiveDelta);
      if (!pickup.active) {
        pickup.destroy();
        this.bonusPickups.splice(i, 1);
        continue;
      }

      if (gameplayActive) {
        const playerDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, pickup.x, pickup.y);
        if (pickup.isCollectable() && playerDist < PLAYER_RADIUS + pickup.radius) {
          playSfx(this, 'pickup');
          this.scoreSystem.addUnbanked(pickup.points);
          this.salvageSystem.spawnRewardText(`+${pickup.points}`, pickup.x, pickup.y - 8);
          pickup.active = false;
          pickup.destroy();
          this.bonusPickups.splice(i, 1);
          continue;
        }

        let claimedByNpc = false;
        for (const npc of this.difficultySystem.getNPCs()) {
          if (!npc.active) continue;
          const npcDist = Phaser.Math.Distance.Between(npc.x, npc.y, pickup.x, pickup.y);
          if (npcDist < npc.radius + pickup.radius) {
            pickup.active = false;
            pickup.destroy();
            this.bonusPickups.splice(i, 1);
            claimedByNpc = true;
            break;
          }
        }
        if (claimedByNpc) continue;
      }
    }

    // Update bomb pickups
    for (let i = this.bombPickups.length - 1; i >= 0; i--) {
      const bomb = this.bombPickups[i];
      bomb.update(effectiveDelta);
      if (!bomb.active) {
        bomb.destroy();
        this.bombPickups.splice(i, 1);
        continue;
      }

      if (gameplayActive && bomb.isCollectable()) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, bomb.x, bomb.y);
        if (dist < PLAYER_RADIUS + bomb.radius) {
          bomb.active = false;
          bomb.destroy();
          this.bombPickups.splice(i, 1);
          this.boardWipe(true);
          return;
        }

        // NPCs can trigger bombs — wipes field and kills the player
        let claimedByNpc = false;
        for (const npc of this.difficultySystem.getNPCs()) {
          if (!npc.active) continue;
          const npcDist = Phaser.Math.Distance.Between(npc.x, npc.y, bomb.x, bomb.y);
          if (npcDist < npc.radius + bomb.radius) {
            bomb.active = false;
            bomb.destroy();
            this.bombPickups.splice(i, 1);
            this.boardWipe(true);
            this.handleDeath('asteroid');
            claimedByNpc = true;
            break;
          }
        }
        if (claimedByNpc) return;
      }
    }

    // Versus sabotage laser pickups (versus mode only — list stays empty otherwise).
    for (let i = this.wormholePickups.length - 1; i >= 0; i--) {
      const wormhole = this.wormholePickups[i];
      wormhole.update(effectiveDelta);
      if (!wormhole.active) {
        wormhole.destroy();
        this.wormholePickups.splice(i, 1);
        continue;
      }

      if (gameplayActive) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, wormhole.x, wormhole.y);
        if (wormhole.isCollectable() && dist < PLAYER_RADIUS + wormhole.radius) {
          wormhole.active = false;
          wormhole.destroy();
          this.wormholePickups.splice(i, 1);
          this.enterWormholePocket();
          break;
        }
      }
    }

    for (let i = this.versusLaserPickups.length - 1; i >= 0; i--) {
      const pickup = this.versusLaserPickups[i];
      pickup.update(effectiveDelta);
      if (!pickup.active) {
        pickup.destroy();
        this.versusLaserPickups.splice(i, 1);
        continue;
      }
      if (gameplayActive && pickup.isCollectable()) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, pickup.x, pickup.y);
        if (dist < PLAYER_RADIUS + pickup.radius) {
          pickup.active = false;
          pickup.destroy();
          this.versusLaserPickups.splice(i, 1);
          this.fireVersusLaser();
        }
      }
    }

    // Incoming versus laser strikes (lethal lane sweeps from peer).
    for (let i = this.versusLaserStrikes.length - 1; i >= 0; i--) {
      const strike = this.versusLaserStrikes[i];
      strike.update(effectiveDelta);
      if (!strike.active) {
        strike.destroy();
        this.versusLaserStrikes.splice(i, 1);
        continue;
      }
      if (gameplayActive && strike.isLethal()) {
        let playerKilled = false;
        if (!this.player.destroyed && strike.hits(this.player.x, this.player.y, PLAYER_RADIUS)) {
          // Shield absorbs the strike (matches existing beam-vs-shield contract).
          if (this.player.hasShield) {
            this.player.hasShield = false;
          } else {
            playerKilled = true;
          }
        }
        this.resolveIncomingVersusLaserStrike(strike);
        if (playerKilled) {
          const killerLabel = this.deriveKillerLabel('laser', { kind: 'laser', senderId: strike.senderId });
          this.handleDeath('laser', killerLabel);
          return;
        }
      }
    }

    // Track phase before extraction update
    const prevPhase = this.extractionSystem.getPhaseCount();

    // Extraction
    if (runFrozen) {
      this.extractionSystem.updateVisual(effectiveDelta);
    } else {
      this.extractionSystem.update(effectiveDelta);
    }

    // Phase advanced — update difficulty
    const currentPhase = this.extractionSystem.getPhaseCount();
    if (!runFrozen && !paused && gameplayActive && currentPhase !== prevPhase) {
      this.missionSystem.trackPhaseReached(currentPhase);
      this.difficultySystem.setPhase(currentPhase);
      setGameplayMusicForPhase(this, currentPhase);
      if (currentPhase >= 5 && !this.enemyEntranceSfxPlayed) {
        this.enemyEntranceSfxPlayed = true;
        playSfx(this, 'enemyEntrance');
      }
      const slickPhaseLine = Math.random() < 0.16 ? getSlickLine('phaseAdvance') : null;
      let regentPhaseLine: string | null = null;

      if (currentPhase === 2 && !this.regentIntroduced && Math.random() < 0.35) {
        regentPhaseLine = getRegentLine('threatDetected');
      } else if (currentPhase >= 3 && !this.regentIntroduced) {
        this.regentIntroduced = true;
        regentPhaseLine = getRegentLine('gateClose');
      } else if (this.regentIntroduced) {
        if (currentPhase > 7 && currentPhase > this.regentLastPhase) {
          regentPhaseLine = Math.random() < 0.25 ? getRegentLine('whyWontYouDie') : null;
        } else if (currentPhase >= 3) {
          regentPhaseLine = Math.random() < 0.18 ? getRegentLine('gateClose') : null;
        }
      }

      if (regentPhaseLine) {
        this.tryShowGameplayRegent(regentPhaseLine, 2600);
      } else if (slickPhaseLine) {
        this.tryShowGameplaySlick(slickPhaseLine);
      }

      this.regentLastPhase = currentPhase;
    }

    // Rare salvage spawning (phase 2+)
    if (!runFrozen && currentPhase >= 2) {
      this.rareSalvageTimer += effectiveDelta;
      const rareInterval = Math.max(8000, 18000 - currentPhase * 2000);
      if (this.rareSalvageTimer >= rareInterval) {
        this.spawnRareDebris(currentPhase);
        this.rareSalvageTimer = 0;
      }
    }

    this.updateScheduledWormhole(currentPhase, effectiveDelta, runFrozen, paused, gameplayActive);
    this.updatePocketLoot(effectiveDelta, runFrozen, paused, gameplayActive);

    // Assign salvage targets to NPCs
    const npcs = this.difficultySystem.getNPCs();
    for (const npc of npcs) {
      if (!npc.active) continue;

      let bestTargetX: number | null = null;
      let bestTargetY: number | null = null;
      let bestDist = Infinity;

      for (const d of this.debrisList) {
        if (!d.active || d.depleted) continue;
        const dist = Phaser.Math.Distance.Between(npc.x, npc.y, d.x, d.y);
        if (dist < bestDist) {
          bestDist = dist;
          bestTargetX = d.x;
          bestTargetY = d.y;
        }
      }

      if (!npc.hasShield) {
        for (const shield of this.shields) {
          if (!shield.active) continue;
          const dist = Phaser.Math.Distance.Between(npc.x, npc.y, shield.x, shield.y);
          if (dist < bestDist) {
            bestDist = dist;
            bestTargetX = shield.x;
            bestTargetY = shield.y;
          }
        }
      }

      for (const pickup of this.bonusPickups) {
        if (!pickup.active) continue;
        const dist = Phaser.Math.Distance.Between(npc.x, npc.y, pickup.x, pickup.y);
        if (dist < bestDist) {
          bestDist = dist;
          bestTargetX = pickup.x;
          bestTargetY = pickup.y;
        }
      }

      if (bestTargetX !== null && bestTargetY !== null) {
        npc.setTarget(bestTargetX, bestTargetY);
      } else {
        npc.clearTarget();
      }
    }

    // Difficulty system manages hazard spawning + updating
    const enemiesBefore = this.difficultySystem.getEnemies().length;
    const beamsBefore = this.difficultySystem.getBeams().length;
    if (runFrozen) {
      this.difficultySystem.updateVisualOnly(effectiveDelta, this.player.x, this.player.y);
    } else {
      this.difficultySystem.update(effectiveDelta, this.player.x, this.player.y);
    }

    // Regent: announce first enemy arrival
    if (!runFrozen && this.regentIntroduced && !this.regentEnemyAnnounced && enemiesBefore === 0 && this.difficultySystem.getEnemies().length > 0) {
      this.regentEnemyAnnounced = true;
      this.tryShowGameplayRegent(getRegentLine('enemyEnter'));
    }
    // Regent: announce first beam activation (phase 7)
    if (!runFrozen && this.regentIntroduced && !this.regentBeamAnnounced && beamsBefore === 0 && this.difficultySystem.getBeams().length > 0) {
      this.regentBeamAnnounced = true;
      this.tryShowGameplayRegent(getRegentLine('beamUnlock'));
    }

    // NPC salvage depletion — NPCs drain salvage HP when close
    if (!runFrozen) {
      for (const npc of npcs) {
        if (!npc.active || !npc.isSalvaging()) continue;
        for (const d of this.debrisList) {
          if (!d.active || d.depleted) continue;
          const dist = Phaser.Math.Distance.Between(npc.x, npc.y, d.x, d.y);
          if (dist < d.salvageRadius) {
            d.hp -= effectiveDelta / 1000;
            if (d.hp <= 0) {
              d.hp = 0;
              d.depleted = true;
            }
          }
        }
      }
    }

    // Player-NPC collisions — collision = destruction
    let invulnerable = this.isPlayerInvulnerable();

    for (const npc of npcs) {
      if (!npc.active) continue;
      const dx = npc.x - this.player.x;
      const dy = npc.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < NPC_BUMP_RADIUS && dist > 0.1) {
        if (!gameplayActive || (invulnerable && !this.player.hasShield)) continue;

        if (this.player.hasShield) {
          // Player shield absorbs hit — NPC destroyed
          this.player.hasShield = false;
          playSfx(this, 'shieldLoss');
          playSfx(this, 'playerDeath');
          this.invulnerableTimer = Math.max(this.invulnerableTimer, PLAYER_SHIELD_BREAK_INVULN_MS);
          invulnerable = true;
          npc.active = false;
          npc.killedByHazard = false;
          this.missionSystem.trackNpcKill();
          this.repFluxTracker.trackPlayerKill();
          this.playerDebris.push(new ShipDebris(this, npc.x, npc.y, npc.vx, npc.vy, npc.getHullColor(), npc.radius));
          this.bonusPickups.push(new BonusPickup(this, npc.x, npc.y, NPC_BONUS_POINTS, npc.vx * 0.5, npc.vy * 0.5));
          Overlays.shieldBreakFlash(this);
          continue;
        } else {
          // No shield — collision is lethal
          this.handleDeath('asteroid');
          return;
        }
      }
    }

    // Spawn shields from dead NPCs — inherit NPC velocity so they drift
    if (!runFrozen) {
      this.spawnPendingDifficultyDrops();
    }

    // Check extraction — player can extract any time they enter the active gate
    if (this.pocketActive && gameplayActive) {
      this.pocketTimerMs = Math.max(0, this.pocketTimerMs - effectiveDelta);
      if (this.pocketTimerMs <= 0) {
        this.exitWormholePocket('timeout');
      }
    }
    if (this.updatePocketBoundary(effectiveDelta, gameplayActive, runFrozen, paused)) {
      return;
    }
    if (this.updatePostBossEscape(effectiveDelta, gameplayActive, runFrozen, paused)) {
      return;
    }

    const activeGate = this.extractionSystem.getGate();
    if (gameplayActive && activeGate) {
      if (this.pocketActive) {
        if (activeGate.extractable && this.isPlayerInsideGate(activeGate)) {
          this.exitWormholePocket('gate');
        }
      } else if (this.bankingSystem.checkExtraction(activeGate)) {
        this.handleExtraction();
        return;
      }
    }

    // Check collisions — shield absorbs one hit and destroys/splits the asteroid
    if (gameplayActive) {
      const breachedBossCore = this.difficultySystem.updateBossCoreBreach(
        this.player.x,
        this.player.y,
        PLAYER_RADIUS,
        this.player.hasShield || this.debugInvulnerable,
      );
      if (breachedBossCore) {
        if (this.player.hasShield) {
          this.player.hasShield = false;
          playSfx(this, 'shieldLoss');
        }
        playSfx(this, 'playerDeath');
        this.invulnerableTimer = Math.max(this.invulnerableTimer, PLAYER_SHIELD_BREAK_INVULN_MS);
        invulnerable = true;
        this.missionSystem.trackEnemyKill();
        this.repFluxTracker.trackPlayerKill();
        Overlays.shieldBreakFlash(this);
        Overlays.screenShake(this, 0.012, 280);
      }
    }

    const bossHardpointIndex = this.difficultySystem.getBossHardpointCollisionIndex(this.player.x, this.player.y, PLAYER_RADIUS);
    const hitBossCore = this.difficultySystem.checkBossCoreContact(this.player.x, this.player.y, PLAYER_RADIUS);
    const debugShielded = this.debugInvulnerable;
    if (gameplayActive && bossHardpointIndex !== null && (!invulnerable || this.player.hasShield || debugShielded)) {
      this.missionSystem.trackDamageTaken();
      if (this.player.hasShield || debugShielded) {
        if (this.player.hasShield) {
          this.player.hasShield = false;
          playSfx(this, 'shieldLoss');
        }
        playSfx(this, 'playerDeath');
        this.invulnerableTimer = Math.max(this.invulnerableTimer, PLAYER_SHIELD_BREAK_INVULN_MS);
        invulnerable = true;
        this.difficultySystem.destroyBossHardpoint(bossHardpointIndex);
        Overlays.shieldBreakFlash(this);
        Overlays.screenShake(this, 0.008, 180);
      } else {
        this.handleDeath('enemy');
        return;
      }
    }

    if (gameplayActive && !invulnerable && hitBossCore && !this.player.hasShield) {
      this.handleDeath('enemy');
      return;
    }

    if (!runFrozen) {
      this.spawnPendingDifficultyDrops();
    }

    const bossEvents = this.difficultySystem.consumeBossEvents();
    if (!runFrozen && !paused) {
      if (bossEvents.spawned) {
        this.regentIntroduced = true;
        playSfx(this, 'enemyEntrance');
        Overlays.screenShake(this, 0.008, 220);
        this.tryShowGameplayRegent(getRegentLine('bossEnter'), 3400);
      }
      if (bossEvents.coreExposed) {
        this.tryShowGameplaySlick(getSlickLine('bossCoreExposed'), 3200);
      }
      if (bossEvents.destroyed) {
        this.tryShowGameplaySlick(getSlickLine('bossDestroyed'), 3400);
        this.startPostBossEscapeSequence();
      }
    }
    this.updateBossStatusUi();

    const hitDrifter = this.collisionSystem.checkDrifters(this.difficultySystem.getDrifters());
    const hitBeam = this.collisionSystem.checkBeams(this.difficultySystem.getBeams());
    const hitEnemy = this.collisionSystem.checkEnemies(this.difficultySystem.getEnemies());
    const hitBossBeam = this.difficultySystem.checkBossBeamHit(this.player.x, this.player.y, PLAYER_RADIUS);
    invulnerable = this.isPlayerInvulnerable();
    if (gameplayActive && (!invulnerable || this.player.hasShield || debugShielded) && (hitDrifter || hitBeam || hitEnemy || hitBossBeam)) {
      this.missionSystem.trackDamageTaken();
      if (this.player.hasShield || debugShielded) {
        if (this.player.hasShield) {
          this.player.hasShield = false;
        }
        if (hitDrifter) {
          playSfx(this, 'asteroidCollision');
        }
        if (!debugShielded) {
          playSfx(this, 'shieldLoss');
        }
        this.invulnerableTimer = Math.max(this.invulnerableTimer, PLAYER_SHIELD_BREAK_INVULN_MS);
        // Shield destroys or splits the asteroid it hit
        if (hitDrifter) {
          this.missionSystem.trackAsteroidsBroken();
          this.difficultySystem.shieldDestroyDrifter(hitDrifter);
        }
        // Shield destroys enemy on contact
        if (hitEnemy) {
          hitEnemy.active = false;
          this.missionSystem.trackEnemyKill();
          this.repFluxTracker.trackPlayerKill();
        }
        Overlays.shieldBreakFlash(this);
      } else {
        let deathCause: DeathCause;
        let killerLabel: string;
        if (hitBossBeam) {
          deathCause = 'laser';
          killerLabel = this.deriveKillerLabel('laser', { kind: 'bossBeam' });
        } else if (hitBeam) {
          deathCause = 'laser';
          killerLabel = this.deriveKillerLabel('laser', { kind: 'hazardBeam' });
        } else if (hitEnemy) {
          deathCause = 'enemy';
          killerLabel = this.deriveKillerLabel('enemy', { kind: 'enemy', senderId: hitEnemy.versusSenderId });
        } else if (hitDrifter) {
          deathCause = 'asteroid';
          killerLabel = this.deriveKillerLabel('asteroid', { kind: 'drifter' });
        } else {
          deathCause = 'enemy';
          killerLabel = this.deriveKillerLabel('enemy', null);
        }
        if (hitDrifter) {
          playSfx(this, 'asteroidCollision');
        }
        this.handleDeath(deathCause, killerLabel);
        return;
      }
    }

    if (gameplayActive) {
      this.applyBossSalvageMultiplier();
      this.salvageSystem.update(delta, this.difficultySystem.getDrifters());
      // Mission tracking for income sources and credit thresholds
      const frameSalvage = this.salvageSystem.getLastFrameSalvageIncome();
      const frameMining = this.salvageSystem.getLastFrameMiningIncome();
      const frameAsteroidsBroken = this.salvageSystem.getLastFrameAsteroidsBroken();
      if (frameSalvage > 0) {
        this.missionSystem.trackSalvageIncome(frameSalvage);
        this.repFluxTracker.trackSalvageIncome(frameSalvage);
      }
      if (frameMining > 0) {
        this.missionSystem.trackMiningIncome(frameMining);
        this.repFluxTracker.trackMiningIncome(frameMining);
      }
      if (frameAsteroidsBroken > 0) this.missionSystem.trackAsteroidsBroken(frameAsteroidsBroken);
      // Check for mission completions and show pop-ups
      const completions = this.missionSystem.consumeNewCompletions();
      for (const m of completions) {
        this.salvageSystem.spawnRewardText(
          `MISSION +${m.def.reward}`,
          this.player.x,
          this.player.y - 40,
          `#${COLORS.GATE.toString(16).padStart(6, '0')}`,
        );
      }
    }

    // Update player death debris
    for (let i = this.playerDebris.length - 1; i >= 0; i--) {
      this.playerDebris[i].update(effectiveDelta);
      if (!this.playerDebris[i].active) {
        this.playerDebris[i].destroy();
        this.playerDebris.splice(i, 1);
      }
    }

    this.updateStarfield(effectiveDelta);
    this.geoSphere.update(effectiveDelta);
    if (countdownActive) {
      this.updateCountdown(effectiveDelta, paused);
    }

    // Hologram overlay
    this.hologramOverlay.update(effectiveDelta);
    // Pass player coords only during active gameplay so the triangle
    // eases back to pointing up when paused or on the result screen
    const cursorTracking = !paused && !this.resultData;
    this.cursor.update(this, cursorTracking ? this.player.x : undefined, cursorTracking ? this.player.y : undefined);

    // HUD — comm triggers keyed to extractable transitions
    const gateExtractable = this.extractionSystem.isGateActive();
    const gate = this.extractionSystem.getGate();
    if (!this.pocketActive && !runFrozen && !paused && gate?.justBecameExtractable && Math.random() < 0.35) {
      this.tryShowGameplaySlick(getSlickLine('gateOpen'));
    }
    if (!this.pocketActive && !runFrozen && !paused && !gateExtractable && this.lastGateActive && Math.random() < 0.25) {
      this.tryShowGameplaySlick(getSlickLine('gateClose'), 2400);
    }
    if (!runFrozen) {
      this.lastGateActive = gateExtractable;
    }

    this.hud.update(
      this.scoreSystem.getUnbanked(),
      this.scoreSystem.getBest(),
      currentPhase,
      this.player.hasShield,
      this.runMode === RunMode.CAMPAIGN ? this.saveSystem.getCampaignLivesDisplay() : null,
      this.pocketActive ? this.pocketTimerMs : null,
    );
    this.hud.setMissionPillsHidden(
      this.isGameplayCommState()
      && this.activeCommSpeaker !== null
      && this.time.now < this.activeCommVisibleUntil,
    );
    this.hud.updateMissions(this.missionSystem.getActiveMissions());

    this.tickMultiplayer(delta);
  }

  private spawnDebris(): void {
    const debris = new SalvageDebris(this);
    this.debrisList.push(debris);
    this.salvageSystem.addDebris(debris);

    // Spawn a shield pickup near the salvage (if player doesn't have one and none exists)
    if (!this.pocketActive && !this.player.hasShield && this.shields.length === 0) {
      const offsetAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const offsetDist = debris.salvageRadius * 0.7;
      const sx = debris.x + Math.cos(offsetAngle) * offsetDist;
      const sy = debris.y + Math.sin(offsetAngle) * offsetDist;
      const shield = new ShieldPickup(this, sx, sy, debris.driftVx, debris.driftVy);
      this.shields.push(shield);
    }
  }

  private spawnPendingDifficultyDrops(): void {
    const shieldDrops = this.difficultySystem.consumeShieldDrops();
    if (!this.pocketActive && shieldDrops.length > 0) {
      playSfx(this, 'playerDeath');
    }
    for (const drop of shieldDrops) {
      if (!this.pocketActive && this.shields.length < 3) {
        this.shields.push(new ShieldPickup(this, drop.x, drop.y, drop.vx * 0.5, drop.vy * 0.5));
      }
    }

    const bonusDrops = this.difficultySystem.consumeBonusDrops();
    for (const drop of bonusDrops) {
      this.bonusPickups.push(new BonusPickup(this, drop.x, drop.y, drop.points, drop.vx, drop.vy, undefined, drop.miningBonus));
    }

    const bombDrops = this.difficultySystem.consumeBombDrops();
    for (const drop of bombDrops) {
      this.bombPickups.push(new BombPickup(this, drop.x, drop.y, drop.vx, drop.vy));
    }

    if (this.multiplayer) {
      const laserDrops = this.difficultySystem.consumeVersusLaserDrops();
      for (const drop of laserDrops) {
        this.versusLaserPickups.push(new VersusLaserPickup(this, drop.x, drop.y, drop.vx, drop.vy));
      }
    }
  }

  private updateBossStatusUi(): void {
  }

  private applyBossForceToPlayer(delta: number): void {
    const boss = this.difficultySystem.getBoss();
    if (!boss?.getForceField) return;
    const force = boss.getForceField(this.player.x, this.player.y, delta);
    const dt = delta / 1000;
    const ix = force.ax * dt + force.ix;
    const iy = force.ay * dt + force.iy;
    if (ix !== 0 || iy !== 0) {
      this.player.applyImpulse(ix, iy);
    }
  }

  private applyBossSalvageMultiplier(): void {
    const boss = this.difficultySystem.getBoss();
    const mult = boss?.getSalvageMultiplier
      ? boss.getSalvageMultiplier(this.player.x, this.player.y)
      : 1;
    this.salvageSystem.setBossYieldMult(mult);
  }

  private spawnRareDebris(phase: number): void {
    const debris = new SalvageDebris(this, {
      isRare: true,
      lifetime: 12000,
      pointsMultiplier: 4 + phase * 1.0,
    });
    this.debrisList.push(debris);
    this.salvageSystem.addDebris(debris);
  }

  private spawnPocketBonus(): void {
    const layout = getLayout();
    const margin = 36;
    const x = Phaser.Math.Between(layout.arenaLeft + margin, layout.arenaRight - margin);
    const y = Phaser.Math.Between(layout.arenaTop + margin, layout.arenaBottom - margin);
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const speed = Phaser.Math.FloatBetween(35, 85);
    this.bonusPickups.push(new BonusPickup(
      this,
      x,
      y,
      WORMHOLE_POCKET_BONUS_POINTS,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      0,
    ));
  }

  private updatePocketLoot(delta: number, runFrozen: boolean, paused: boolean, gameplayActive: boolean): void {
    if (!this.pocketActive || runFrozen || paused || !gameplayActive) {
      return;
    }

    this.pocketRareSalvageTimer += delta;
    while (this.pocketRareSalvageTimer >= WORMHOLE_POCKET_RARE_SALVAGE_INTERVAL_MS) {
      this.pocketRareSalvageTimer -= WORMHOLE_POCKET_RARE_SALVAGE_INTERVAL_MS;
      this.spawnRareDebris(this.extractionSystem.getPhaseCount());
    }

    this.pocketBonusTimer += delta;
    while (this.pocketBonusTimer >= WORMHOLE_POCKET_BONUS_INTERVAL_MS) {
      this.pocketBonusTimer -= WORMHOLE_POCKET_BONUS_INTERVAL_MS;
      this.spawnPocketBonus();
    }
  }

  private updatePocketBoundary(delta: number, gameplayActive: boolean, runFrozen: boolean, paused: boolean): boolean {
    if (!this.pocketActive) {
      this.pocketBoundaryBurnMs = 0;
      this.pocketBoundaryGraphic?.setVisible(false);
      return false;
    }

    this.drawPocketBoundary();
    if (runFrozen || paused || !gameplayActive) {
      return false;
    }

    const layout = getLayout();
    const radius = this.getPocketBoundaryRadius();
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, layout.centerX, layout.centerY);
    return this.updateCollapsingBoundaryBurn(delta, dist + PLAYER_RADIUS > radius);
  }

  private getPocketBoundaryRadius(): number {
    const layout = getLayout();
    const startRadius = Math.sqrt(layout.arenaWidth * layout.arenaWidth + layout.arenaHeight * layout.arenaHeight) * 0.58;
    const endRadius = Math.min(layout.arenaWidth, layout.arenaHeight) * WORMHOLE_POCKET_BOUNDARY_END_RADIUS_MULT;
    const progress = 1 - Phaser.Math.Clamp(this.pocketTimerMs / WORMHOLE_POCKET_DURATION_MS, 0, 1);
    return Phaser.Math.Linear(startRadius, endRadius, progress);
  }

  private drawPocketBoundary(): void {
    const progress = 1 - Phaser.Math.Clamp(this.pocketTimerMs / WORMHOLE_POCKET_DURATION_MS, 0, 1);
    this.drawCollapsingBoundary(this.getPocketBoundaryRadius(), progress);
  }

  private drawCollapsingBoundary(radius: number, progress: number): void {
    if (!this.pocketBoundaryGraphic) {
      this.pocketBoundaryGraphic = this.add.graphics().setDepth(7);
    }

    const layout = getLayout();
    const g = this.pocketBoundaryGraphic;
    const pulse = 0.5 + Math.sin(this.time.now * 0.012) * 0.5;
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, layout.centerX, layout.centerY);
    const outside = dist + PLAYER_RADIUS > radius;
    const burn = Phaser.Math.Clamp(this.pocketBoundaryBurnMs / WORMHOLE_POCKET_BOUNDARY_BURN_MS, 0, 1);

    g.setVisible(true);
    g.clear();

    const dangerAlpha = 0.16 + progress * 0.12 + (outside ? burn * 0.12 + pulse * 0.035 : 0);
    g.fillStyle(COLORS.BEAM, dangerAlpha);
    g.beginPath();
    g.moveTo(layout.arenaLeft, layout.arenaTop);
    g.lineTo(layout.arenaRight, layout.arenaTop);
    g.lineTo(layout.arenaRight, layout.arenaBottom);
    g.lineTo(layout.arenaLeft, layout.arenaBottom);
    g.closePath();
    g.moveTo(layout.centerX + radius, layout.centerY);
    g.arc(layout.centerX, layout.centerY, radius, 0, Math.PI * 2, false);
    g.closePath();
    g.fillPath();

    g.lineStyle(2.5 + pulse * 1.5, outside ? COLORS.BEAM : COLORS.GATE, outside ? 0.85 : 0.55 + progress * 0.25);
    g.strokeCircle(layout.centerX, layout.centerY, radius);
    g.lineStyle(1, COLORS.HUD, 0.18 + pulse * 0.16);
    g.strokeCircle(layout.centerX, layout.centerY, radius + 10 + pulse * 8);
    g.lineStyle(1, COLORS.GATE, 0.08 + progress * 0.1);
    g.strokeCircle(layout.centerX, layout.centerY, radius + 22 + pulse * 5);

    const tickCount = 24;
    const tickLen = 8 + progress * 10;
    const rotation = this.time.now * 0.0008;
    g.lineStyle(1.2, outside ? COLORS.BEAM : COLORS.GATE, outside ? 0.55 : 0.28);
    for (let i = 0; i < tickCount; i += 1) {
      const a = rotation + i * ((Math.PI * 2) / tickCount);
      const inner = radius + tickLen * 0.2;
      const outer = radius + tickLen;
      g.lineBetween(
        layout.centerX + Math.cos(a) * inner,
        layout.centerY + Math.sin(a) * inner,
        layout.centerX + Math.cos(a) * outer,
        layout.centerY + Math.sin(a) * outer,
      );
    }
  }

  private updateCollapsingBoundaryBurn(delta: number, outside: boolean): boolean {
    if (!outside) {
      this.pocketBoundaryBurnMs = Math.max(0, this.pocketBoundaryBurnMs - delta * 1.8);
      return false;
    }

    this.pocketBoundaryBurnMs += delta;
    if (this.pocketBoundaryBurnMs < WORMHOLE_POCKET_BOUNDARY_BURN_MS) {
      return false;
    }

    this.missionSystem.trackDamageTaken();
    this.pocketBoundaryBurnMs = 0;
    if (this.player.hasShield) {
      this.player.hasShield = false;
      this.invulnerableTimer = Math.max(this.invulnerableTimer, PLAYER_SHIELD_BREAK_INVULN_MS);
      playSfx(this, 'shieldLoss');
      Overlays.shieldBreakFlash(this);
      Overlays.screenShake(this, 0.01, 220);
      return false;
    }

    if (this.debugInvulnerable) {
      Overlays.screenShake(this, 0.006, 160);
      return false;
    }

    playSfx(this, 'playerDeath');
    this.handleDeath('laser');
    return true;
  }

  private startPostBossEscapeSequence(): void {
    if (this.multiplayer || this.pocketActive || this.postBossEscapePending || this.postBossCollapseActive) {
      return;
    }

    this.postBossEscapePending = true;
    this.postBossEscapeTimerMs = POST_BOSS_EXTRACT_DELAY_MS;
    this.postBossCollapseActive = false;
    this.postBossCollapseTimerMs = 0;
    this.pocketBoundaryBurnMs = 0;
    this.extractionSystem.setNormalGateSuppressed(true);
  }

  private updatePostBossEscape(delta: number, gameplayActive: boolean, runFrozen: boolean, paused: boolean): boolean {
    if (this.pocketActive) {
      return false;
    }

    if (this.postBossEscapePending && !runFrozen && !paused && gameplayActive) {
      this.postBossEscapeTimerMs = Math.max(0, this.postBossEscapeTimerMs - delta);
      if (this.postBossEscapeTimerMs <= 0) {
        this.postBossEscapePending = false;
        this.postBossCollapseActive = true;
        this.postBossCollapseTimerMs = POST_BOSS_COLLAPSE_DURATION_MS;
        this.pocketBoundaryBurnMs = 0;
        this.extractionSystem.forceGate(0, POST_BOSS_ESCAPE_GATE_DURATION_MS);
        this.difficultySystem.startPostBossEscapeSurge();
        playSfx(this, 'enemyEntrance');
        Overlays.beamWarningFlash(this);
        Overlays.screenShake(this, 0.012, 260);
        this.tryShowGameplaySlick(getSlickLine('gateOpen'), 2600);
      }
    }

    if (!this.postBossCollapseActive) {
      return false;
    }

    this.drawPostBossCollapseBoundary();
    if (runFrozen || paused || !gameplayActive) {
      return false;
    }

    this.postBossCollapseTimerMs = Math.max(0, this.postBossCollapseTimerMs - delta);
    const layout = getLayout();
    const radius = this.getPostBossCollapseRadius();
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, layout.centerX, layout.centerY);
    return this.updateCollapsingBoundaryBurn(delta, dist + PLAYER_RADIUS > radius);
  }

  private getPostBossCollapseRadius(): number {
    const layout = getLayout();
    const startRadius = Math.sqrt(layout.arenaWidth * layout.arenaWidth + layout.arenaHeight * layout.arenaHeight) * 0.58;
    const endRadius = Math.min(layout.arenaWidth, layout.arenaHeight) * WORMHOLE_POCKET_BOUNDARY_END_RADIUS_MULT;
    const progress = 1 - Phaser.Math.Clamp(this.postBossCollapseTimerMs / POST_BOSS_COLLAPSE_DURATION_MS, 0, 1);
    return Phaser.Math.Linear(startRadius, endRadius, progress);
  }

  private drawPostBossCollapseBoundary(): void {
    const progress = 1 - Phaser.Math.Clamp(this.postBossCollapseTimerMs / POST_BOSS_COLLAPSE_DURATION_MS, 0, 1);
    this.drawCollapsingBoundary(this.getPostBossCollapseRadius(), progress);
  }

  private clearPostBossEscapeSequence(): void {
    this.postBossEscapePending = false;
    this.postBossEscapeTimerMs = 0;
    this.postBossCollapseActive = false;
    this.postBossCollapseTimerMs = 0;
    this.pocketBoundaryBurnMs = 0;
    this.pocketBoundaryGraphic?.setVisible(false);
    this.extractionSystem.setNormalGateSuppressed(false);
  }

  private scheduleDebrisRespawn(): void {
    this.debrisRespawnTimer = this.time.delayedCall(SALVAGE_RESPAWN_DELAY, () => {
      if (
        this.state === GameState.COUNTDOWN ||
        this.state === GameState.PLAYING ||
        this.state === GameState.PAUSED
      ) {
        this.spawnDebris();
      }
      this.debrisRespawnTimer = null;
    });
  }

  private handleDeath(cause: DeathCause, killerLabel?: string): void {
    this.clearPostBossEscapeSequence();
    const bankedScore = this.scoreSystem.getBanked();
    const lostScore = this.scoreSystem.getUnbanked();
    const campaignSession = this.runMode === RunMode.CAMPAIGN
      ? this.saveSystem.getCampaignSession()
      : null;
    const missionProgress = this.missionSystem.getActiveMissions().map((m) => ({
      label: m.def.label,
      progress: Math.floor(m.progress),
      target: m.def.target,
      completed: m.completed,
      reward: m.def.reward,
      repGain: REP_PER_TIER[m.def.tier],
    }));
    this.missionSystem.save();
    let campaignLivesRemaining: number | undefined;
    let campaignMissionsCompleted: number | undefined = campaignSession?.missionsCompleted;
    let campaignTotalExtracted: number | undefined = campaignSession?.totalExtracted;
    let campaignGameOver = false;
    let campaignSoftRespawn = false;
    if (this.runMode === RunMode.CAMPAIGN && !this.scoreRecordingBlocked) {
      const totalExtractedBefore = campaignSession?.totalExtracted ?? this.saveSystem.getCampaignTotalExtractedDisplay();
      const campaignLifeLoss = this.saveSystem.consumeCampaignLife();
      campaignLivesRemaining = campaignLifeLoss.livesRemaining;
      campaignMissionsCompleted = campaignLifeLoss.missionsCompleted;
      campaignGameOver = campaignLifeLoss.gameOver;
      campaignSoftRespawn = !campaignLifeLoss.gameOver;
      campaignTotalExtracted = totalExtractedBefore;
      if (campaignLifeLoss.gameOver) {
        const playerName = this.saveSystem.getPlayerName();
        const companyId = getLeaderboardCompanyId(loadCompanyRep());
        submitScore(playerName, totalExtractedBefore, companyId, runModeToLeaderboardMode(this.runMode));
        this.saveSystem.recordCampaignLeaderboardEntry(totalExtractedBefore, campaignLifeLoss.missionsCompleted);
      }
    } else if (this.runMode === RunMode.CAMPAIGN) {
      campaignLivesRemaining = this.saveSystem.getCampaignLivesDisplay();
      campaignMissionsCompleted = this.saveSystem.getCampaignMissionsCompletedDisplay();
      campaignTotalExtracted = this.saveSystem.getCampaignTotalExtractedDisplay();
    } else if (!this.scoreRecordingBlocked) {
      const playerName = this.saveSystem.getPlayerName();
      const companyId = getLeaderboardCompanyId(loadCompanyRep());
      submitLoss(playerName, lostScore, companyId, runModeToLeaderboardMode(this.runMode));
    }
    let repFluxDeltas: RepDeltaMap | undefined;
    // Rep flux only fires when the run actually ends (final death or extract). Soft-respawn defers it.
    if (!this.scoreRecordingBlocked && !campaignSoftRespawn) {
      const requested = this.repFluxTracker.computeDeltas('death', this.affiliatedCompanyId);
      const applied = applyRepDeltas(requested);
      if (hasAnyRepDelta(applied)) {
        repFluxDeltas = applied;
      }
    }
    this.resultData = {
      score: bankedScore,
      lostScore,
      cause: 'death',
      mode: this.runMode,
      scoreRecorded: !this.scoreRecordingBlocked,
      campaignLivesRemaining,
      campaignMissionsCompleted,
      campaignTotalExtracted,
      campaignGameOver,
      missionProgress,
      repFluxDeltas,
    };
    this.state = GameState.DEAD;
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.hidePauseMenu();
    this.refreshPauseUi();
    playSfx(this, 'playerDeath');
    if (!campaignSoftRespawn && !this.multiplayer) {
      setResultMusic(this);
    }
    const currentPhase = this.extractionSystem.getPhaseCount();
    if (cause === 'enemy' || cause === 'laser' || currentPhase >= 5) {
      this.slickComm.hide();
      this.showRegentExclusive(getRegentLine('killTaunt'), 0);
    } else {
      const slickDeathKey = Math.random() < 0.35 ? 'death' : 'hazardDeath';
      this.showSlickExclusive(getSlickLine(slickDeathKey), 0);
    }
    this.playerDebris.push(new ShipDebris(
      this, this.player.x, this.player.y,
      this.player.getVelocityX(), this.player.getVelocityY(),
      COLORS.PLAYER, 8,
    ));
    this.player.setDestroyedVisual(true);
    this.player.graphic.setAlpha(0);
    Overlays.screenShake(this, 0.014, 350);
    if (campaignSoftRespawn) {
      this.softRespawnForCampaign();
      return;
    }
    if (this.multiplayer) {
      this.broadcastLocalTerminal({
        cause: 'death',
        score: bankedScore + lostScore,
        time: Date.now() - this.matchClockStartMs,
        phase: this.extractionSystem.getPhaseCount(),
        deathCause: cause,
        killer: killerLabel ?? this.deriveKillerLabel(cause, null),
      });
    }
    Overlays.screenWipe(
      this,
      0xff3366,
      0.55,
      () => {
        this.enterResultsState();
      },
      { duration: 350, hold: 120 },
    );
  }

  private softRespawnForCampaign(): void {
    this.exitWormholePocket('timeout');
    // Wipe arena (no kill credit — this is the cost of dying, not a clear).
    this.clearBoard(true, false);
    for (const b of this.bombPickups) b.destroy();
    this.bombPickups = [];
    for (const p of this.versusLaserPickups) p.destroy();
    this.versusLaserPickups = [];
    for (const s of this.versusLaserStrikes) s.destroy();
    this.versusLaserStrikes = [];
    for (const p of this.bonusPickups) p.destroy();
    this.bonusPickups = [];
    this.scoreSystem.clearUnbanked();

    const layout = getLayout();
    const spawnX = layout.arenaLeft + layout.arenaWidth / 2;
    const spawnY = layout.arenaTop + layout.arenaHeight * 0.75;
    this.player.respawn(spawnX, spawnY);
    this.invulnerableTimer = 2000;
    this.resultData = null;
    this.startWarpInAt(spawnX, spawnY, {
      durationMs: GameScene.CAMPAIGN_RESPAWN_WARP_MS,
      showText: false,
    });
    this.refreshPauseUi();
    setGameplayMusicForPhase(this, this.extractionSystem.getPhaseCount());
  }

  private handleExtraction(): void {
    this.clearPostBossEscapeSequence();
    this.state = GameState.EXTRACTING;
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.hidePauseMenu();
    this.refreshPauseUi();
    this.playGateTravelSfx();
    if (!this.multiplayer) {
      setResultMusic(this);
    }
    const scoreRecorded = !this.scoreRecordingBlocked;
    let missionBonus = 0;
    if (scoreRecorded) {
      // Check mission completion on extraction
      this.missionSystem.trackCreditsExtracted(this.scoreSystem.getBanked());
      this.missionSystem.checkExtraction();
      missionBonus = this.missionSystem.getCompletedReward();
    }
    // Capture mission progress before clearing completed missions
    const missionProgress = this.missionSystem.getActiveMissions().map((m) => ({
      label: m.def.label,
      progress: Math.floor(m.progress),
      target: m.def.target,
      completed: m.completed,
      reward: m.def.reward,
      repGain: REP_PER_TIER[m.def.tier],
    }));
    const completedMissionCount = missionProgress.filter((m) => m.completed).length;
    const missionRepEarned = missionProgress.reduce((total, mission) => (
      mission.completed ? total + mission.repGain : total
    ), 0);
    if (missionBonus > 0) {
      this.scoreSystem.addBanked(missionBonus);
    }
    const score = this.scoreSystem.getBanked();
    let walletDeposit = {
      payout: 0,
      slickCut: 0,
      walletBalance: this.saveSystem.getWalletCredits(this.runMode),
    };
    let campaignMissionsCompleted = this.runMode === RunMode.CAMPAIGN
      ? this.saveSystem.getCampaignMissionsCompletedDisplay()
      : undefined;
    let campaignTotalExtracted = this.runMode === RunMode.CAMPAIGN
      ? this.saveSystem.getCampaignTotalExtractedDisplay()
      : undefined;
    let repFluxDeltas: RepDeltaMap | undefined;
    if (scoreRecorded) {
      this.missionSystem.claimAndClear();
      if (this.runMode === RunMode.CAMPAIGN && completedMissionCount > 0) {
        campaignMissionsCompleted = this.saveSystem.addCampaignMissionCompletions(completedMissionCount).missionsCompleted;
      }
      walletDeposit = this.saveSystem.depositWalletPayout(score, this.runMode);
      if (this.runMode === RunMode.CAMPAIGN && score > 0) {
        campaignTotalExtracted = this.saveSystem.addCampaignExtractedCredits(score).totalExtracted;
      }
      this.bankingSystem.finalizeExtraction(this.runMode);
      const requested = this.repFluxTracker.computeDeltas('extract', this.affiliatedCompanyId);
      const applied = applyRepDeltas(requested);
      if (hasAnyRepDelta(applied)) {
        repFluxDeltas = applied;
      }
    }
    this.resultData = {
      score,
      cause: 'extract',
      mode: this.runMode,
      scoreRecorded,
      missionBonus: missionBonus > 0 ? missionBonus : undefined,
      missionRepEarned: missionRepEarned > 0 ? missionRepEarned : undefined,
      walletPayout: walletDeposit.payout,
      slickCut: walletDeposit.slickCut,
      walletBalance: walletDeposit.walletBalance,
      campaignLivesRemaining: this.runMode === RunMode.CAMPAIGN ? this.saveSystem.getCampaignLivesDisplay() : undefined,
      campaignMissionsCompleted,
      campaignTotalExtracted,
      missionProgress,
      repFluxDeltas,
    };
    if (this.multiplayer) {
      this.broadcastLocalTerminal({
        cause: 'extract',
        score,
        time: Date.now() - this.matchClockStartMs,
        phase: this.extractionSystem.getPhaseCount(),
      });
    }
    this.showSlickExclusive(getSlickLine('extraction'), 0);
    this.clearBoard();
    Overlays.bombFlash(this);
    Overlays.screenWipe(this, 0x44ff88, 0.5, () => {
      this.enterResultsState();
    });
  }

  private tryShowSlick(
    key: Parameters<typeof getSlickLine>[0],
    chance: number,
    autoHideMs?: number,
  ): void {
    if (Math.random() >= chance) return;
    this.tryShowGameplaySlick(getSlickLine(key), autoHideMs);
  }

  private tryShowGameplaySlick(message: string, autoHideMs?: number): boolean {
    return this.tryShowGameplayComm('slick', message, autoHideMs);
  }

  private tryShowGameplayRegent(message: string, autoHideMs?: number): boolean {
    return this.tryShowGameplayComm('regent', message, autoHideMs, {
      allowInterrupt: this.regentIntroduced,
      ignoreCooldown: this.regentIntroduced,
    });
  }

  private tryShowGameplayComm(
    speaker: CommSpeaker,
    message: string,
    autoHideMs?: number,
    options: GameplayCommOptions = {},
  ): boolean {
    if (!this.isGameplayCommState()) return false;

    this.syncCommState();
    const now = this.time.now;
    const priority = this.getCommPriority(speaker);
    const commVisible = this.activeCommSpeaker !== null && now < this.activeCommVisibleUntil;

    if (commVisible) {
      if (!(options.allowInterrupt && priority > this.activeCommPriority)) {
        return false;
      }
    } else if (now < this.nextGameplayCommAt && !options.ignoreCooldown) {
      return false;
    }

    this.showCommNow(speaker, message, autoHideMs);
    return true;
  }

  private isGameplayCommState(): boolean {
    return (
      this.state === GameState.COUNTDOWN ||
      this.state === GameState.PLAYING ||
      this.state === GameState.PAUSED
    );
  }

  private syncCommState(): void {
    if (this.activeCommVisibleUntil === Number.POSITIVE_INFINITY) return;
    if (this.time.now < this.activeCommVisibleUntil) return;
    this.activeCommSpeaker = null;
    this.activeCommPriority = 0;
    this.activeCommVisibleUntil = 0;
  }

  private getCommPriority(speaker: CommSpeaker): number {
    if (speaker === 'regent') {
      return this.regentIntroduced ? 3 : 2;
    }
    return speaker === 'slick' ? 2 : 1;
  }

  private getCommDuration(speaker: CommSpeaker, autoHideMs?: number): number {
    return autoHideMs ?? GameScene.DEFAULT_COMM_HIDE_MS[speaker];
  }

  private hideOtherComms(activeSpeaker: CommSpeaker): void {
    if (activeSpeaker !== 'slick') this.slickComm.hide();
    if (activeSpeaker !== 'regent') this.regentComm.hide();
    if (activeSpeaker !== 'liaison') this.liaisonComm?.hide();
  }

  private clearCommState(): void {
    this.activeCommSpeaker = null;
    this.activeCommPriority = 0;
    this.activeCommVisibleUntil = 0;
    this.nextGameplayCommAt = this.time.now;
  }

  private showCommNow(
    speaker: CommSpeaker,
    message: string,
    autoHideMs?: number,
  ): void {
    const duration = this.getCommDuration(speaker, autoHideMs);
    this.hideOtherComms(speaker);

    if (speaker === 'slick') {
      this.slickComm.show(message, duration);
    } else if (speaker === 'regent') {
      this.regentComm.show(message, duration);
    } else {
      this.liaisonComm?.show(message, duration);
    }

    this.activeCommSpeaker = speaker;
    this.activeCommPriority = this.getCommPriority(speaker);
    this.activeCommVisibleUntil = duration > 0 ? this.time.now + duration : Number.POSITIVE_INFINITY;
    this.nextGameplayCommAt = duration > 0
      ? this.activeCommVisibleUntil + GameScene.GAMEPLAY_COMM_GAP_MS
      : Number.POSITIVE_INFINITY;
  }

  private showSlickExclusive(message: string, autoHideMs?: number): void {
    this.showCommNow('slick', message, autoHideMs);
  }

  private showRegentExclusive(message: string, autoHideMs?: number): void {
    this.showCommNow('regent', message, autoHideMs);
  }

  private showLiaisonExclusive(message: string, autoHideMs?: number): void {
    this.showCommNow('liaison', message, autoHideMs);
  }

  private cleanup(): void {
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.inputSystem.destroy();
    this.scoreSystem.destroy();
    this.salvageSystem.destroy();
    this.collisionSystem.destroy();
    this.extractionSystem.destroy();
    this.bankingSystem.destroy();
    this.difficultySystem.destroy();
    this.missionSystem.destroy();
    this.player.destroy();
    for (const d of this.debrisList) d.destroy();
    this.debrisList = [];
    for (const s of this.shields) s.destroy();
    this.shields = [];
    for (const bonus of this.bonusPickups) bonus.destroy();
    this.bonusPickups = [];
    for (const bomb of this.bombPickups) bomb.destroy();
    this.bombPickups = [];
    for (const wormhole of this.wormholePickups) wormhole.destroy();
    this.wormholePickups = [];
    this.pocketBoundaryGraphic?.destroy();
    this.pocketBoundaryGraphic = null;
    for (const p of this.versusLaserPickups) p.destroy();
    this.versusLaserPickups = [];
    for (const s of this.versusLaserStrikes) s.destroy();
    this.versusLaserStrikes = [];
    for (const charge of this.versusRepulsorCharges) charge.destroy();
    this.versusRepulsorCharges = [];
    this.versusRepulsorApplied = new WeakSet<VersusRepulsorCharge>();
    this.tearDownSpectateInventoryUi();
    for (const pd of this.playerDebris) pd.destroy();
    this.playerDebris = [];
    if (this.debrisRespawnTimer) {
      this.debrisRespawnTimer.destroy();
      this.debrisRespawnTimer = null;
    }
    if (this.entryGate) {
      this.entryGate.destroy();
      this.entryGate = null;
    }
    if (this.countdownText) {
      this.countdownText.destroy();
      this.countdownText = null;
    }
    this.hidePauseMenu();
    this.pauseButtonBg.destroy();
    this.pauseButtonText.destroy();
    this.pauseButtonHit.destroy();
    this.clearResultUi();
    this.hud.destroy();
    this.clearCommState();
    this.slickComm.destroy();
    this.regentComm.destroy();
    this.liaisonComm?.destroy();
    this.liaisonComm = null;
    this.hologramOverlay.destroy();
    this.cursor.destroy(this);
    this.geoSphere.destroy();
    this.starfield.destroy();
    this.arenaBorder.destroy();
    this.teardownMultiplayer();
  }

  private setupMultiplayer(handoff: MultiplayerHandoff): void {
    this.multiplayer = handoff;
    this.multiplayerRoster = handoff.session.getActivePlayers();
    // Cache the initial roster->color mapping so disconnects do not shift the
    // remaining pilots' indexes (and therefore their colors) in the standings.
    this.versusColorByPlayerId.clear();
    for (const pilot of this.multiplayerRoster) {
      this.versusColorByPlayerId.set(pilot.playerId, handoff.session.getPlayerColor(pilot.playerId));
    }
    this.localPlayerColor = this.versusColorByPlayerId.get(handoff.session.playerId)
      ?? handoff.session.getPlayerColor(handoff.session.playerId);
    this.player.setAccentColor(this.localPlayerColor);
    this.matchClockStartMs = Date.now();
    // Versus mode: enable sabotage laser drops on enemy/NPC kills.
    this.difficultySystem.setVersusLasersEnabled(true);
    this.snapshotAccumMs = 0;
    this.peerSnapshots = [];
    this.peerEpoch = null;
    this.lastPeerSeenAt = Date.now();
    this.resultPulseAccumMs = 0;
    this.mirrorRenderAccumMs = 0;
    this.mirrorNeedsRedraw = true;

    handoff.session.onBroadcast(NET_EVENT.SNAPSHOT, (payload) => {
      const snap = payload as MirrorSnapshot | undefined;
      if (!snap || typeof snap.t !== 'number') return;
      const senderId = snap.senderId ?? handoff.peerId;
      this.recordPeerSnapshot(senderId, snap);
      if (senderId !== handoff.peerId) return;
      this.notePeerSeen();
      // Detect peer-side new round: a different epoch means the peer reset its
      // matchClockStartMs (rematch). Drop the prior round's buffered snapshots
      // so the peer's old extract pose cannot keep rendering, and so the
      // `t < last.t` filter below does not reject the new round's low-t
      // snapshots as "out of order".
      const incomingEpoch = typeof snap.epoch === 'number' ? snap.epoch : null;
      if (incomingEpoch !== null && this.peerEpoch !== null && incomingEpoch !== this.peerEpoch) {
        this.peerSnapshots = [];
      }
      if (incomingEpoch !== null) {
        this.peerEpoch = incomingEpoch;
      }
      const last = this.peerSnapshots[this.peerSnapshots.length - 1];
      if (last && snap.t < last.snap.t) return;
      this.peerSnapshots.push({ snap, arr: Date.now() });
      if (this.peerSnapshots.length > 2) this.peerSnapshots.shift();
      this.reconcileMirrorLaserEchoes(snap.lasers ?? []);
      this.mirrorNeedsRedraw = true;
    });

    handoff.session.onBroadcast(NET_EVENT.MATCH_EXTRACT, (payload) => {
      const p = payload as MatchExtractPayload | undefined;
      if (!p || typeof p.score !== 'number') return;
      const senderId = p.senderId ?? handoff.peerId;
      this.notePeerSeen();
      this.peerOutcomeMap.set(senderId, {
        cause: 'extract',
        score: Math.round(p.score),
        time: typeof p.time === 'number' ? p.time : 0,
        phase: this.getLatestPeerPhase(senderId),
      });
      if (senderId === handoff.peerId && !this.peerOutcome) {
        this.peerOutcome = {
          cause: 'extract',
          score: Math.round(p.score),
          time: typeof p.time === 'number' ? p.time : 0,
          phase: this.getLatestPeerPhase(),
        };
      }
      if (senderId === handoff.peerId) {
        this.onPeerTerminal();
      } else {
        this.maybeResolveMultiPilotResult();
      }
    });

    handoff.session.onBroadcast(NET_EVENT.MATCH_REMATCH_READY, (payload) => {
      this.notePeerSeen();
      if (this.rematchInFlight) return;
      const p = payload as MatchRematchPayload | undefined;
      const senderId = p?.senderId;
      if (senderId && senderId !== handoff.session.playerId) {
        this.peerRematchMap.set(senderId, true);
      }
      this.peerRematch = true;
      this.refreshRematchUi();
      this.maybeFireRematch();
    });

    handoff.session.onBroadcast(NET_EVENT.MATCH_REMATCH_CANCEL, (payload) => {
      this.notePeerSeen();
      if (this.rematchInFlight) return;
      const p = payload as MatchRematchPayload | undefined;
      const senderId = p?.senderId;
      if (senderId && senderId !== handoff.session.playerId) {
        this.peerRematchMap.set(senderId, false);
      }
      this.peerRematch = false;
      this.refreshRematchUi();
    });

    handoff.session.onBroadcast(NET_EVENT.MATCH_RESULT_PULSE, () => {
      this.notePeerSeen();
    });

    handoff.session.onPresence((peers) => {
      if (this.rematchInFlight) return;
      const peerStillHere = peers.some((p) => p.playerId !== handoff.session.playerId);
      if (peerStillHere) {
        this.notePeerSeen();
      }
      if (!peerStillHere && this.versusResultRendered) {
        this.peerLeft = true;
        this.peerRematch = false;
        this.refreshRematchUi();
      }
      if (this.isMultiPilotVersus()) {
        const presentIds = new Set(peers.map((p) => p.playerId));
        const roster = this.multiplayerRoster.length
          ? this.multiplayerRoster
          : handoff.session.getActivePlayers();
        const localId = handoff.session.playerId;
        let synthesized = false;
        for (const pilot of roster) {
          if (pilot.playerId === localId) continue;
          if (presentIds.has(pilot.playerId)) continue;
          this.peerRematchMap.delete(pilot.playerId);
          if (this.peerOutcomeMap.has(pilot.playerId)) continue;
          this.peerSnapshotMap.delete(pilot.playerId);
          this.peerOutcomeMap.set(pilot.playerId, {
            cause: 'death',
            score: this.getLatestPeerScore(pilot.playerId),
            time: 0,
            phase: this.getLatestPeerPhase(pilot.playerId),
          });
          synthesized = true;
        }
        if (synthesized) {
          this.maybeResolveMultiPilotResult();
        }
        this.refreshRematchUi();
        this.maybeFireRematch();
      }
    });

    handoff.session.onBroadcast(NET_EVENT.MATCH_REPULSOR, (payload) => {
      const p = payload as MatchRepulsorPayload | undefined;
      if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') return;
      if (p.senderId && p.senderId === handoff.session.playerId) return;
      if (p.targetId && p.targetId !== handoff.session.playerId) return;
      this.notePeerSeen();
      if (typeof p.t === 'number') {
        if (this.versusRepulsorRecvDedup.has(p.t)) return;
        this.versusRepulsorRecvDedup.add(p.t);
      }
      this.spawnIncomingRepulsor(p.x, p.y);
    });

    handoff.session.onBroadcast(NET_EVENT.MATCH_LASER, (payload) => {
      const p = payload as MatchLaserPayload | undefined;
      const validLanes: VersusLaserLane[] = ['top', 'middle', 'bottom', 'left', 'center', 'right'];
      if (!p || !validLanes.includes(p.lane as VersusLaserLane)) return;
      if (p.senderId && p.senderId === handoff.session.playerId) return;
      if (p.targetId && p.targetId !== handoff.session.playerId) return;
      this.notePeerSeen();
      // Dedupe by sender timestamp; Supabase broadcast can occasionally
      // double-deliver, and an exact-match spawn would double the lethal sweep.
      if (typeof p.t === 'number') {
        if (this.versusLaserRecvDedup.has(p.t)) return;
        this.versusLaserRecvDedup.add(p.t);
      }
      this.spawnIncomingVersusLaser(p.lane, p.color ?? this.getVersusColorForPlayer(p.senderId), p.senderId);
    });

    handoff.session.onBroadcast(NET_EVENT.MATCH_ENEMY, (payload) => {
      const p = payload as MatchEnemyPayload | undefined;
      if (!p) return;
      if (p.senderId && p.senderId === handoff.session.playerId) return;
      if (p.targetId && p.targetId !== handoff.session.playerId) return;
      this.notePeerSeen();
      this.spawnIncomingVersusEnemy(p.color ?? this.getVersusColorForPlayer(p.senderId), p.senderId);
    });

    handoff.session.onBroadcast(NET_EVENT.MATCH_DEATH, (payload) => {
      const p = payload as MatchDeathPayload | undefined;
      if (!p || typeof p.score !== 'number') return;
      const senderId = p.senderId ?? handoff.peerId;
      this.notePeerSeen();
      const deathCause = p.cause === 'asteroid' || p.cause === 'enemy' || p.cause === 'laser' ? p.cause : undefined;
      const killer = typeof p.killer === 'string' && p.killer.trim().length > 0 ? p.killer.trim() : undefined;
      this.peerOutcomeMap.set(senderId, {
        cause: 'death',
        score: Math.round(p.score),
        time: typeof p.time === 'number' ? p.time : 0,
        phase: this.getLatestPeerPhase(senderId),
        deathCause,
        killer,
      });
      if (senderId === handoff.peerId && !this.peerOutcome) {
        this.peerOutcome = {
          cause: 'death',
          score: Math.round(p.score),
          time: typeof p.time === 'number' ? p.time : 0,
          phase: this.getLatestPeerPhase(),
          deathCause,
          killer,
        };
      }
      if (senderId === handoff.peerId) {
        this.onPeerTerminal();
      } else {
        this.maybeResolveMultiPilotResult();
      }
    });

    this.createMirrorViewport();
  }

  private isMultiPilotVersus(): boolean {
    return (this.multiplayerRoster.length || this.multiplayer?.session.getActivePlayers().length || 0) > 2;
  }

  private recordPeerSnapshot(senderId: string, snap: MirrorSnapshot): void {
    if (!senderId || senderId === this.multiplayer?.session.playerId) return;
    const list = this.peerSnapshotMap.get(senderId) ?? [];
    const last = list[list.length - 1];
    if (last && snap.t < last.snap.t) return;
    list.push({ snap, arr: Date.now() });
    if (list.length > 2) list.shift();
    this.peerSnapshotMap.set(senderId, list);
  }

  private getPeerSnapshotList(playerId = this.multiplayer?.peerId ?? ''): { snap: MirrorSnapshot; arr: number }[] {
    if (!playerId || playerId === this.multiplayer?.peerId) return this.peerSnapshots;
    return this.peerSnapshotMap.get(playerId) ?? [];
  }

  private getLatestPeerPhase(playerId = this.multiplayer?.peerId ?? ''): number {
    const list = this.getPeerSnapshotList(playerId);
    const last = list[list.length - 1];
    return last ? last.snap.phase : 1;
  }

  private getLatestPeerScore(playerId = this.multiplayer?.peerId ?? ''): number {
    const list = this.getPeerSnapshotList(playerId);
    const last = list[list.length - 1];
    return last ? Math.round(last.snap.score) : 0;
  }

  private getVersusColorForPlayer(playerId?: string): number {
    if (!playerId || !this.multiplayer) return VERSUS_LASER_COLOR;
    const cached = this.versusColorByPlayerId.get(playerId);
    if (cached !== undefined) return cached;
    return this.multiplayer.session.getPlayerColor(playerId);
  }

  private getPeerNameById(playerId?: string): string {
    if (!playerId || !this.multiplayer) return '';
    const roster = this.multiplayerRoster.length
      ? this.multiplayerRoster
      : this.multiplayer.session.getActivePlayers();
    const peer = roster.find((p) => p.playerId === playerId);
    return peer ? peer.playerName.trim().toUpperCase() || peer.playerId.toUpperCase() : '';
  }

  private deriveKillerLabel(
    cause: DeathCause,
    source: { kind: 'drifter' | 'enemy' | 'laser' | 'bossBeam' | 'hazardBeam'; senderId?: string } | null,
  ): string {
    if (!source) {
      switch (cause) {
        case 'asteroid':
          return 'ASTEROID';
        case 'laser':
          return 'BEAM';
        case 'enemy':
          return 'ENEMY';
        default:
          return 'UNKNOWN';
      }
    }
    if (source.kind === 'drifter') return 'ASTEROID';
    if (source.kind === 'bossBeam') return 'BOSS BEAM';
    if (source.kind === 'hazardBeam') return 'REGENT BEAM';
    if (source.kind === 'laser') {
      const peerName = this.getPeerNameById(source.senderId);
      return peerName ? `${peerName} LASER` : 'PLAYER LASER';
    }
    if (source.kind === 'enemy') {
      const peerName = this.getPeerNameById(source.senderId);
      return peerName ? `${peerName} ENEMY` : 'REGENT ENEMY';
    }
    return 'UNKNOWN';
  }

  private getLocalPilotName(): string {
    if (this.multiplayer) {
      return this.multiplayer.session.playerName.trim().toUpperCase();
    }
    return this.saveSystem.getPlayerName().trim().toUpperCase();
  }

  private getPeerPilotName(): string {
    const peerName = this.multiplayer?.session.getPeer()?.playerName ?? '';
    const normalized = peerName.trim().toUpperCase();
    return normalized.length > 0 ? normalized : 'P2';
  }

  /**
   * Local player picked up a sabotage laser charge in versus mode. Fire-and-
   * forget broadcast to the peer with a randomly chosen lane. A self-imposed
   * cooldown prevents spam if multiple pickups land back-to-back; the local
   * collection still consumes the pickup either way (no charge stacking).
   */
  private fireVersusLaser(): void {
    if (!this.multiplayer) return;
    const now = Date.now();
    if (now - this.versusLaserLastSendAt < VERSUS_LASER_SEND_COOLDOWN_MS) return;
    this.versusLaserLastSendAt = now;
    const lanes: VersusLaserLane[] = ['top', 'middle', 'bottom'];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    const payload: MatchLaserPayload = {
      senderId: this.multiplayer.session.playerId,
      targetId: this.isMultiPilotVersus() ? undefined : this.multiplayer.peerId,
      color: this.localPlayerColor,
      lane,
      t: now - this.matchClockStartMs,
    };
    this.addSentLaserMirrorEcho(lane, this.localPlayerColor);
    this.multiplayer.session.broadcast(NET_EVENT.MATCH_LASER, payload).catch((err) => {
      console.warn('[GameScene] match_laser broadcast failed', err);
    });
  }

  /** Receiver: spawn the lethal lane sweep that the peer just fired. */
  private spawnIncomingVersusLaser(lane: VersusLaserLane, color = VERSUS_LASER_COLOR, senderId?: string): void {
    this.versusLaserStrikes.push(new VersusLaserStrike(this, lane, color, senderId));
  }

  private spawnIncomingVersusEnemy(color = COLORS.ENEMY, senderId?: string): void {
    const enemy = new EnemyShip(this, color);
    enemy.versusSenderId = senderId;
    this.difficultySystem.getEnemies().push(enemy);
  }

  /**
   * Receiver-side sabotage laser should meaningfully disrupt the local arena,
   * not just the player. Clear local asteroids, enemies, NPCs, and all pickup
   * types directly so we do not accidentally spawn fresh drops from the strike.
   */
  private resolveIncomingVersusLaserStrike(strike: VersusLaserStrike): void {
    const drifters = this.difficultySystem.getDrifters();
    for (let i = drifters.length - 1; i >= 0; i--) {
      const drifter = drifters[i];
      if (!drifter.active || !strike.hits(drifter.x, drifter.y, drifter.radius)) continue;
      this.playerDebris.push(new ShipDebris(this, drifter.x, drifter.y, drifter.vx, drifter.vy, COLORS.ASTEROID, drifter.radius));
      drifter.destroy();
      drifters.splice(i, 1);
    }

    const enemies = this.difficultySystem.getEnemies();
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      if (!enemy.active || !strike.hits(enemy.x, enemy.y, enemy.radius)) continue;
      this.playerDebris.push(new ShipDebris(this, enemy.x, enemy.y, enemy.getVelocityX(), enemy.getVelocityY(), enemy.getHullColor(), enemy.radius));
      enemy.destroy();
      enemies.splice(i, 1);
    }

    const npcs = this.difficultySystem.getNPCs();
    for (let i = npcs.length - 1; i >= 0; i--) {
      const npc = npcs[i];
      if (!npc.active || !strike.hits(npc.x, npc.y, npc.radius)) continue;
      this.playerDebris.push(new ShipDebris(this, npc.x, npc.y, npc.vx, npc.vy, npc.getHullColor(), npc.radius));
      npc.destroy();
      npcs.splice(i, 1);
    }

    this.clearPickupArrayInVersusLaser(this.shields, strike);
    this.clearPickupArrayInVersusLaser(this.bonusPickups, strike);
    this.clearPickupArrayInVersusLaser(this.bombPickups, strike);
    this.clearPickupArrayInVersusLaser(this.versusLaserPickups, strike);
  }

  private clearPickupArrayInVersusLaser<T extends {
    active: boolean;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    destroy(): void;
  }>(pickups: T[], strike: VersusLaserStrike): void {
    for (let i = pickups.length - 1; i >= 0; i--) {
      const pickup = pickups[i];
      if (!pickup.active || !strike.hits(pickup.x, pickup.y, pickup.radius)) continue;
      this.playerDebris.push(new ShipDebris(this, pickup.x, pickup.y, pickup.vx, pickup.vy, COLORS.SALVAGE, pickup.radius));
      pickup.destroy();
      pickups.splice(i, 1);
    }
  }

  /**
   * Spectate-only: the dead/extracted local taps a lane button to fire one of
   * their accumulated charges. Charges regen 1 every 7s up to a cap. No
   * cooldown beyond charge consumption — that's the throttle.
   */
  private fireSpectateLaser(lane: VersusLaserLane): void {
    if (!this.multiplayer) return;
    if (this.spectateLaserCharges <= 0) return;
    this.spectateLaserCharges -= 1;
    const payload: MatchLaserPayload = {
      senderId: this.multiplayer.session.playerId,
      targetId: this.isMultiPilotVersus() ? undefined : this.multiplayer.peerId,
      color: this.localPlayerColor,
      lane,
      t: Date.now() - this.matchClockStartMs,
    };
    // Echo paints local laser onto the spectate mirror viewport so the shooter
    // sees their shot land in the peer's arena. In multi-pilot terminal there
    // is no clean single peer mirror — the echo bleeds onto the standings as
    // self-fire, so skip it.
    if (!this.isMultiPilotVersus()) {
      this.addSentLaserMirrorEcho(lane, this.localPlayerColor);
    }
    this.multiplayer.session.broadcast(NET_EVENT.MATCH_LASER, payload).catch((err) => {
      console.warn('[GameScene] spectate laser broadcast failed', err);
    });
    this.refreshSpectateInventoryUi();
  }

  private fireSpectateEnemy(): void {
    if (!this.multiplayer) return;
    if (this.spectateEnemyCharges <= 0) return;
    this.spectateEnemyCharges -= 1;
    const payload: MatchEnemyPayload = {
      senderId: this.multiplayer.session.playerId,
      targetId: this.isMultiPilotVersus() ? undefined : this.multiplayer.peerId,
      color: this.localPlayerColor,
      t: Date.now() - this.matchClockStartMs,
    };
    this.multiplayer.session.broadcast(NET_EVENT.MATCH_ENEMY, payload).catch((err) => {
      console.warn('[GameScene] spectate enemy broadcast failed', err);
    });
    this.refreshSpectateInventoryUi();
  }

  private fireSpectateRandomLaser(): void {
    const lanes: VersusLaserLane[] = ['top', 'middle', 'bottom', 'left', 'center', 'right'];
    this.fireSpectateLaser(lanes[Math.floor(Math.random() * lanes.length)]);
  }

  /**
   * Spectate-only: tap anywhere on the peer mirror to place a delayed repulsor
   * charge that shoves nearby ships/objects on the live player's arena.
   */
  private fireSpectateRepulsor(arenaXFraction: number, arenaYFraction: number): void {
    if (!this.multiplayer) return;
    const now = Date.now();
    if (now - this.spectateRepulsorLastSendMs < SPECTATE_REPULSOR_COOLDOWN_MS) return;
    this.spectateRepulsorLastSendMs = now;
    const payload: MatchRepulsorPayload = {
      senderId: this.multiplayer.session.playerId,
      targetId: this.multiplayer.peerId,
      x: Math.max(0, Math.min(1, arenaXFraction)),
      y: Math.max(0, Math.min(1, arenaYFraction)),
      t: now - this.matchClockStartMs,
    };
    this.versusRepulsorRecvDedup.add(payload.t);
    this.multiplayer.session.broadcast(NET_EVENT.MATCH_REPULSOR, payload).catch((err) => {
      console.warn('[GameScene] spectate repulsor broadcast failed', err);
    });
    this.spawnIncomingRepulsor(payload.x, payload.y);
  }

  /** Receiver: spawn a repulsor charge at peer-supplied arena coords. */
  private spawnIncomingRepulsor(arenaXFraction: number, arenaYFraction: number): void {
    const layout = getLayout();
    const x = layout.arenaLeft + Math.max(0, Math.min(1, arenaXFraction)) * layout.arenaWidth;
    const y = layout.arenaTop + Math.max(0, Math.min(1, arenaYFraction)) * layout.arenaHeight;
    const charge = new VersusRepulsorCharge(this, x, y);
    this.versusRepulsorCharges.push(charge);
    this.refreshRepulsorChargeDepths();
  }

  private broadcastLocalTerminal(outcome: VersusOutcome): void {
    if (!this.multiplayer) return;
    if (this.localTerminalFired) return;
    this.localTerminalFired = true;
    this.localOutcome = outcome;
    if (outcome.cause === 'extract') {
      const payload: MatchExtractPayload = {
        senderId: this.multiplayer.session.playerId,
        score: outcome.score,
        time: outcome.time,
      };
      this.multiplayer.session.broadcast(NET_EVENT.MATCH_EXTRACT, payload).catch((err) => {
        console.warn('[GameScene] match_extract broadcast failed', err);
      });
    } else if (outcome.cause === 'death') {
      const payload: MatchDeathPayload = {
        senderId: this.multiplayer.session.playerId,
        score: outcome.score,
        time: outcome.time,
        cause: outcome.deathCause ?? 'asteroid',
        killer: outcome.killer,
      };
      this.multiplayer.session.broadcast(NET_EVENT.MATCH_DEATH, payload).catch((err) => {
        console.warn('[GameScene] match_death broadcast failed', err);
      });
    }
    this.maybeResolveMultiPilotResult();
  }

  private onPeerTerminal(): void {
    // Peer reported terminal state.
    // If local hasn't fired yet, peerOutcome is stashed and picked up
    // when local terminal triggers enterVersusResultFlow.
    if (!this.localTerminalFired) return;
    // If local fired but the death/extract screen wipe hasn't reached
    // enterResultsState yet, defer — enterVersusResultFlow will see peerOutcome.
    if (this.state !== GameState.RESULTS) return;
    if (this.isMultiPilotVersus()) {
      this.maybeResolveMultiPilotResult();
      return;
    }
    this.cancelVersusPeerWait();
    this.renderVersusResult();
  }

  private checkMultiPilotAllTerminal(): boolean {
    if (!this.multiplayer || !this.isMultiPilotVersus()) return false;
    if (!this.localOutcome) return false;
    const roster = this.multiplayerRoster.length
      ? this.multiplayerRoster
      : this.multiplayer.session.getActivePlayers();
    if (roster.length < 2) return false;
    const localId = this.multiplayer.session.playerId;
    for (const pilot of roster) {
      if (pilot.playerId === localId) continue;
      if (!this.peerOutcomeMap.has(pilot.playerId)) return false;
    }
    return true;
  }

  private maybeResolveMultiPilotResult(): void {
    if (!this.isMultiPilotVersus()) return;
    if (this.versusResultRendered) return;
    if (this.state !== GameState.RESULTS) {
      // Still alive: refresh the live standings if we are already viewing them
      // (we are not — local hasn't terminated). Bail.
      return;
    }
    if (!this.checkMultiPilotAllTerminal()) {
      this.showVersusWaitingUi();
      return;
    }
    this.renderVersusResult();
  }

  private cancelVersusPeerWait(): void {
    if (this.versusPeerWaitTimer) {
      this.versusPeerWaitTimer.remove(false);
      this.versusPeerWaitTimer = null;
    }
  }

  private notePeerSeen(): void {
    this.lastPeerSeenAt = Date.now();
  }

  private requestRematch(): void {
    if (!this.multiplayer || this.rematchInFlight) return;
    if (!this.isMultiPilotVersus() && this.peerLeft) return;
    if (this.localRematch) return;
    this.localRematch = true;
    const payload: MatchRematchPayload = { senderId: this.multiplayer.session.playerId };
    this.multiplayer.session.broadcast(NET_EVENT.MATCH_REMATCH_READY, payload).catch((err) => {
      console.warn('[GameScene] match_rematch_ready broadcast failed', err);
    });
    this.refreshRematchUi();
    this.maybeFireRematch();
  }

  private cancelRematch(): void {
    if (!this.multiplayer || this.rematchInFlight) return;
    if (!this.localRematch) return;
    this.localRematch = false;
    const payload: MatchRematchPayload = { senderId: this.multiplayer.session.playerId };
    this.multiplayer.session.broadcast(NET_EVENT.MATCH_REMATCH_CANCEL, payload).catch((err) => {
      console.warn('[GameScene] match_rematch_cancel broadcast failed', err);
    });
    this.refreshRematchUi();
  }

  /** Multi-pilot only. Returns count of present peers ready and total peers in roster (excluding self and disconnected). */
  private getMultiPilotRematchStatus(): { ready: number; total: number } {
    if (!this.multiplayer) return { ready: 0, total: 0 };
    const presentIds = new Set(this.multiplayer.session.getActivePlayers().map((p) => p.playerId));
    const localId = this.multiplayer.session.playerId;
    const roster = this.multiplayerRoster.length
      ? this.multiplayerRoster
      : this.multiplayer.session.getActivePlayers();
    let ready = 0;
    let total = 0;
    for (const pilot of roster) {
      if (pilot.playerId === localId) continue;
      if (!presentIds.has(pilot.playerId)) continue;
      total += 1;
      if (this.peerRematchMap.get(pilot.playerId)) ready += 1;
    }
    return { ready, total };
  }

  private maybeFireRematch(): void {
    if (this.rematchInFlight) return;
    if (!this.localRematch) return;
    if (this.isMultiPilotVersus()) {
      const status = this.getMultiPilotRematchStatus();
      if (status.total === 0) return;
      if (status.ready < status.total) return;
    } else {
      if (!this.peerRematch) return;
      if (this.peerLeft) return;
    }
    this.fireRematch();
  }

  private fireRematch(): void {
    if (!this.multiplayer || this.rematchInFlight) return;
    this.rematchInFlight = true;
    const session = this.multiplayer.session;
    const peer = session.getPeer();
    const role: 'host' | 'guest' = session.isHost() ? 'host' : 'guest';
    const matchId = `m_${session.roomCode}_${Date.now().toString(36)}`;
    const handoff: MultiplayerHandoff = {
      session,
      role,
      matchId,
      peerId: peer?.playerId ?? this.multiplayer.peerId,
      startAt: Date.now(),
    };
    session.clearListeners();
    this.scene.start(SCENE_KEYS.GAME, { multiplayer: handoff } satisfies MenuHandoff);
  }

  private refreshRematchUi(): void {
    this.rematchPrimaryRefresh?.();
  }

  private createMirrorViewport(): void {
    const layout = getLayout();
    const w = layout.arenaWidth;
    const h = layout.arenaHeight;
    const x = layout.arenaLeft;
    const y = layout.arenaTop;
    this.mirrorRect = { x, y, w, h };

    this.mirrorBg = this.add.graphics().setDepth(GameScene.MIRROR_BG_DEPTH);
    this.mirrorEntities = this.add.graphics().setDepth(GameScene.MIRROR_ENTITY_DEPTH);

    const labelColor = `#${COLORS.HUD.toString(16).padStart(6, '0')}`;
    const bgColor = `#${COLORS.BG.toString(16).padStart(6, '0')}`;
    this.mirrorLabel = this.add.text(x + 5, y + 3, 'P2 …', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(9),
      color: labelColor,
      stroke: bgColor,
      strokeThickness: 2,
    }).setOrigin(0, 0).setDepth(120).setAlpha(0.85);

    this.mirrorWaiting = this.add.text(x + w / 2, y + h / 2, 'WAITING', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(10),
      color: labelColor,
      stroke: bgColor,
      strokeThickness: 2,
    }).setOrigin(0.5, 0.5).setDepth(120).setAlpha(0.5);

    this.mirrorLabel
      .setPosition(x + GameScene.MIRROR_LABEL_INSET_PX, y + GameScene.MIRROR_LABEL_INSET_PX - 1)
      .setFontSize(readableFontSize(11))
      .setDepth(GameScene.MIRROR_TEXT_DEPTH)
      .setAlpha(0.72)
      .setText(`${this.getPeerPilotName()} // WAITING`);
    this.mirrorWaiting
      .setFontSize(readableFontSize(20))
      .setDepth(GameScene.MIRROR_TEXT_DEPTH)
      .setAlpha(0.28);
    this.refreshMirrorPalette();
    this.setMirrorVisible(false);
  }

  private drawMirrorBg(): void {
    const r = this.mirrorRect;
    const g = this.mirrorBg;
    if (!r || !g) return;
    g.clear();
    const alpha = this.versusSpectating
      ? GameScene.MIRROR_BG_ALPHA
      : this.renderTuning.mirrorLiveBgAlpha;
    if (alpha <= 0) {
      return;
    }
    const inset = 2;
    g.fillStyle(COLORS.BG, alpha);
    g.fillRect(r.x + inset, r.y + inset, r.w - inset * 2, r.h - inset * 2);
  }

  private refreshMirrorPalette(): void {
    const labelColor = `#${COLORS.HUD.toString(16).padStart(6, '0')}`;
    const strokeColor = `#${COLORS.BG.toString(16).padStart(6, '0')}`;
    this.drawMirrorBg();
    this.mirrorLabel?.setColor(labelColor);
    this.mirrorLabel?.setStroke(strokeColor, 2);
    this.mirrorWaiting?.setColor(labelColor);
    this.mirrorWaiting?.setStroke(strokeColor, 2);
  }

  private teardownMultiplayer(): void {
    this.cancelVersusPeerWait();
    this.mirrorBg?.destroy(); this.mirrorBg = null;
    this.mirrorEntities?.destroy(); this.mirrorEntities = null;
    this.mirrorLabel?.destroy(); this.mirrorLabel = null;
    this.mirrorWaiting?.destroy(); this.mirrorWaiting = null;
    this.mirrorRect = null;
    if (this.multiplayer) {
      // On rematch, the successor scene reuses this session — keep it alive.
      // Listeners were already cleared in fireRematch() before scene.start.
      if (!this.rematchInFlight) {
        this.multiplayer.session.leave().catch(() => { /* ignore */ });
      }
      this.multiplayer = null;
    }
    this.peerSnapshots = [];
    this.mirrorLaserEchoes = [];
  }

  private setMirrorVisible(visible: boolean): void {
    this.mirrorBg?.setVisible(visible);
    this.mirrorEntities?.setVisible(visible);
    this.mirrorLabel?.setVisible(visible);
    if (!visible) {
      this.mirrorWaiting?.setVisible(false);
    }
    this.mirrorNeedsRedraw = true;
  }

  private tickMultiplayer(delta: number): void {
    if (!this.multiplayer) return;
    this.snapshotAccumMs += delta;
    if (this.snapshotAccumMs >= GameScene.SNAPSHOT_INTERVAL_MS) {
      this.snapshotAccumMs = 0;
      this.sendSnapshot();
    }
    this.tickResultPeerHeartbeat(delta);
    this.tickSpectateInventory(delta);
    this.tickRepulsorCharges(delta);
    this.tickMirrorLaserEchoes(delta);
    const mirrorFrameMs = this.versusSpectating
      ? this.renderTuning.mirrorSpectateRenderFrameMs
      : this.renderTuning.mirrorRenderFrameMs;
    this.mirrorRenderAccumMs += delta;
    if (this.mirrorNeedsRedraw || this.mirrorRenderAccumMs >= mirrorFrameMs) {
      this.mirrorRenderAccumMs = 0;
      this.mirrorNeedsRedraw = false;
      this.updateMirrorViewport();
    }
  }

  private tickRepulsorCharges(delta: number): void {
    for (let i = this.versusRepulsorCharges.length - 1; i >= 0; i--) {
      const charge = this.versusRepulsorCharges[i];
      charge.update(delta);
      if (!this.versusSpectating && charge.detonated && !this.versusRepulsorApplied.has(charge)) {
        this.versusRepulsorApplied.add(charge);
        this.applyRepulsorBlast(charge.x, charge.y);
      }
      if (!charge.active) {
        charge.destroy();
        this.versusRepulsorCharges.splice(i, 1);
      }
    }
  }

  private applyRepulsorBlast(cx: number, cy: number): void {
    const push = (
      target: { x: number; y: number; radius?: number },
      apply: (ix: number, iy: number) => void,
      force: number,
    ): void => {
      const dx = target.x - cx;
      const dy = target.y - cy;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const radius = target.radius ?? 0;
      if (dist > SPECTATE_REPULSOR_RADIUS + radius) return;
      const falloff = 1 - Math.min(1, dist / Math.max(1, SPECTATE_REPULSOR_RADIUS + radius));
      const impulse = force * (0.25 + falloff * 0.75);
      apply((dx / dist) * impulse, (dy / dist) * impulse);
    };

    if (!this.player.destroyed) {
      push(this.player, (ix, iy) => this.player.applyImpulse(ix, iy), SPECTATE_REPULSOR_PLAYER_FORCE);
    }

    for (const drifter of this.difficultySystem.getDrifters()) {
      if (!drifter.active) continue;
      push(drifter, (ix, iy) => {
        drifter.vx += ix;
        drifter.vy += iy;
      }, SPECTATE_REPULSOR_OBJECT_FORCE);
    }
    for (const debris of this.debrisList) {
      if (!debris.active) continue;
      push(debris, (ix, iy) => {
        const mutable = debris as unknown as { vx: number; vy: number; driftVx: number; driftVy: number };
        mutable.vx += ix;
        mutable.vy += iy;
        mutable.driftVx = mutable.vx;
        mutable.driftVy = mutable.vy;
      }, SPECTATE_REPULSOR_OBJECT_FORCE);
    }
    for (const npc of this.difficultySystem.getNPCs()) {
      if (!npc.active) continue;
      push(npc, (ix, iy) => npc.applyImpulse(ix, iy), SPECTATE_REPULSOR_OBJECT_FORCE);
    }
    for (const enemy of this.difficultySystem.getEnemies()) {
      if (!enemy.active) continue;
      push(enemy, (ix, iy) => enemy.applyImpulse(ix, iy), SPECTATE_REPULSOR_OBJECT_FORCE);
    }
    for (const pickup of [...this.shields, ...this.bonusPickups, ...this.bombPickups, ...this.versusLaserPickups]) {
      push(pickup, (ix, iy) => {
        pickup.vx += ix;
        pickup.vy += iy;
      }, SPECTATE_REPULSOR_OBJECT_FORCE);
    }
  }

  private tickMirrorLaserEchoes(delta: number): void {
    if (this.mirrorLaserEchoes.length === 0) return;
    const totalMs = VERSUS_LASER_WARNING_MS + VERSUS_LASER_LETHAL_MS;
    for (let i = this.mirrorLaserEchoes.length - 1; i >= 0; i--) {
      const echo = this.mirrorLaserEchoes[i];
      echo.elapsed += delta;
      echo.laser.lethal = echo.elapsed >= VERSUS_LASER_WARNING_MS;
      if (echo.elapsed >= totalMs) {
        this.mirrorLaserEchoes.splice(i, 1);
      }
    }
    this.mirrorNeedsRedraw = true;
  }

  private addSentLaserMirrorEcho(lane: VersusLaserLane, color = VERSUS_LASER_COLOR): void {
    this.mirrorLaserEchoes.push({
      laser: this.createMirrorLaserFromLane(lane, color),
      elapsed: 0,
    });
    this.mirrorNeedsRedraw = true;
  }

  private createMirrorLaserFromLane(lane: VersusLaserLane, color = VERSUS_LASER_COLOR): MirrorLaserSnapshot {
    const layout = getLayout();
    const sizeBasis = Math.max(1, Math.min(layout.arenaWidth, layout.arenaHeight));
    const isHorizontal = lane === 'top' || lane === 'middle' || lane === 'bottom';
    const posByLane: Record<VersusLaserLane, number> = {
      top: 0.25,
      middle: 0.5,
      bottom: 0.75,
      left: 0.25,
      center: 0.5,
      right: 0.75,
    };
    return {
      axis: isHorizontal ? 'h' : 'v',
      pos: posByLane[lane],
      width: Math.round((VERSUS_LASER_WIDTH / sizeBasis) * 10000) / 10000,
      lethal: false,
      kind: 'versus',
      color,
    };
  }

  private reconcileMirrorLaserEchoes(peerLasers: MirrorLaserSnapshot[]): void {
    if (this.mirrorLaserEchoes.length === 0) return;
    this.mirrorLaserEchoes = this.mirrorLaserEchoes.filter((echo) => !peerLasers.some((laser) => (
      laser.kind === 'versus' &&
      laser.axis === echo.laser.axis &&
      Math.abs(laser.pos - echo.laser.pos) < 0.001
    )));
  }

  private tickResultPeerHeartbeat(delta: number): void {
    if (!this.multiplayer || this.rematchInFlight || this.peerLeft) {
      this.resultPulseAccumMs = 0;
      return;
    }
    const onVersusResult = this.state === GameState.RESULTS && this.versusResultRendered;
    if (!onVersusResult) {
      this.resultPulseAccumMs = 0;
      return;
    }

    this.resultPulseAccumMs += delta;
    if (this.resultPulseAccumMs >= GameScene.RESULT_PULSE_INTERVAL_MS) {
      this.resultPulseAccumMs = 0;
      this.multiplayer.session.broadcast(NET_EVENT.MATCH_RESULT_PULSE, {}).catch((err) => {
        console.warn('[GameScene] match_result_pulse broadcast failed', err);
      });
    }

    if (Date.now() - this.lastPeerSeenAt >= GameScene.RESULT_PEER_STALE_MS) {
      this.peerLeft = true;
      this.peerRematch = false;
      this.refreshRematchUi();
    }
  }

  private sendSnapshot(): void {
    if (!this.multiplayer) return;
    const layout = getLayout();
    const aw = layout.arenaWidth || 1;
    const ah = layout.arenaHeight || 1;
    const al = layout.arenaLeft;
    const at = layout.arenaTop;
    const sizeBasis = Math.max(1, Math.min(aw, ah));
    const round4 = (n: number) => Math.round(n * 10000) / 10000;
    const enemies = this.difficultySystem.getEnemies();
    const npcs = this.difficultySystem.getNPCs();
    const drifters = this.difficultySystem.getDrifters();
    const beams = this.difficultySystem.getBeams();
    const gate = this.extractionSystem.getGate();
    const snapshot: MirrorSnapshot = {
      senderId: this.multiplayer.session.playerId,
      senderColor: this.localPlayerColor,
      epoch: this.matchClockStartMs,
      t: Date.now() - this.matchClockStartMs,
      ship: {
        x: round4((this.player.x - al) / aw),
        y: round4((this.player.y - at) / ah),
        angle: Math.round(this.player.getHeading() * 1000) / 1000,
        alive: !this.player.destroyed,
        shielded: this.player.hasShield,
      },
      enemies: enemies.map((e) => ({
        x: round4((e.x - al) / aw),
        y: round4((e.y - at) / ah),
        type: 0,
        color: e.getHullColor(),
      })),
      drifters: drifters
        .filter((d) => d.active)
        .map((d) => ({
          x: round4((d.x - al) / aw),
          y: round4((d.y - at) / ah),
          radius: round4(d.radius / sizeBasis),
          mineable: d.isMineable,
        })),
      salvage: this.debrisList
        .filter((d) => d.active)
        .map((d) => ({
          x: round4((d.x - al) / aw),
          y: round4((d.y - at) / ah),
          radius: round4(d.salvageRadius / sizeBasis),
          rare: d.isRare,
        })),
      lasers: [
        ...beams
          .filter((b) => b.active)
          .map<MirrorLaserSnapshot>((b) => ({
            axis: b.isHorizontal ? 'h' : 'v',
            pos: round4(b.isHorizontal ? (b.y1 - at) / ah : (b.x1 - al) / aw),
            width: round4(b.width / sizeBasis),
            lethal: b.isLethal(),
            kind: 'hazard' as const,
          })),
        ...this.versusLaserStrikes
          .filter((s) => s.active)
          .map<MirrorLaserSnapshot>((s) => ({
            axis: s.isHorizontal ? 'h' : 'v',
            pos: round4(s.isHorizontal ? (s.y1 - at) / ah : (s.x1 - al) / aw),
            width: round4(s.width / sizeBasis),
            lethal: s.isLethal(),
            kind: 'versus' as const,
            color: s.getColor(),
          })),
      ],
      npcs: npcs
        .filter((n) => n.active)
        .map((n) => ({
          x: round4((n.x - al) / aw),
          y: round4((n.y - at) / ah),
          radius: round4(n.radius / sizeBasis),
          angle: Math.round(Math.atan2(n.vy, n.vx) * 1000) / 1000,
          shielded: n.hasShield,
          salvaging: n.isSalvaging(),
        })),
      gate: gate && gate.active
        ? {
          x: round4((gate.x - al) / aw),
          y: round4((gate.y - at) / ah),
          radius: round4(EXIT_GATE_RADIUS / sizeBasis),
          extractable: gate.extractable,
          timeRemaining: Math.round(gate.getTimeRemaining()),
        }
        : null,
      score: Math.round(this.scoreSystem.getBanked() + this.scoreSystem.getUnbanked()),
      phase: this.difficultySystem.getConfig().phaseNumber,
      extracted: this.state === GameState.EXTRACTING || this.state === GameState.RESULTS,
    };
    this.multiplayer.session.broadcast(NET_EVENT.SNAPSHOT, snapshot).catch((err) => {
      console.warn('[GameScene] snapshot broadcast failed', err);
    });
  }

  private updateMirrorViewport(): void {
    if (!this.versusSpectating) {
      this.mirrorBg?.clear();
      this.updateLiveMirrorShip();
      this.mirrorLabel?.setVisible(false);
      this.mirrorWaiting?.setVisible(false);
      return;
    }
    this.updateMirrorBackdrop();
    return;
    const rect = this.mirrorRect!;
    const g = this.mirrorEntities!;
    if (!rect || !g) return;
    if (this.state === GameState.RESULTS) return;
    g.clear();

    if (this.peerSnapshots.length === 0) {
      this.mirrorWaiting?.setVisible(true);
      this.mirrorLabel?.setText(`${this.getPeerPilotName()} // WAITING`);
      this.mirrorLabel?.setText('P2 …');
      return;
    }
    this.mirrorWaiting?.setVisible(false);

    const newest = this.peerSnapshots[this.peerSnapshots.length - 1];
    const older = this.peerSnapshots.length > 1 ? this.peerSnapshots[0] : newest;
    const dt = Math.max(1, newest.snap.t - older.snap.t);
    const localElapsed = Date.now() - newest.arr;
    const renderT = newest.snap.t + localElapsed - GameScene.MIRROR_INTERP_BUFFER_MS;
    let alpha = (renderT - older.snap.t) / dt;
    if (alpha < 0) alpha = 0;
    else if (alpha > 1) alpha = 1;

    const mapX = (fx: number) => {
      const c = fx < 0 ? 0 : fx > 1 ? 1 : fx;
      return rect.x + c * rect.w;
    };
    const mapY = (fy: number) => {
      const c = fy < 0 ? 0 : fy > 1 ? 1 : fy;
      return rect.y + c * rect.h;
    };

    const enemyFillAlpha = 0.18;
    const enemyStrokeAlpha = 0.38;
    g.fillStyle(COLORS.ENEMY, enemyFillAlpha);
    g.lineStyle(1, COLORS.ENEMY, enemyStrokeAlpha);
    const paired = Math.min(older.snap.enemies.length, newest.snap.enemies.length);
    for (let i = 0; i < paired; i++) {
      const oe = older.snap.enemies[i];
      const ne = newest.snap.enemies[i];
      const fx = oe.x + (ne.x - oe.x) * alpha;
      const fy = oe.y + (ne.y - oe.y) * alpha;
      g.fillCircle(mapX(fx), mapY(fy), GameScene.MIRROR_ENEMY_RADIUS);
      g.strokeCircle(mapX(fx), mapY(fy), GameScene.MIRROR_ENEMY_RADIUS);
    }
    for (let i = paired; i < newest.snap.enemies.length; i++) {
      const ne = newest.snap.enemies[i];
      g.fillCircle(mapX(ne.x), mapY(ne.y), GameScene.MIRROR_ENEMY_RADIUS);
      g.strokeCircle(mapX(ne.x), mapY(ne.y), GameScene.MIRROR_ENEMY_RADIUS);
    }

    // Ship: lerp position + angle (raw lerp; sub-frame, near-equal angles)
    const sFx = older.snap.ship.x + (newest.snap.ship.x - older.snap.ship.x) * alpha;
    const sFy = older.snap.ship.y + (newest.snap.ship.y - older.snap.ship.y) * alpha;
    const sAngle = lerpAngleShortest(older.snap.ship.angle, newest.snap.ship.angle, alpha);
    const sx = mapX(sFx);
    const sy = mapY(sFy);

    if (newest.snap.ship.alive) {
      const triR = GameScene.MIRROR_SHIP_RADIUS;
      const x1 = sx + Math.cos(sAngle) * triR;
      const y1 = sy + Math.sin(sAngle) * triR;
      const x2 = sx + Math.cos(sAngle + (Math.PI * 2) / 3) * triR;
      const y2 = sy + Math.sin(sAngle + (Math.PI * 2) / 3) * triR;
      const x3 = sx + Math.cos(sAngle - (Math.PI * 2) / 3) * triR;
      const y3 = sy + Math.sin(sAngle - (Math.PI * 2) / 3) * triR;
      g.lineStyle(1.25, COLORS.PLAYER, 0.42);
      g.fillStyle(COLORS.PLAYER, 0.14);
      g.beginPath();
      g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3); g.closePath();
      g.fillPath();
      g.strokePath();
      if (newest.snap.ship.shielded) {
        g.lineStyle(1, COLORS.SHIELD, 0.22);
        g.strokeCircle(sx, sy, triR * 1.6);
      }
    } else {
      const markR = GameScene.MIRROR_SHIP_RADIUS * 0.7;
      g.lineStyle(1.15, COLORS.HAZARD, 0.26);
      g.beginPath();
      g.moveTo(sx - markR, sy - markR); g.lineTo(sx + markR, sy + markR);
      g.moveTo(sx + markR, sy - markR); g.lineTo(sx - markR, sy + markR);
      g.strokePath();
    }

    const aliveTag = newest.snap.ship.alive ? '' : 'KIA  ';
    this.mirrorLabel?.setText(`${this.getPeerPilotName()} // ${aliveTag}${newest.snap.score} // PH ${newest.snap.phase}`);
  }

  private updateLiveMirrorShip(): void {
    const rect = this.mirrorRect;
    const g = this.mirrorEntities;
    if (!rect || !g) return;
    g.setVisible(true);
    g.clear();

    if (this.state === GameState.RESULTS) return;

    const mapX = (fx: number) => {
      const c = fx < 0 ? 0 : fx > 1 ? 1 : fx;
      return rect.x + c * rect.w;
    };
    const mapY = (fy: number) => {
      const c = fy < 0 ? 0 : fy > 1 ? 1 : fy;
      return rect.y + c * rect.h;
    };

    const drawGhost = (list: { snap: MirrorSnapshot; arr: number }[]): void => {
      if (list.length === 0) return;
      const newest = list[list.length - 1];
      const older = list.length > 1 ? list[0] : newest;
      const dt = Math.max(1, newest.snap.t - older.snap.t);
      const localElapsed = Date.now() - newest.arr;
      const renderT = newest.snap.t + localElapsed - GameScene.MIRROR_INTERP_BUFFER_MS;
      let alpha = (renderT - older.snap.t) / dt;
      if (alpha < 0) alpha = 0;
      else if (alpha > 1) alpha = 1;

      const sFx = older.snap.ship.x + (newest.snap.ship.x - older.snap.ship.x) * alpha;
      const sFy = older.snap.ship.y + (newest.snap.ship.y - older.snap.ship.y) * alpha;
      const sAngle = lerpAngleShortest(older.snap.ship.angle, newest.snap.ship.angle, alpha);
      const sx = mapX(sFx);
      const sy = mapY(sFy);
      const shipR = GameScene.MIRROR_SHIP_RADIUS;
      const shipColor = newest.snap.senderColor ?? COLORS.PLAYER;

      if (newest.snap.ship.alive) {
        const x1 = sx + Math.cos(sAngle) * shipR;
        const y1 = sy + Math.sin(sAngle) * shipR;
        const x2 = sx + Math.cos(sAngle + (Math.PI * 2) / 3) * shipR;
        const y2 = sy + Math.sin(sAngle + (Math.PI * 2) / 3) * shipR;
        const x3 = sx + Math.cos(sAngle - (Math.PI * 2) / 3) * shipR;
        const y3 = sy + Math.sin(sAngle - (Math.PI * 2) / 3) * shipR;
        g.lineStyle(1.3, shipColor, 0.42);
        g.fillStyle(shipColor, 0.12);
        g.beginPath();
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);
        g.lineTo(x3, y3);
        g.closePath();
        g.fillPath();
        g.strokePath();
        if (newest.snap.ship.shielded) {
          g.lineStyle(1, COLORS.SHIELD, 0.24);
          g.strokeCircle(sx, sy, shipR * 1.6);
        }
      } else {
        const markR = shipR * 0.7;
        g.lineStyle(1.15, COLORS.HAZARD, 0.32);
        g.beginPath();
        g.moveTo(sx - markR, sy - markR);
        g.lineTo(sx + markR, sy + markR);
        g.moveTo(sx + markR, sy - markR);
        g.lineTo(sx - markR, sy + markR);
        g.strokePath();
      }
    };

    if (this.isMultiPilotVersus()) {
      for (const list of this.peerSnapshotMap.values()) {
        drawGhost(list);
      }
    } else {
      drawGhost(this.peerSnapshots);
    }
  }

  private updateMirrorBackdrop(): void {
    const rect = this.mirrorRect;
    const g = this.mirrorEntities;
    if (!rect || !g) return;
    // RESULTS state suppresses the mirror except during versus spectate, when
    // we DO want to keep rendering the peer's live arena.
    if (this.state === GameState.RESULTS && !this.versusSpectating) return;
    g.clear();

    if (this.peerSnapshots.length === 0) {
      this.mirrorWaiting?.setVisible(true);
      this.mirrorLabel?.setText(`${this.getPeerPilotName()} // WAITING`);
      return;
    }
    this.mirrorWaiting?.setVisible(false);

    const newest = this.peerSnapshots[this.peerSnapshots.length - 1];
    const older = this.peerSnapshots.length > 1 ? this.peerSnapshots[0] : newest;
    const dt = Math.max(1, newest.snap.t - older.snap.t);
    const localElapsed = Date.now() - newest.arr;
    const renderT = newest.snap.t + localElapsed - GameScene.MIRROR_INTERP_BUFFER_MS;
    let alpha = (renderT - older.snap.t) / dt;
    if (alpha < 0) alpha = 0;
    else if (alpha > 1) alpha = 1;

    const mapX = (fx: number) => {
      const c = fx < 0 ? 0 : fx > 1 ? 1 : fx;
      return rect.x + c * rect.w;
    };
    const mapY = (fy: number) => {
      const c = fy < 0 ? 0 : fy > 1 ? 1 : fy;
      return rect.y + c * rect.h;
    };
    const mapSize = (fraction: number) => Math.max(1, fraction * Math.min(rect.w, rect.h));

    const spectate = this.versusSpectating;
    this.drawMirrorDrifters(
      g,
      newest.snap.drifters ?? [],
      mapX,
      mapY,
      mapSize,
      spectate,
    );
    this.drawMirrorSalvage(
      g,
      newest.snap.salvage ?? [],
      mapX,
      mapY,
      mapSize,
      spectate,
    );
    this.drawMirrorGate(
      g,
      newest.snap.gate ?? null,
      mapX,
      mapY,
      mapSize,
      spectate,
    );
    const renderEnemies = spectate || this.renderTuning.mirrorLiveRenderEnemies;
    const enemyR = spectate ? GameScene.MIRROR_SPECTATE_ENEMY_RADIUS : GameScene.MIRROR_ENEMY_RADIUS;
    const shipR = spectate ? GameScene.MIRROR_SPECTATE_SHIP_RADIUS : GameScene.MIRROR_SHIP_RADIUS;
    const enemyFillAlpha = spectate ? 0.32 : 0.12;
    const enemyStrokeAlpha = spectate ? 0.7 : 0.24;
    if (renderEnemies) {
      const paired = Math.min(older.snap.enemies.length, newest.snap.enemies.length);
      for (let i = 0; i < paired; i++) {
        const oe = older.snap.enemies[i];
        const ne = newest.snap.enemies[i];
        const fx = oe.x + (ne.x - oe.x) * alpha;
        const fy = oe.y + (ne.y - oe.y) * alpha;
        const color = ne.color ?? COLORS.ENEMY;
        g.fillStyle(color, enemyFillAlpha);
        g.lineStyle(spectate ? 1.5 : 1, color, enemyStrokeAlpha);
        g.fillCircle(mapX(fx), mapY(fy), enemyR);
        g.strokeCircle(mapX(fx), mapY(fy), enemyR);
      }
      for (let i = paired; i < newest.snap.enemies.length; i++) {
        const ne = newest.snap.enemies[i];
        const color = ne.color ?? COLORS.ENEMY;
        g.fillStyle(color, enemyFillAlpha);
        g.lineStyle(spectate ? 1.5 : 1, color, enemyStrokeAlpha);
        g.fillCircle(mapX(ne.x), mapY(ne.y), enemyR);
        g.strokeCircle(mapX(ne.x), mapY(ne.y), enemyR);
      }
    }
    this.drawMirrorNpcs(
      g,
      newest.snap.npcs ?? [],
      mapX,
      mapY,
      mapSize,
      spectate,
    );
    const mirrorLasers = [
      ...(newest.snap.lasers ?? []),
      ...this.mirrorLaserEchoes.map((echo) => echo.laser),
    ];
    this.drawMirrorLasers(
      g,
      mirrorLasers,
      rect,
      mapX,
      mapY,
      mapSize,
      spectate,
    );

    const sFx = older.snap.ship.x + (newest.snap.ship.x - older.snap.ship.x) * alpha;
    const sFy = older.snap.ship.y + (newest.snap.ship.y - older.snap.ship.y) * alpha;
    const sAngle = lerpAngleShortest(older.snap.ship.angle, newest.snap.ship.angle, alpha);
    const sx = mapX(sFx);
    const sy = mapY(sFy);

    if (newest.snap.ship.alive) {
      const x1 = sx + Math.cos(sAngle) * shipR;
      const y1 = sy + Math.sin(sAngle) * shipR;
      const x2 = sx + Math.cos(sAngle + (Math.PI * 2) / 3) * shipR;
      const y2 = sy + Math.sin(sAngle + (Math.PI * 2) / 3) * shipR;
      const x3 = sx + Math.cos(sAngle - (Math.PI * 2) / 3) * shipR;
      const y3 = sy + Math.sin(sAngle - (Math.PI * 2) / 3) * shipR;
      g.lineStyle(spectate ? 2 : 1.15, COLORS.PLAYER, spectate ? 0.85 : 0.3);
      g.fillStyle(COLORS.PLAYER, spectate ? 0.3 : 0.08);
      g.beginPath();
      g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3); g.closePath();
      g.fillPath();
      g.strokePath();
      if (newest.snap.ship.shielded) {
        g.lineStyle(spectate ? 1.6 : 1.1, COLORS.SHIELD, spectate ? 0.6 : 0.32);
        g.strokeCircle(sx, sy, shipR * 1.6);
      }
    } else {
      const markR = shipR * 0.7;
      g.lineStyle(spectate ? 2 : 1.25, COLORS.HAZARD, spectate ? 0.85 : 0.42);
      g.beginPath();
      g.moveTo(sx - markR, sy - markR); g.lineTo(sx + markR, sy + markR);
      g.moveTo(sx + markR, sy - markR); g.lineTo(sx - markR, sy + markR);
      g.strokePath();
    }

    const aliveTag = newest.snap.ship.alive ? '' : 'KIA  ';
    this.mirrorLabel?.setText(`${this.getPeerPilotName()} // ${aliveTag}${newest.snap.score} // PH ${newest.snap.phase}`);
  }

  private drawMirrorDrifters(
    g: Phaser.GameObjects.Graphics,
    drifters: MirrorDrifterSnapshot[],
    mapX: (fx: number) => number,
    mapY: (fy: number) => number,
    mapSize: (fraction: number) => number,
    spectate: boolean,
  ): void {
    for (const drifter of drifters) {
      const x = mapX(drifter.x);
      const y = mapY(drifter.y);
      const radius = Math.max(2, mapSize(drifter.radius));
      const color = drifter.mineable ? COLORS.ASTEROID : COLORS.ASTEROID_INERT;
      if (drifter.mineable) {
        const miningRadius = radius * DRIFTER_MINING_RADIUS_MULT;
        g.fillStyle(0xffdd44, spectate ? 0.07 : 0.025);
        g.fillCircle(x, y, miningRadius);
        g.lineStyle(spectate ? 1.1 : 0.8, 0xffdd44, spectate ? 0.22 : 0.09);
        g.strokeCircle(x, y, miningRadius);
      }
      g.fillStyle(color, spectate ? 0.16 : 0.06);
      g.fillCircle(x, y, radius);
      g.lineStyle(spectate ? 1.4 : 1, color, spectate ? 0.55 : 0.24);
      g.strokeCircle(x, y, radius);
      g.fillStyle(color, spectate ? 0.28 : 0.12);
      g.fillCircle(x, y, radius * 0.22);
    }
  }

  private drawMirrorSalvage(
    g: Phaser.GameObjects.Graphics,
    salvage: MirrorSalvageSnapshot[],
    mapX: (fx: number) => number,
    mapY: (fy: number) => number,
    mapSize: (fraction: number) => number,
    spectate: boolean,
  ): void {
    for (const entry of salvage) {
      const x = mapX(entry.x);
      const y = mapY(entry.y);
      const radius = Math.max(4, mapSize(entry.radius));
      const ringColor = entry.rare ? 0xff44ff : COLORS.SALVAGE_RADIUS;
      const bodyColor = entry.rare ? 0xff44ff : COLORS.SALVAGE;
      const barW = radius * 0.92;
      const barH = Math.max(2, radius * 0.22);

      g.fillStyle(ringColor, spectate ? 0.05 : 0.02);
      g.fillCircle(x, y, radius);
      g.lineStyle(spectate ? 1.1 : 0.8, ringColor, spectate ? 0.24 : 0.1);
      g.strokeCircle(x, y, radius);

      g.fillStyle(bodyColor, spectate ? 0.14 : 0.05);
      g.fillRect(x - barW / 2, y - barH / 2, barW, barH);
      g.fillRect(x - barH / 2, y - barW / 2, barH, barW);
      g.lineStyle(spectate ? 1.2 : 0.9, bodyColor, spectate ? 0.55 : 0.24);
      g.strokeRect(x - barW / 2, y - barH / 2, barW, barH);
      g.strokeRect(x - barH / 2, y - barW / 2, barH, barW);
      g.fillStyle(bodyColor, spectate ? 0.32 : 0.12);
      g.fillCircle(x, y, Math.max(1.5, radius * 0.08));
    }
  }

  private drawMirrorGate(
    g: Phaser.GameObjects.Graphics,
    gate: MirrorGateSnapshot | null,
    mapX: (fx: number) => number,
    mapY: (fy: number) => number,
    mapSize: (fraction: number) => number,
    spectate: boolean,
  ): void {
    if (!gate) return;
    const x = mapX(gate.x);
    const y = mapY(gate.y);
    const radius = Math.max(10, mapSize(gate.radius));
    const alpha = spectate ? 0.78 : 0.24;

    if (gate.extractable) {
      const remaining = Phaser.Math.Clamp(gate.timeRemaining / EXIT_GATE_DURATION, 0, 1);
      g.lineStyle(spectate ? 2 : 1.2, COLORS.GATE, alpha);
      g.strokeCircle(x, y, radius * 0.55);
      g.fillStyle(COLORS.GATE, spectate ? 0.12 : 0.04);
      g.fillCircle(x, y, radius * 0.55);
      g.lineStyle(spectate ? 2 : 1.2, COLORS.GATE, spectate ? 0.58 : 0.18);
      g.beginPath();
      g.arc(x, y, radius + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * remaining, false);
      g.strokePath();
    } else {
      const previewRemaining = Math.max(0, gate.timeRemaining - EXIT_GATE_DURATION);
      const previewProgress = 1 - Phaser.Math.Clamp(previewRemaining / EXIT_GATE_PREVIEW, 0, 1);
      const closingRadius = radius * (6 - 5.45 * previewProgress);
      g.lineStyle(spectate ? 1.5 : 1, COLORS.GATE, spectate ? 0.36 : 0.12);
      g.strokeCircle(x, y, closingRadius);
      g.lineStyle(spectate ? 1.8 : 1.1, COLORS.GATE, alpha * 0.7);
      g.strokeCircle(x, y, radius * 0.55);
    }

    const diamond = radius * 0.25;
    g.lineStyle(spectate ? 1.3 : 0.9, 0xffffff, spectate ? 0.5 : 0.16);
    g.beginPath();
    g.moveTo(x, y - diamond);
    g.lineTo(x + diamond, y);
    g.lineTo(x, y + diamond);
    g.lineTo(x - diamond, y);
    g.closePath();
    g.strokePath();
  }

  private drawMirrorNpcs(
    g: Phaser.GameObjects.Graphics,
    npcs: MirrorNpcSnapshot[],
    mapX: (fx: number) => number,
    mapY: (fy: number) => number,
    mapSize: (fraction: number) => number,
    spectate: boolean,
  ): void {
    const color = COLORS.ENEMY;
    for (const npc of npcs) {
      const x = mapX(npc.x);
      const y = mapY(npc.y);
      const radius = Math.max(spectate ? 7 : 4, mapSize(npc.radius));
      const triR = radius * 1.2;
      const angle = npc.angle;
      const x1 = x + Math.cos(angle) * triR;
      const y1 = y + Math.sin(angle) * triR;
      const x2 = x + Math.cos(angle + Math.PI * 0.75) * triR;
      const y2 = y + Math.sin(angle + Math.PI * 0.75) * triR;
      const x3 = x + Math.cos(angle - Math.PI * 0.75) * triR;
      const y3 = y + Math.sin(angle - Math.PI * 0.75) * triR;

      g.lineStyle(spectate ? 1.6 : 1, color, spectate ? 0.82 : 0.24);
      g.fillStyle(color, spectate ? 0.26 : 0.08);
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.lineTo(x3, y3);
      g.closePath();
      g.fillPath();
      g.strokePath();

      if (npc.shielded) {
        g.lineStyle(spectate ? 1.3 : 0.9, COLORS.SHIELD, spectate ? 0.58 : 0.24);
        g.strokeCircle(x, y, radius * 1.9);
      }
      if (npc.salvaging) {
        g.lineStyle(spectate ? 1.1 : 0.8, color, spectate ? 0.34 : 0.12);
        g.strokeCircle(x, y, radius * 3);
      }
    }
  }

  private drawMirrorLasers(
    g: Phaser.GameObjects.Graphics,
    lasers: MirrorLaserSnapshot[],
    rect: { x: number; y: number; w: number; h: number },
    mapX: (fx: number) => number,
    mapY: (fy: number) => number,
    mapSize: (fraction: number) => number,
    spectate: boolean,
  ): void {
    for (const laser of lasers) {
      const color = laser.kind === 'versus' ? (laser.color ?? VERSUS_LASER_COLOR) : COLORS.ENEMY;
      const width = Math.max(2, mapSize(laser.width));
      const glowAlpha = laser.lethal
        ? (spectate ? 0.18 : 0.08)
        : (spectate ? 0.1 : 0.04);
      const coreAlpha = laser.lethal
        ? (spectate ? 0.82 : 0.34)
        : (spectate ? 0.45 : 0.18);
      const centerAlpha = laser.lethal
        ? (spectate ? 0.7 : 0.24)
        : 0;
      const x1 = laser.axis === 'h' ? rect.x : mapX(laser.pos);
      const y1 = laser.axis === 'h' ? mapY(laser.pos) : rect.y;
      const x2 = laser.axis === 'h' ? rect.x + rect.w : mapX(laser.pos);
      const y2 = laser.axis === 'h' ? mapY(laser.pos) : rect.y + rect.h;

      g.lineStyle(width * (laser.lethal ? 1.8 : 1.2), color, glowAlpha);
      g.lineBetween(x1, y1, x2, y2);
      g.lineStyle(width * (laser.lethal ? 1 : 0.35), color, coreAlpha);
      g.lineBetween(x1, y1, x2, y2);
      if (centerAlpha > 0) {
        g.lineStyle(Math.max(1, width * 0.28), 0xffffff, centerAlpha);
        g.lineBetween(x1, y1, x2, y2);
      }
    }
  }

  private updateStarfield(delta: number): void {
    this.starfieldAccumMs += delta;
    if (this.starfieldAccumMs < this.renderTuning.gameStarfieldFrameMs) {
      return;
    }
    const layout = getLayout();
    const dt = this.starfieldAccumMs / 1000;
    this.starfieldAccumMs = 0;
    for (const star of this.starfieldStars) {
      star.x -= star.speed * dt;
      if (star.x < -GameScene.STARFIELD_OVERSCAN - star.size) {
        star.x = layout.gameWidth + GameScene.STARFIELD_OVERSCAN + star.size;
        star.y = Phaser.Math.Between(-GameScene.STARFIELD_OVERSCAN, layout.gameHeight + GameScene.STARFIELD_OVERSCAN);
      }
    }
    this.drawStarfield();
  }

  private updateEntryGate(delta: number): void {
    if (this.entryGate) {
      this.entryGate.update(delta);
      if (!this.entryGate.active) {
        this.entryGate.destroy();
        this.entryGate = null;
      }
    }
  }

  private startWarpInAt(
    spawnX: number,
    spawnY: number,
    options: { durationMs?: number; showText?: boolean } = {},
  ): void {
    const durationMs = options.durationMs ?? GameScene.START_COUNTDOWN_MS;
    const showText = options.showText ?? true;
    this.countdownDurationMs = durationMs;
    this.countdownTimer = durationMs;
    this.state = GameState.COUNTDOWN;
    this.pausedFromState = GameState.COUNTDOWN;
    this.lastGateActive = false;
    this.inputSystem.clear();

    if (this.entryGate) {
      this.entryGate.destroy();
    }
    this.entryGate = new ExitGate(this, { x: spawnX, y: spawnY }, durationMs);

    if (this.countdownText) {
      this.countdownText.destroy();
      this.countdownText = null;
    }
    if (!showText) {
      return;
    }
    const layout = getLayout();
    this.countdownText = this.add.text(
      layout.centerX,
      layout.centerY,
      GameScene.COUNTDOWN_PHRASES[0],
      {
        fontFamily: TITLE_FONT,
        fontSize: readableFontSize(44),
        color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
        stroke: `#${COLORS.GRID.toString(16).padStart(6, '0')}`,
        strokeThickness: 2,
        align: 'center',
        wordWrap: { width: 500 },
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: 'transparent',
          blur: 0,
          fill: false,
        },
      },
    ).setOrigin(0.5).setDepth(120).setAlpha(0.9);
  }

  private updateCountdown(delta: number, paused = false): void {
    this.countdownTimer = Math.max(0, this.countdownTimer - delta);
    if (this.countdownText) {
      const elapsed = this.countdownDurationMs - this.countdownTimer;
      const phraseIndex = Math.min(
        Math.floor(elapsed / 1000),
        GameScene.COUNTDOWN_PHRASES.length - 1,
      );
      this.countdownText.setText(GameScene.COUNTDOWN_PHRASES[phraseIndex]);
      this.countdownText.setScale(1);
      this.countdownText.setAlpha(0.9);
    }

    if (this.countdownTimer <= 0) {
      this.countdownText?.destroy();
      this.countdownText = null;
      if (paused && this.state === GameState.PAUSED) {
        this.pausedFromState = GameState.PLAYING;
      } else {
        this.state = GameState.PLAYING;
      }
      this.refreshPauseUi();
      // Game entry — clear board, flash white, fresh start
      this.boardWipe(true);
    }
  }

  private drawStarfield(): void {
    const layout = getLayout();
    this.starfield.clear();
    this.starfield.fillStyle(COLORS.STARFIELD_BG, 1);
    this.starfield.fillRect(
      -GameScene.STARFIELD_OVERSCAN,
      -GameScene.STARFIELD_OVERSCAN,
      layout.gameWidth + GameScene.STARFIELD_OVERSCAN * 2,
      layout.gameHeight + GameScene.STARFIELD_OVERSCAN * 2,
    );
    for (const star of this.starfieldStars) {
      this.starfield.fillStyle(star.color, star.alpha);
      this.starfield.fillCircle(star.x, star.y, star.size);
    }
  }

  private redrawArenaBorder(): void {
    const layout = getLayout();
    const affiliatedCompany = this.affiliatedCompanyId ? COMPANIES[this.affiliatedCompanyId] : null;
    const outerBorderColor = affiliatedCompany?.color ?? COLORS.ARENA_BORDER;
    const innerBorderColor = affiliatedCompany?.accent ?? COLORS.HUD;
    this.arenaBorder.clear();
    if (affiliatedCompany) {
      this.arenaBorder.fillStyle(outerBorderColor, 0.045);
      this.arenaBorder.fillRect(0, 0, layout.gameWidth, layout.arenaTop);
      this.arenaBorder.fillRect(0, layout.arenaBottom, layout.gameWidth, layout.gameHeight - layout.arenaBottom);
      this.arenaBorder.fillRect(0, layout.arenaTop, layout.arenaLeft, layout.arenaHeight);
      this.arenaBorder.fillRect(layout.arenaRight, layout.arenaTop, layout.gameWidth - layout.arenaRight, layout.arenaHeight);
    }
    this.arenaBorder.lineStyle(1, COLORS.GRID, 0.06);
    for (let x = layout.arenaLeft + 40; x < layout.arenaRight; x += 40) {
      this.arenaBorder.lineBetween(x, layout.arenaTop, x, layout.arenaBottom);
    }
    for (let y = layout.arenaTop + 40; y < layout.arenaBottom; y += 40) {
      this.arenaBorder.lineBetween(layout.arenaLeft, y, layout.arenaRight, y);
    }

    this.arenaBorder.lineStyle(1.25, outerBorderColor, affiliatedCompany ? 0.42 : 0.32);
    this.arenaBorder.strokeRect(layout.arenaLeft, layout.arenaTop, layout.arenaWidth, layout.arenaHeight);
    this.arenaBorder.lineStyle(1, innerBorderColor, affiliatedCompany ? 0.18 : 0.12);
    this.arenaBorder.strokeRect(layout.arenaLeft + 3, layout.arenaTop + 3, layout.arenaWidth - 6, layout.arenaHeight - 6);
    const cornerMeasure = 12;
    this.arenaBorder.lineStyle(2, outerBorderColor, affiliatedCompany ? 0.84 : 0.72);
    for (const [cx, cy] of [[layout.arenaLeft, layout.arenaTop], [layout.arenaRight, layout.arenaTop], [layout.arenaLeft, layout.arenaBottom], [layout.arenaRight, layout.arenaBottom]]) {
      const sx = cx === layout.arenaLeft ? 1 : -1;
      const sy = cy === layout.arenaTop ? 1 : -1;
      this.arenaBorder.lineBetween(cx, cy, cx + cornerMeasure * sx, cy);
      this.arenaBorder.lineBetween(cx, cy, cx, cy + cornerMeasure * sy);
    }
  }

  private enterResultsState(): void {
    if (!this.resultData) return;

    this.state = GameState.RESULTS;
    this.resultInputLocked = true;
    this.hidePauseMenu();
    this.refreshPauseUi();
    if (this.multiplayer && this.localOutcome) {
      // Mirror visibility is decided inside enterVersusResultFlow: hidden if
      // we go straight to a both-terminal result, kept on (spectate) if we
      // need to wait for the peer.
      this.enterVersusResultFlow();
    } else {
      this.setMirrorVisible(false);
      this.showResultUi(this.resultData);
    }
    this.time.delayedCall(500, () => {
      this.resultInputLocked = false;
    });
  }

  private enterVersusResultFlow(): void {
    if (!this.localOutcome) return;
    if (this.isMultiPilotVersus()) {
      this.beginVersusSpectate();
      if (this.checkMultiPilotAllTerminal()) {
        this.renderVersusResult();
      } else {
        this.showVersusWaitingUi();
      }
      return;
    }
    // Both terminal: render now.
    if (this.peerOutcome) {
      this.setMirrorVisible(false);
      this.renderVersusResult();
      return;
    }
    // Peer is still going. Enter spectate: take over the screen with the peer
    // mirror at higher depth + bigger sizes so the local player can watch.
    this.beginVersusSpectate();
    // Either-side waiting: peer hasn't terminated yet. Show the spectate panel
    // until peer extracts, dies, or leaves. Extract-required win rules:
    // - Local extract + peer alive: 15s auto-WIN safety so a stalling peer
    //   cannot pin the extractor on the result screen forever.
    // - Local death + peer alive: no timeout. Wait for peer's terminal event;
    //   if peer eventually extracts we LOSE, if peer dies it's a DRAW. The
    //   peer-left heartbeat already covers hard disconnects.
    this.showVersusWaitingUi();
    if (this.localOutcome.cause === 'extract') {
      this.versusPeerWaitTimer = this.time.delayedCall(GameScene.VERSUS_PEER_WAIT_MS, () => {
        this.versusPeerWaitTimer = null;
        this.renderVersusResult();
      });
    }
  }

  private showResultUi(data: ResultData): void {
    this.clearResultUi();
    const layout = getLayout();
    const narrowResults = isNarrowViewport(layout);
    const shortResults = isShortViewport(layout);
    const resultCommWidth = Math.min(layout.gameWidth - (narrowResults || shortResults ? 64 : 96), 368);
    this.slickComm.setPanelWidth(resultCommWidth);
    this.regentComm.setPanelWidth(resultCommWidth);
    this.liaisonComm?.setPanelWidth(resultCommWidth);

    const centerX = layout.centerX;
    const isDeath = data.cause === 'death';
    const isCampaign = data.mode === RunMode.CAMPAIGN;
    const isVersus = data.mode === RunMode.VERSUS;
    const isCampaignGameOver = isCampaign && !!data.campaignGameOver;
    const arenaInset = Phaser.Math.Clamp(Math.round(Math.min(layout.arenaWidth, layout.arenaHeight) * 0.04), 16, 30);
    const panelLeft = layout.arenaLeft + arenaInset;
    const panelTop = layout.arenaTop + arenaInset;
    const panelWidth = layout.arenaWidth - arenaInset * 2;
    const panelHeight = layout.arenaHeight - arenaInset * 2;
    const panelBottom = panelTop + panelHeight;
    const compactResults = layout.gameWidth <= 430 || layout.gameHeight <= 760 || narrowResults;
    const ultraCompactResults = layout.gameHeight <= 680 || (narrowResults && shortResults);
    const panelPaddingX = Phaser.Math.Clamp(Math.round(panelWidth * (ultraCompactResults ? 0.065 : 0.08)), ultraCompactResults ? 14 : 18, 30);
    const panelPaddingTop = Phaser.Math.Clamp(Math.round(panelHeight * (ultraCompactResults ? 0.045 : 0.055)), ultraCompactResults ? 14 : 18, 30);
    const panelPaddingBottom = Phaser.Math.Clamp(Math.round(panelHeight * (ultraCompactResults ? 0.04 : 0.05)), ultraCompactResults ? 14 : 18, 28);
    const textWidth = panelWidth - panelPaddingX * 2;
    const titleGap = Phaser.Math.Clamp(Math.round(panelHeight * (ultraCompactResults ? 0.014 : compactResults ? 0.018 : 0.022)), ultraCompactResults ? 4 : 6, compactResults ? 12 : 16);
    const lineGap = Phaser.Math.Clamp(Math.round(panelHeight * (ultraCompactResults ? 0.01 : 0.014)), ultraCompactResults ? 4 : 6, 10);
    const sectionGap = Phaser.Math.Clamp(Math.round(panelHeight * (ultraCompactResults ? 0.016 : compactResults ? 0.02 : 0.026)), ultraCompactResults ? 6 : 8, compactResults ? 16 : 20);
    const buttonWidth = Math.min(panelWidth - panelPaddingX * 2, ultraCompactResults ? 320 : 392);
    const buttonHeight = Phaser.Math.Clamp(Math.round(panelHeight * 0.074), ultraCompactResults ? 36 : 40, 58);
    const buttonGap = Phaser.Math.Clamp(Math.round(panelHeight * 0.022), ultraCompactResults ? 6 : 8, 16);
    const commPanelHeight = Math.max(
      96,
      isDeath
        ? Math.max(this.slickComm.getPanelHeight(), this.regentComm.getPanelHeight())
        : this.slickComm.getPanelHeight(),
    );
    const commGap = Phaser.Math.Clamp(Math.round(panelHeight * (ultraCompactResults ? 0.018 : 0.026)), ultraCompactResults ? 8 : 10, 16);
    const menuButtonY = panelBottom - panelPaddingBottom - buttonHeight / 2;
    const retryButtonY = menuButtonY - buttonHeight - buttonGap;
    const retryButtonTop = retryButtonY - buttonHeight / 2;
    const titleColor = isDeath ? COLORS.ENEMY : COLORS.GATE;
    const titleText = isCampaignGameOver ? 'GAME OVER' : isDeath ? 'DESTROYED' : 'EXTRACTED';
    const titleBarHeight = Phaser.Math.Clamp(Math.round(panelHeight * (ultraCompactResults ? 0.045 : compactResults ? 0.05 : 0.058)), ultraCompactResults ? 30 : 34, 48);
    const titleBarTop = panelTop + Phaser.Math.Clamp(Math.round(panelHeight * 0.018), 8, 16);
    const titleBarBottom = titleBarTop + titleBarHeight;
    const titleSize = readableFontSize(Phaser.Math.Clamp(Math.round(titleBarHeight * 0.58), ultraCompactResults ? 18 : 20, 30));
    const scoreSize = readableFontSize(Phaser.Math.Clamp(Math.round(panelHeight * 0.05), ultraCompactResults ? 22 : 24, 36));
    const metaSize = readableFontSize(Phaser.Math.Clamp(Math.round(panelHeight * 0.026), ultraCompactResults ? 11 : 12, 16));
    const detailSize = readableFontSize(Phaser.Math.Clamp(Math.round(panelHeight * 0.022), ultraCompactResults ? 10 : 11, 14));
    const missionHeaderSize = readableFontSize(Phaser.Math.Clamp(Math.round(panelHeight * 0.024), ultraCompactResults ? 11 : 12, 15));
    const missionLineSize = readableFontSize(Phaser.Math.Clamp(Math.round(panelHeight * 0.022), ultraCompactResults ? 10 : 11, 14));
    const bonusSize = readableFontSize(Phaser.Math.Clamp(Math.round(panelHeight * 0.03), ultraCompactResults ? 13 : 14, 18));
    const bankedLabel = ultraCompactResults ? 'BANKED' : 'CREDITS BANKED';
    const lostLabel = ultraCompactResults ? 'LOST' : 'UNBANKED LOST';

    const backing = this.add.graphics().setDepth(205);
    backing.fillStyle(COLORS.BG, 0.78);
    backing.fillRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 18);
    backing.lineStyle(1.5, titleColor, 0.4);
    backing.strokeRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 18);
    this.resultUi.push(backing);

    const titleBar = this.add.graphics().setDepth(208);
    titleBar.fillStyle(titleColor, 0.94);
    titleBar.fillRect(0, titleBarTop, layout.gameWidth, titleBarHeight);
    titleBar.lineStyle(1, COLORS.BG, 0.35);
    titleBar.lineBetween(0, titleBarTop, layout.gameWidth, titleBarTop);
    titleBar.lineBetween(0, titleBarBottom, layout.gameWidth, titleBarBottom);
    this.resultUi.push(titleBar);

    let currentY = Math.max(panelTop + panelPaddingTop, titleBarBottom + titleGap);

    const title = this.add.text(centerX, titleBarTop + titleBarHeight / 2, titleText, {
      fontFamily: TITLE_FONT,
      fontSize: titleSize,
      color: `#${COLORS.BG.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(210);
    this.resultUi.push(title);

    const scoreText = this.add.text(
      centerX,
      currentY,
      `${bankedLabel}: ${Math.floor(data.score)}`,
      {
        fontFamily: UI_FONT,
        fontSize: scoreSize,
        color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
        align: 'center',
        ...(isDeath ? { wordWrap: { width: textWidth } } : {}),
      },
    ).setOrigin(0.5, 0).setDepth(210);
    this.fitTextToWidth(scoreText, panelWidth - Math.round(panelPaddingX * 1.1), 16);
    this.resultUi.push(scoreText);
    currentY += scoreText.height;
    let resultContentBottomY = currentY;

    if (isDeath && Math.floor(data.lostScore ?? 0) > 0) {
      currentY += lineGap;
      const lostText = this.add.text(centerX, currentY, `${lostLabel}: ${Math.floor(data.lostScore ?? 0)}`, {
        fontFamily: UI_FONT,
        fontSize: compactResults ? detailSize : metaSize,
        color: `#${COLORS.HAZARD.toString(16).padStart(6, '0')}`,
        align: 'center',
        wordWrap: { width: textWidth },
      }).setOrigin(0.5, 0).setDepth(210).setAlpha(0.86);
      this.resultUi.push(lostText);
      currentY += lostText.height;
      resultContentBottomY = currentY;
    }

    if (!data.scoreRecorded) {
      currentY += lineGap;
      const blockedLabel = isVersus
        ? (ultraCompactResults ? 'VERSUS // NO SCORE LOG' : 'VERSUS MATCH // SCORE NOT RECORDED')
        : (ultraCompactResults ? 'DEBUG RUN // NO SCORE' : 'DEBUG RUN // SCORE NOT RECORDED');
      const blockedColor = isVersus ? COLORS.GATE : COLORS.HAZARD;
      const blockedText = this.add.text(centerX, currentY, blockedLabel, {
        fontFamily: UI_FONT,
        fontSize: compactResults ? detailSize : metaSize,
        color: `#${blockedColor.toString(16).padStart(6, '0')}`,
        align: 'center',
        wordWrap: { width: textWidth },
      }).setOrigin(0.5, 0).setDepth(210).setAlpha(0.88);
      this.resultUi.push(blockedText);
      currentY += blockedText.height;
      resultContentBottomY = currentY;
    }

    currentY += lineGap;
    const modeSummary = !data.scoreRecorded
      ? (isVersus
        ? (ultraCompactResults ? 'VERSUS // NO PAYOUTS' : 'VERSUS // NO RECORDS OR PAYOUTS')
        : (ultraCompactResults ? 'DEBUG RUN // NO PAYOUTS' : 'DEBUG RUN // NO RECORDS OR PAYOUTS'))
      : isCampaign
        ? (isCampaignGameOver
          ? (ultraCompactResults ? 'CAMPAIGN OVER // SCORE LOGGED' : 'CAMPAIGN OVER // SCORE SUBMITTED')
          : `CAMPAIGN // LIVES LEFT ${data.campaignLivesRemaining ?? 0}`)
      : (ultraCompactResults ? 'ARCADE // LIVE BOARD' : 'ARCADE // LEADERBOARD LIVE');
    const modeSummaryColor = !data.scoreRecorded
      ? (isVersus ? COLORS.GATE : COLORS.HAZARD)
      : isCampaign
      ? (isCampaignGameOver ? COLORS.HAZARD : COLORS.SALVAGE)
      : COLORS.GATE;
    const modeSummaryText = this.add.text(centerX, currentY, modeSummary, {
      fontFamily: UI_FONT,
      fontSize: compactResults ? detailSize : metaSize,
      color: `#${modeSummaryColor.toString(16).padStart(6, '0')}`,
      align: 'center',
      wordWrap: { width: textWidth },
    }).setOrigin(0.5, 0).setDepth(210).setAlpha(0.82);
    this.fitTextToWidth(modeSummaryText, textWidth, 10);
    this.resultUi.push(modeSummaryText);
    currentY += modeSummaryText.height;
    resultContentBottomY = currentY;

    if (isCampaign) {
      currentY += lineGap;
      const totalExtractedLabel = ultraCompactResults ? 'EXTRACTED' : 'CAMPAIGN EXTRACTED';
      const totalExtracted = Math.floor(data.campaignTotalExtracted ?? 0);
      const missionsCount = Math.floor(data.campaignMissionsCompleted ?? 0);
      const campaignProgressText = this.add.text(
        centerX,
        currentY,
        `${totalExtractedLabel}: ${totalExtracted}c  //  ${ultraCompactResults ? 'MISS' : 'MISSIONS'}: ${missionsCount}`,
        {
          fontFamily: UI_FONT,
          fontSize: compactResults ? detailSize : metaSize,
          color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
          align: 'center',
          wordWrap: { width: textWidth },
        },
      ).setOrigin(0.5, 0).setDepth(210).setAlpha(isCampaignGameOver ? 0.94 : 0.82);
      this.fitTextToWidth(campaignProgressText, textWidth, 10);
      this.resultUi.push(campaignProgressText);
      currentY += campaignProgressText.height;
      resultContentBottomY = currentY;
    }

    if (!isDeath && data.scoreRecorded) {
      currentY += lineGap;
      const walletLabel = isCampaign ? (ultraCompactResults ? 'CAMP WALLET' : 'CAMPAIGN WALLET') : 'ARCADE WALLET';
      const walletText = this.add.text(centerX, currentY, `${walletLabel} +${Math.floor(data.walletPayout ?? 0)}c  //  TOTAL ${Math.floor(data.walletBalance ?? 0)}c`, {
        fontFamily: UI_FONT,
        fontSize: compactResults ? detailSize : metaSize,
        color: `#${COLORS.GATE.toString(16).padStart(6, '0')}`,
        align: 'center',
        wordWrap: { width: textWidth },
      }).setOrigin(0.5, 0).setDepth(210).setAlpha(compactResults ? 0.92 : 0.86);
      this.fitTextToWidth(walletText, textWidth, 10);
      this.resultUi.push(walletText);
      currentY += walletText.height;
      resultContentBottomY = currentY;

      if (!compactResults) {
        currentY += lineGap;
        const slickCutText = this.add.text(centerX, currentY, `YOU KEEP ${getWalletSharePercent()}%  //  SLICK TAKES ${getSlickCutPercent()}%  //  SLICK GOT ${Math.floor(data.slickCut ?? 0)}c`, {
          fontFamily: UI_FONT,
          fontSize: detailSize,
          color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
          align: 'center',
          wordWrap: { width: textWidth },
        }).setOrigin(0.5, 0).setDepth(210).setAlpha(0.62);
        this.resultUi.push(slickCutText);
        currentY += slickCutText.height;
        resultContentBottomY = currentY;
      }
    }

    // Mission results section
    const missions = data.missionProgress ?? [];
    if (missions.length > 0) {
      const missionStartRatio = ultraCompactResults ? 0.18 : compactResults ? 0.2 : (isDeath ? 0.24 : 0.28);
      currentY = Math.max(currentY + sectionGap, panelTop + panelHeight * missionStartRatio);
      const headerLabel = isDeath ? (ultraCompactResults ? 'MISSIONS // FAILED' : 'MISSIONS: INCOMPLETE') : 'MISSIONS:';
      const headerColor = isDeath ? COLORS.HAZARD : COLORS.GATE;
      const mHeader = this.add.text(centerX, currentY, headerLabel, {
        fontFamily: UI_FONT,
        fontSize: missionHeaderSize,
        color: `#${headerColor.toString(16).padStart(6, '0')}`,
        align: 'center',
      }).setOrigin(0.5, 0).setDepth(210).setAlpha(0.8);
      this.resultUi.push(mHeader);
      currentY += mHeader.height + lineGap;
      resultContentBottomY = currentY;

      const missionRepTotal = Math.floor(data.missionRepEarned ?? 0);
      const repSummary = isDeath
        ? (ultraCompactResults ? 'NO REP // EXTRACT REQUIRED' : 'NO COMPANY REP CLAIMED // EXTRACTION REQUIRED')
        : missionRepTotal > 0
          ? `COMPANY REP GAINED: +${missionRepTotal}`
          : 'NO COMPANY REP GAINED';
      const repSummaryColor = isDeath
        ? COLORS.HAZARD
        : missionRepTotal > 0
          ? COLORS.GATE
          : COLORS.HUD;
      const repSummaryText = this.add.text(centerX, currentY, repSummary, {
        fontFamily: UI_FONT,
        fontSize: compactResults ? detailSize : metaSize,
        color: `#${repSummaryColor.toString(16).padStart(6, '0')}`,
        align: 'center',
        wordWrap: { width: textWidth },
      }).setOrigin(0.5, 0).setDepth(210).setAlpha(isDeath ? 0.78 : 0.84);
      this.fitTextToWidth(repSummaryText, textWidth, 10);
      this.resultUi.push(repSummaryText);
      currentY += repSummaryText.height + lineGap;
      resultContentBottomY = currentY;

      const repFluxLine = data.repFluxDeltas ? formatRepDeltasOneLine(data.repFluxDeltas) : null;
      if (repFluxLine) {
        const fluxText = this.add.text(centerX, currentY, repFluxLine, {
          fontFamily: UI_FONT,
          fontSize: compactResults ? detailSize : metaSize,
          color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
          align: 'center',
          wordWrap: { width: textWidth },
        }).setOrigin(0.5, 0).setDepth(210).setAlpha(0.86);
        this.fitTextToWidth(fluxText, textWidth, 10);
        this.resultUi.push(fluxText);
        currentY += fluxText.height + lineGap;
        resultContentBottomY = currentY;
      }

      for (let i = 0; i < missions.length; i++) {
        const m = missions[i];
        const prog = Math.min(m.progress, m.target);
        let line: string;
        let lineColor: number;
        if (!isDeath && m.completed) {
          line = `\u2713 ${m.label}  +${m.reward}c // +${m.repGain} REP`;
          lineColor = COLORS.GATE;
        } else {
          line = `  ${m.label}  ${prog}/${m.target}`;
          lineColor = isDeath ? COLORS.HAZARD : COLORS.HUD;
        }
        const mText = this.add.text(centerX, currentY, line, {
          fontFamily: UI_FONT,
          fontSize: missionLineSize,
          color: `#${lineColor.toString(16).padStart(6, '0')}`,
          align: 'center',
          wordWrap: { width: textWidth },
        }).setOrigin(0.5, 0).setDepth(210).setAlpha(m.completed ? 0.9 : 0.6);
        this.resultUi.push(mText);
        currentY += mText.height + lineGap;
        resultContentBottomY = currentY;
      }

      if (!isDeath && data.missionBonus && data.missionBonus > 0) {
        currentY += Math.max(2, lineGap - 2);
        const bonusText = this.add.text(centerX, currentY, `BONUS: +${data.missionBonus}`, {
          fontFamily: UI_FONT,
          fontSize: bonusSize,
          color: `#${COLORS.GATE.toString(16).padStart(6, '0')}`,
          align: 'center',
          fontStyle: 'bold',
        }).setOrigin(0.5, 0).setDepth(210);
        this.resultUi.push(bonusText);
        currentY += bonusText.height;
        resultContentBottomY = currentY;
      }
    }

    const gapTop = resultContentBottomY + commGap;
    const gapBottom = retryButtonTop - commGap;
    const commAvailableTravel = Math.max(0, gapBottom - gapTop - commPanelHeight);
    const resultCommY = Phaser.Math.Clamp(
      gapTop + commAvailableTravel * (compactResults || isDeath ? 1 : 0.5),
      gapTop,
      Math.max(gapTop, gapBottom - commPanelHeight),
    );

    const useCompactResultComm = compactResults || shortResults;
    if (isDeath && !useCompactResultComm) {
      this.slickComm.setPinnedLayout(resultCommY, 212);
    } else {
      this.slickComm.setPinnedCompactLayout(resultCommY, 212);
    }
    if (isDeath) {
      if (useCompactResultComm) {
        this.regentComm.setPinnedCompactLayout(resultCommY, 212);
      } else {
        this.regentComm.setPinnedLayout(resultCommY, 212);
      }
    } else {
      this.regentComm.resetLayout();
    }

    const primaryButtonLabel = isCampaign
      ? (isCampaignGameOver ? 'NEW CAMPAIGN' : 'NEXT RUN')
      : 'TAP TO RETRY';
    const primaryButtonAction = (): void => {
      if (isCampaignGameOver) {
        this.saveSystem.startNewCampaignSession();
        this.scene.start(SCENE_KEYS.MISSION_SELECT, {
          mode: RunMode.CAMPAIGN,
        } satisfies MenuHandoff);
        return;
      }

      if (isCampaign) {
        // Campaign extract: back to MissionSelect to pick fresh missions, lives unchanged.
        this.scene.start(SCENE_KEYS.MISSION_SELECT, {
          mode: RunMode.CAMPAIGN,
        } satisfies MenuHandoff);
        return;
      }

      this.scene.start(SCENE_KEYS.GAME, {
        mode: this.runMode,
        retryFromDeath: this.resultData?.cause === 'death',
        runBoosts: this.resultData?.cause === 'death'
          ? this.activeRunBoosts ?? undefined
          : undefined,
      } satisfies MenuHandoff);
    };

    this.createResultButton(
      primaryButtonLabel,
      centerX,
      retryButtonY,
      buttonWidth,
      buttonHeight,
      COLORS.HUD,
      primaryButtonAction,
    );

    this.createResultButton(
      'MENU',
      centerX,
      menuButtonY,
      buttonWidth,
      buttonHeight,
      COLORS.HUD,
      () => {
        this.scene.start(SCENE_KEYS.MENU);
      },
    );
  }

  private applyGameplayCommLayout(): void {
    const bottomInset = 2;
    this.slickComm.setBottomPinnedLayout(bottomInset);
    this.regentComm.setBottomPinnedLayout(bottomInset);
    this.liaisonComm?.setBottomPinnedLayout(bottomInset);
  }

  private clearResultUi(): void {
    for (const obj of this.resultUi) {
      obj.destroy();
    }
    this.resultUi = [];
    this.rematchPrimaryRefresh = null;
  }

  private decideVersusBanner(local: VersusOutcome, peer: VersusOutcome): 'WIN' | 'LOSE' | 'DRAW' {
    // Extract is required to win. If neither side extracted (both died, both
    // timed out, or any mix of non-extract outcomes), the match is a draw
    // regardless of score. Among extracts, higher score wins; tied scores draw.
    const localExt = local.cause === 'extract';
    const peerExt = peer.cause === 'extract';
    if (localExt && !peerExt) return 'WIN';
    if (!localExt && peerExt) return 'LOSE';
    if (!localExt && !peerExt) return 'DRAW';
    if (local.score > peer.score) return 'WIN';
    if (local.score < peer.score) return 'LOSE';
    return 'DRAW';
  }

  private beginVersusSpectate(): void {
    this.versusSpectating = true;
    this.geoSphere.setDepth(GameScene.MIRROR_SPECTATE_GEOSPHERE_DEPTH);
    this.drawMirrorBg();
    this.setMirrorVisible(true);
    this.mirrorRenderAccumMs = this.renderTuning.mirrorSpectateRenderFrameMs;
    this.mirrorNeedsRedraw = true;
    // Promote mirror layers above the result-screen backing so the peer's
    // arena reads as the dominant view. The waiting overlay only paints thin
    // top/bottom bars, leaving the middle of the arena open for the mirror.
    this.mirrorBg?.setDepth(GameScene.MIRROR_SPECTATE_BG_DEPTH);
    this.mirrorEntities?.setDepth(GameScene.MIRROR_SPECTATE_ENTITY_DEPTH);
    this.mirrorLabel?.setDepth(GameScene.MIRROR_SPECTATE_TEXT_DEPTH);
    this.mirrorWaiting?.setDepth(GameScene.MIRROR_SPECTATE_TEXT_DEPTH);
    this.refreshRepulsorChargeDepths();
    // Reset spectate inventory state and start the regen timer.
    this.spectateLaserCharges = this.isMultiPilotVersus() ? 1 : 0;
    this.spectateLaserAccumMs = 0;
    this.spectateEnemyCharges = this.isMultiPilotVersus() ? 1 : 0;
    this.spectateEnemyAccumMs = 0;
    this.spectateRepulsorLastSendMs = 0;
    this.showVersusWaitingUi();
    this.buildSpectateInventoryUi();
  }

  private endVersusSpectate(): void {
    if (!this.versusSpectating) return;
    this.versusSpectating = false;
    this.drawMirrorBg();
    this.mirrorRenderAccumMs = this.renderTuning.mirrorRenderFrameMs;
    this.mirrorNeedsRedraw = true;
    this.geoSphere.setDepth(GeoSphere.DEFAULT_DEPTH);
    this.mirrorBg?.setDepth(GameScene.MIRROR_BG_DEPTH);
    this.mirrorEntities?.setDepth(GameScene.MIRROR_ENTITY_DEPTH);
    this.mirrorLabel?.setDepth(GameScene.MIRROR_TEXT_DEPTH);
    this.mirrorWaiting?.setDepth(GameScene.MIRROR_TEXT_DEPTH);
    this.refreshRepulsorChargeDepths();
    this.tearDownSpectateInventoryUi();
    this.setMirrorVisible(false);
  }

  private refreshRepulsorChargeDepths(): void {
    const depth = this.versusSpectating ? GameScene.MIRROR_SPECTATE_ENTITY_DEPTH + 0.5 : 8;
    for (const charge of this.versusRepulsorCharges) {
      charge.graphic.setDepth(depth);
    }
  }

  private buildSpectateInventoryUi(): void {
    this.tearDownSpectateInventoryUi();
    const layout = getLayout();
    const multiPilot = this.isMultiPilotVersus();
    const btnGap = 10;
    const btnH = 34;
    const sidePad = Math.max(18, Math.round(layout.gameWidth * 0.06));
    const btnW = Math.floor((layout.gameWidth - sidePad * 2 - btnGap) / 2);
    const gutterH = Math.max(1, layout.gameHeight - layout.arenaBottom);
    const controlsY = Math.min(
      layout.gameHeight - btnH / 2 - 8,
      layout.arenaBottom + Phaser.Math.Clamp(Math.round(gutterH * 0.45), 20, 34),
    );

    const drawControlButton = (
      cx: number,
      label: string,
      onPress?: () => void,
      enabled: () => boolean = () => true,
    ): Phaser.GameObjects.Text => {
      const bg = this.add.graphics().setDepth(GameScene.MIRROR_SPECTATE_TEXT_DEPTH);
      bg.fillStyle(COLORS.BG, 0.65);
      bg.fillRoundedRect(cx - btnW / 2, controlsY - btnH / 2, btnW, btnH, 8);
      bg.lineStyle(1.5, 0xc070ff, 0.7);
      bg.strokeRoundedRect(cx - btnW / 2, controlsY - btnH / 2, btnW, btnH, 8);
      this.spectateInventoryUi.push(bg);
      const labelText = this.add.text(cx, controlsY, label, {
        fontFamily: UI_FONT,
        fontSize: readableFontSize(12),
        color: '#c070ff',
        align: 'center',
      }).setOrigin(0.5).setDepth(GameScene.MIRROR_SPECTATE_TEXT_DEPTH + 1);
      this.spectateInventoryUi.push(labelText);
      if (onPress) {
        const hit = this.add.zone(cx - btnW / 2, controlsY - btnH / 2, btnW, btnH)
          .setOrigin(0, 0)
          .setDepth(GameScene.MIRROR_SPECTATE_TEXT_DEPTH + 2)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
          event.stopPropagation();
          if (!enabled()) return;
          playUiSelectSfx(this);
          onPress();
        });
        this.spectateInventoryUi.push(hit);
      }
      return labelText;
    };

    const laserX = sidePad + btnW / 2;
    const repulsorX = laserX + btnW + btnGap;
    this.spectateLaserButtonText = drawControlButton(laserX, 'LASER', () => {
      this.fireSpectateRandomLaser();
    }, () => this.spectateLaserCharges > 0);
    if (multiPilot) {
      this.spectateEnemyButtonText = drawControlButton(repulsorX, 'ENEMY', () => {
        this.fireSpectateEnemy();
      }, () => this.spectateEnemyCharges > 0);
    } else {
      this.spectateRepulsorButtonText = drawControlButton(repulsorX, 'REPULSOR');
    }

    if (!multiPilot) {
      // Mirror tap zone: tap anywhere on the peer arena (except the lane button
      // strip) to place a repulsor charge.
      const repulsorZone = this.add.zone(layout.arenaLeft, layout.arenaTop, layout.arenaWidth, layout.arenaHeight)
        .setOrigin(0, 0)
        .setDepth(GameScene.MIRROR_SPECTATE_TEXT_DEPTH - 1)
        .setInteractive({ useHandCursor: true });
      repulsorZone.on('pointerdown', (pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        const fx = (pointer.x - layout.arenaLeft) / Math.max(1, layout.arenaWidth);
        const fy = (pointer.y - layout.arenaTop) / Math.max(1, layout.arenaHeight);
        this.fireSpectateRepulsor(fx, fy);
      });
      this.spectateInventoryUi.push(repulsorZone);
    }

    this.refreshSpectateInventoryUi();
  }

  private tearDownSpectateInventoryUi(): void {
    for (const obj of this.spectateInventoryUi) obj.destroy();
    this.spectateInventoryUi = [];
    this.spectateLaserButtonText = null;
    this.spectateEnemyButtonText = null;
    this.spectateRepulsorButtonText = null;
  }

  private refreshSpectateInventoryUi(): void {
    const multiPilot = this.isMultiPilotVersus();
    const charges = this.spectateLaserCharges;
    if (this.spectateLaserButtonText) {
      const laserMax = multiPilot ? 1 : SPECTATE_LASER_MAX_CHARGES;
      const laserRegen = multiPilot ? MULTI_SPECTATE_LASER_REGEN_MS : SPECTATE_LASER_REGEN_MS;
      if (charges < laserMax) {
        const remainMs = Math.max(0, laserRegen - this.spectateLaserAccumMs);
        const secs = Math.ceil(remainMs / 1000);
        this.spectateLaserButtonText.setText(`LASER x${charges}\n+1 IN ${secs}s`);
        this.spectateLaserButtonText.setAlpha(charges > 0 ? 1 : 0.58);
      } else {
        this.spectateLaserButtonText.setText(`LASER x${charges}\nREADY`);
        this.spectateLaserButtonText.setAlpha(1);
      }
    }
    if (this.spectateEnemyButtonText) {
      if (this.spectateEnemyCharges < 1) {
        const remainMs = Math.max(0, MULTI_SPECTATE_ENEMY_REGEN_MS - this.spectateEnemyAccumMs);
        this.spectateEnemyButtonText.setText(`ENEMY x${this.spectateEnemyCharges}\n+1 IN ${Math.ceil(remainMs / 1000)}s`);
        this.spectateEnemyButtonText.setAlpha(0.58);
      } else {
        this.spectateEnemyButtonText.setText('ENEMY x1\nREADY');
        this.spectateEnemyButtonText.setAlpha(1);
      }
    }
    if (!this.spectateRepulsorButtonText) return;
    const repulsorRemainMs = Math.max(0, SPECTATE_REPULSOR_COOLDOWN_MS - (Date.now() - this.spectateRepulsorLastSendMs));
    if (repulsorRemainMs > 0) {
      this.spectateRepulsorButtonText.setText(`REPULSOR\n${Math.ceil(repulsorRemainMs / 1000)}s`);
      this.spectateRepulsorButtonText.setAlpha(0.58);
    } else {
      this.spectateRepulsorButtonText.setText('REPULSOR\nTAP ARENA');
      this.spectateRepulsorButtonText.setAlpha(1);
    }
  }

  private tickSpectateInventory(delta: number): void {
    if (!this.versusSpectating) return;
    const multiPilot = this.isMultiPilotVersus();
    const laserMax = multiPilot ? 1 : SPECTATE_LASER_MAX_CHARGES;
    const laserRegen = multiPilot ? MULTI_SPECTATE_LASER_REGEN_MS : SPECTATE_LASER_REGEN_MS;
    if (this.spectateLaserCharges < laserMax) {
      this.spectateLaserAccumMs += delta;
      if (this.spectateLaserAccumMs >= laserRegen) {
        this.spectateLaserAccumMs = 0;
        this.spectateLaserCharges = Math.min(laserMax, this.spectateLaserCharges + 1);
      }
    } else {
      this.spectateLaserAccumMs = 0;
    }
    if (multiPilot && this.spectateEnemyCharges < 1) {
      this.spectateEnemyAccumMs += delta;
      if (this.spectateEnemyAccumMs >= MULTI_SPECTATE_ENEMY_REGEN_MS) {
        this.spectateEnemyAccumMs = 0;
        this.spectateEnemyCharges = 1;
      }
    } else {
      this.spectateEnemyAccumMs = 0;
    }
    this.refreshSpectateInventoryUi();
  }

  private showVersusWaitingUi(): void {
    if (this.isMultiPilotVersus()) {
      this.showMultiPilotWaitingUi();
      return;
    }
    this.clearResultUi();
    const layout = getLayout();
    const centerX = layout.centerX;
    const localExtracted = this.localOutcome?.cause === 'extract';
    const accent = localExtracted ? COLORS.GATE : COLORS.HAZARD;
    const titleLabel = localExtracted ? 'EXTRACTED' : 'DESTROYED';
    const peerName = this.getPeerPilotName();
    const localScore = Math.floor(this.localOutcome?.score ?? 0);

    // Dim the local frozen arena so the peer mirror reads cleanly through it.
    const dim = this.add.graphics().setDepth(GameScene.MIRROR_SPECTATE_BG_DEPTH - 1);
    dim.fillStyle(COLORS.BG, GameScene.MIRROR_SPECTATE_BG_ALPHA);
    dim.fillRect(0, 0, layout.gameWidth, layout.gameHeight);
    this.resultUi.push(dim);

    // Top header strip: outcome label + score, plus SPECTATING line.
    const headerHeight = 56;
    const header = this.add.graphics().setDepth(208);
    header.fillStyle(accent, 0.92);
    header.fillRect(0, 0, layout.gameWidth, headerHeight);
    this.resultUi.push(header);

    const headerTitle = this.add.text(centerX, 14, titleLabel, {
      fontFamily: TITLE_FONT,
      fontSize: readableFontSize(20),
      color: `#${COLORS.BG.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5, 0).setDepth(210);
    this.resultUi.push(headerTitle);

    const headerSub = this.add.text(centerX, 38, `${localScore} CR // SPECTATING ${peerName}`, {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(13),
      color: `#${COLORS.BG.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5, 0).setDepth(210).setAlpha(0.92);
    this.resultUi.push(headerSub);

    // Lower status strip: countdown (extract case) or no-win note (death case).
    const statusY = layout.gameHeight - 96;
    const statusText = this.add.text(centerX, statusY, '', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(14),
      color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
      align: 'center',
      stroke: `#${COLORS.BG.toString(16).padStart(6, '0')}`,
      strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(210).setAlpha(0.95);
    this.resultUi.push(statusText);

    if (localExtracted) {
      const startMs = Date.now();
      const tick = (): void => {
        const elapsed = Date.now() - startMs;
        const remain = Math.max(0, GameScene.VERSUS_PEER_WAIT_MS - elapsed);
        const secs = Math.ceil(remain / 1000);
        statusText.setText(`AUTO-WIN IN ${secs}s IF ${peerName} STAYS ALIVE`);
      };
      tick();
      const tickEvent = this.time.addEvent({ delay: 250, loop: true, callback: tick });
      this.resultUi.push({ destroy: () => tickEvent.remove(false) } as unknown as Phaser.GameObjects.GameObject);
    } else {
      // Local died and never extracted. We can no longer win — best case is a
      // DRAW if peer also dies. No auto-resolution timer; wait for peer.
      statusText.setVisible(false);
    }

    // Keep the bottom gutter reserved for spectate disruption controls.
    this.createResultButton('MENU', layout.gameWidth - 52, 28, 84, 30, COLORS.HUD, () => {
      this.scene.start(SCENE_KEYS.MENU);
    });
  }

  private showMultiPilotWaitingUi(): void {
    this.clearResultUi();
    const layout = getLayout();
    const centerX = layout.centerX;
    const localExtracted = this.localOutcome?.cause === 'extract';
    const accent = localExtracted ? COLORS.GATE : COLORS.HAZARD;
    const titleLabel = localExtracted ? 'EXTRACTED' : 'DESTROYED';
    const localScore = Math.floor(this.localOutcome?.score ?? 0);

    const dim = this.add.graphics().setDepth(GameScene.MIRROR_SPECTATE_BG_DEPTH + 4);
    dim.fillStyle(COLORS.BG, 0.9);
    dim.fillRect(0, 0, layout.gameWidth, layout.gameHeight);
    this.resultUi.push(dim);

    const headerHeight = 58;
    const header = this.add.graphics().setDepth(208);
    header.fillStyle(accent, 0.92);
    header.fillRect(0, 0, layout.gameWidth, headerHeight);
    this.resultUi.push(header);

    const headerTitle = this.add.text(centerX, 12, titleLabel, {
      fontFamily: TITLE_FONT,
      fontSize: readableFontSize(20),
      color: `#${COLORS.BG.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5, 0).setDepth(210);
    this.resultUi.push(headerTitle);

    const headerSub = this.add.text(centerX, 38, `${localScore} CR // LIVE MATCH CONTROL`, {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(12),
      color: `#${COLORS.BG.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5, 0).setDepth(210).setAlpha(0.9);
    this.resultUi.push(headerSub);

    const boardTop = headerHeight + 30;
    const rowH = 46;
    const tableWidth = Math.min(layout.gameWidth - 38, 430);
    const tableLeft = centerX - tableWidth / 2;
    const title = this.add.text(centerX, boardTop - 24, 'LIVE STANDINGS', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(14),
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(210);
    this.resultUi.push(title);

    const rowTexts: Phaser.GameObjects.Text[] = [];
    const rows = Math.max(2, this.multiplayerRoster.length || 2);
    for (let i = 0; i < rows; i++) {
      const y = boardTop + i * rowH;
      const bg = this.add.graphics().setDepth(209);
      bg.fillStyle(COLORS.BG, 0.55);
      bg.fillRoundedRect(tableLeft, y, tableWidth, rowH - 8, 7);
      bg.lineStyle(1, COLORS.HUD, 0.16);
      bg.strokeRoundedRect(tableLeft, y, tableWidth, rowH - 8, 7);
      this.resultUi.push(bg);
      const text = this.add.text(tableLeft + 12, y + 9, '', {
        fontFamily: UI_FONT,
        fontSize: readableFontSize(12),
        color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      }).setOrigin(0, 0).setDepth(210);
      this.resultUi.push(text);
      rowTexts.push(text);
    }

    const updateRows = (): void => {
      const pilots = this.getVersusPilotRows();
      for (let i = 0; i < rowTexts.length; i++) {
        const row = pilots[i];
        const text = rowTexts[i];
        if (!row) {
          text.setText('');
          continue;
        }
        text.setColor(`#${row.color.toString(16).padStart(6, '0')}`);
        text.setText(`${i + 1}. ${row.name}  ${row.score}c  PH ${row.phase}  ${row.state}`);
      }
    };
    updateRows();
    const tickEvent = this.time.addEvent({ delay: 500, loop: true, callback: updateRows });
    this.resultUi.push({ destroy: () => tickEvent.remove(false) } as unknown as Phaser.GameObjects.GameObject);

    const footer = this.add.text(centerX, layout.gameHeight - 98, 'LASER HITS ALL ACTIVE PILOTS // ENEMY DEPLOYS TO ALL ACTIVE PILOTS', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(10),
      color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
      align: 'center',
      wordWrap: { width: layout.gameWidth - 34 },
    }).setOrigin(0.5, 0).setDepth(210).setAlpha(0.85);
    this.resultUi.push(footer);

    this.createResultButton('MENU', layout.gameWidth - 52, 28, 84, 30, COLORS.HUD, () => {
      this.scene.start(SCENE_KEYS.MENU);
    });
  }

  private getVersusPilotRows(): Array<{ name: string; score: number; phase: number; state: string; color: number; extracted: boolean }> {
    if (!this.multiplayer) return [];
    const roster = this.multiplayerRoster.length ? this.multiplayerRoster : this.multiplayer.session.getActivePlayers();
    const rows = roster.map((pilot) => {
      const isLocal = pilot.playerId === this.multiplayer?.session.playerId;
      const outcome = isLocal ? this.localOutcome : this.peerOutcomeMap.get(pilot.playerId);
      const score = outcome?.score ?? (isLocal
        ? Math.round(this.scoreSystem.getBanked() + this.scoreSystem.getUnbanked())
        : this.getLatestPeerScore(pilot.playerId));
      const phase = outcome?.phase ?? (isLocal
        ? this.difficultySystem.getConfig().phaseNumber
        : this.getLatestPeerPhase(pilot.playerId));
      const state = outcome?.cause === 'extract'
        ? 'EXTRACTED'
        : outcome?.cause === 'death'
          ? (outcome.killer ? `DESTROYED — ${outcome.killer.toUpperCase()}` : 'DESTROYED')
          : 'ALIVE';
      return {
        name: `${pilot.playerName.trim().toUpperCase() || pilot.playerId.toUpperCase()}${isLocal ? ' YOU' : ''}`,
        score: Math.floor(score),
        phase,
        state,
        color: this.getVersusColorForPlayer(pilot.playerId),
        extracted: outcome?.cause === 'extract',
      };
    });
    return rows.sort((a, b) => {
      if (a.extracted !== b.extracted) return a.extracted ? -1 : 1;
      return b.score - a.score;
    });
  }

  private renderVersusResult(): void {
    if (this.versusResultRendered) return;
    if (!this.localOutcome) return;
    this.versusResultRendered = true;
    this.cancelVersusPeerWait();
    this.endVersusSpectate();
    setResultMusic(this);
    if (this.isMultiPilotVersus()) {
      this.showMultiPilotResultUi();
      return;
    }
    const peer: VersusOutcome = this.peerOutcome ?? {
      cause: 'survived',
      score: this.getLatestPeerScore(),
      time: 0,
      phase: this.getLatestPeerPhase(),
    };
    this.showVersusResultUi(this.localOutcome, peer);
  }

  private showVersusResultUi(local: VersusOutcome, peer: VersusOutcome): void {
    this.clearResultUi();
    const layout = getLayout();
    const arenaInset = Phaser.Math.Clamp(Math.round(Math.min(layout.arenaWidth, layout.arenaHeight) * 0.04), 16, 30);
    const panelLeft = layout.arenaLeft + arenaInset;
    const panelTop = layout.arenaTop + arenaInset;
    const panelWidth = layout.arenaWidth - arenaInset * 2;
    const panelHeight = layout.arenaHeight - arenaInset * 2;
    const centerX = layout.centerX;
    const banner = this.decideVersusBanner(local, peer);
    const bannerColor = banner === 'WIN' ? COLORS.GATE : banner === 'LOSE' ? COLORS.HAZARD : COLORS.HUD;
    const compact = layout.gameWidth <= 430 || layout.gameHeight <= 760;
    const localName = this.getLocalPilotName();
    const peerName = this.getPeerPilotName();

    const backing = this.add.graphics().setDepth(205);
    backing.fillStyle(COLORS.BG, 0.82);
    backing.fillRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 18);
    backing.lineStyle(1.5, bannerColor, 0.4);
    backing.strokeRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 18);
    this.resultUi.push(backing);

    const titleBarHeight = Phaser.Math.Clamp(Math.round(panelHeight * (compact ? 0.05 : 0.058)), 32, 48);
    const titleBarTop = panelTop + 12;
    const titleBar = this.add.graphics().setDepth(208);
    titleBar.fillStyle(bannerColor, 0.94);
    titleBar.fillRect(0, titleBarTop, layout.gameWidth, titleBarHeight);
    this.resultUi.push(titleBar);

    const title = this.add.text(centerX, titleBarTop + titleBarHeight / 2, banner, {
      fontFamily: TITLE_FONT,
      fontSize: readableFontSize(Phaser.Math.Clamp(Math.round(titleBarHeight * 0.6), 20, 32)),
      color: `#${COLORS.BG.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5).setDepth(210);
    this.resultUi.push(title);

    const buttonHeight = compact ? 40 : 46;
    const buttonGap = compact ? 8 : 12;
    const buttonRowWidth = Math.min(panelWidth - 64, 360);
    const halfButtonWidth = (buttonRowWidth - buttonGap) / 2;
    const menuY = panelTop + panelHeight - 28 - buttonHeight / 2;

    const colTop = titleBarTop + titleBarHeight + (compact ? 28 : 40);
    const colBottom = menuY - buttonHeight / 2 - (compact ? 18 : 24);
    const colMidX = centerX;
    const colInset = compact ? 14 : 24;
    const leftColX = panelLeft + (panelWidth / 4);
    const rightColX = panelLeft + (panelWidth * 3 / 4);
    const colWidth = panelWidth / 2 - colInset;

    const divider = this.add.graphics().setDepth(209);
    divider.lineStyle(1, COLORS.HUD, 0.35);
    divider.lineBetween(colMidX, colTop, colMidX, colBottom);
    this.resultUi.push(divider);

    const headerSize = readableFontSize(compact ? 16 : 20);
    const scoreSize = readableFontSize(compact ? 28 : 36);
    const outcomeSize = readableFontSize(compact ? 13 : 15);
    const phaseSize = readableFontSize(compact ? 12 : 14);

    const renderColumn = (x: number, header: string, outcome: VersusOutcome, isLocal: boolean): void => {
      let y = colTop;
      const headerText = this.add.text(x, y, header, {
        fontFamily: UI_FONT,
        fontSize: headerSize,
        color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }).setOrigin(0.5, 0).setDepth(210).setAlpha(isLocal ? 0.95 : 0.78);
      this.resultUi.push(headerText);
      y += headerText.height + (compact ? 6 : 10);

      const scoreText = this.add.text(x, y, String(Math.floor(outcome.score)), {
        fontFamily: UI_FONT,
        fontSize: scoreSize,
        color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5, 0).setDepth(210);
      this.fitTextToWidth(scoreText, colWidth, 16);
      this.resultUi.push(scoreText);
      y += scoreText.height + (compact ? 6 : 10);

      let outcomeLabel: string;
      let outcomeColor: number;
      if (outcome.cause === 'extract') {
        outcomeLabel = 'EXTRACTED';
        outcomeColor = COLORS.GATE;
      } else if (outcome.cause === 'death') {
        const killerWord = outcome.killer
          ? ` — ${outcome.killer.toUpperCase()}`
          : outcome.deathCause
            ? ` — ${outcome.deathCause.toUpperCase()}`
            : '';
        outcomeLabel = `DESTROYED${killerWord}`;
        outcomeColor = COLORS.HAZARD;
      } else {
        outcomeLabel = 'STILL ALIVE';
        outcomeColor = COLORS.HUD;
      }
      const outcomeText = this.add.text(x, y, outcomeLabel, {
        fontFamily: UI_FONT,
        fontSize: outcomeSize,
        color: `#${outcomeColor.toString(16).padStart(6, '0')}`,
        align: 'center',
        wordWrap: { width: colWidth },
      }).setOrigin(0.5, 0).setDepth(210);
      this.resultUi.push(outcomeText);
      y += outcomeText.height + (compact ? 4 : 6);

      const phaseText = this.add.text(x, y, `PHASE ${outcome.phase}`, {
        fontFamily: UI_FONT,
        fontSize: phaseSize,
        color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5, 0).setDepth(210).setAlpha(0.7);
      this.resultUi.push(phaseText);
    };

    renderColumn(leftColX, localName, local, true);
    renderColumn(rightColX, peerName, peer, false);

    const noteY = menuY - buttonHeight - (compact ? 14 : 22);
    const noteText = this.add.text(centerX, noteY, 'VERSUS // NO RECORDS OR PAYOUTS', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(compact ? 10 : 12),
      color: `#${COLORS.GATE.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5).setDepth(210).setAlpha(0.7);
    this.resultUi.push(noteText);

    const rematchX = centerX - halfButtonWidth / 2 - buttonGap / 2;
    const menuX = centerX + halfButtonWidth / 2 + buttonGap / 2;
    this.createRematchPrimaryButton(rematchX, menuY, halfButtonWidth, buttonHeight);
    this.createResultButton('MENU', menuX, menuY, halfButtonWidth, buttonHeight, COLORS.HUD, () => {
      this.scene.start(SCENE_KEYS.MENU);
    });
  }

  private showMultiPilotResultUi(): void {
    this.clearResultUi();
    const layout = getLayout();
    const centerX = layout.centerX;
    const arenaInset = Phaser.Math.Clamp(Math.round(Math.min(layout.arenaWidth, layout.arenaHeight) * 0.04), 16, 30);
    const panelLeft = layout.arenaLeft + arenaInset;
    const panelTop = layout.arenaTop + arenaInset;
    const panelWidth = layout.arenaWidth - arenaInset * 2;
    const panelHeight = layout.arenaHeight - arenaInset * 2;
    const compact = layout.gameWidth <= 430 || layout.gameHeight <= 760;

    const rows = this.getVersusPilotRows();
    const winner = rows[0];
    const localWon = !!winner && winner.name.endsWith(' YOU');
    const banner = localWon ? 'WIN' : winner ? 'LOSE' : 'DRAW';
    const bannerColor = banner === 'WIN' ? COLORS.GATE : banner === 'LOSE' ? COLORS.HAZARD : COLORS.HUD;

    const backing = this.add.graphics().setDepth(205);
    backing.fillStyle(COLORS.BG, 0.86);
    backing.fillRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 18);
    backing.lineStyle(1.5, bannerColor, 0.45);
    backing.strokeRoundedRect(panelLeft, panelTop, panelWidth, panelHeight, 18);
    this.resultUi.push(backing);

    const titleBarHeight = Phaser.Math.Clamp(Math.round(panelHeight * (compact ? 0.05 : 0.058)), 32, 48);
    const titleBarTop = panelTop + 12;
    const titleBar = this.add.graphics().setDepth(208);
    titleBar.fillStyle(bannerColor, 0.94);
    titleBar.fillRect(0, titleBarTop, layout.gameWidth, titleBarHeight);
    this.resultUi.push(titleBar);

    const title = this.add.text(centerX, titleBarTop + titleBarHeight / 2, banner, {
      fontFamily: TITLE_FONT,
      fontSize: readableFontSize(Phaser.Math.Clamp(Math.round(titleBarHeight * 0.6), 20, 32)),
      color: `#${COLORS.BG.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5).setDepth(210);
    this.resultUi.push(title);

    const tableTop = titleBarTop + titleBarHeight + (compact ? 22 : 30);
    const buttonHeight = compact ? 40 : 46;
    const menuY = panelTop + panelHeight - 28 - buttonHeight / 2;
    const tableBottom = menuY - buttonHeight / 2 - (compact ? 18 : 24);
    const tableWidth = Math.min(panelWidth - 32, 440);
    const tableLeft = centerX - tableWidth / 2;
    const rowCount = Math.max(1, rows.length);
    const rowGap = 8;
    const rowMaxH = 56;
    const rowH = Math.min(rowMaxH, Math.max(34, Math.floor((tableBottom - tableTop - rowGap * (rowCount - 1)) / rowCount)));

    const heading = this.add.text(centerX, tableTop - 18, 'FINAL STANDINGS', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(13),
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(210);
    this.resultUi.push(heading);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const y = tableTop + i * (rowH + rowGap);
      const bg = this.add.graphics().setDepth(209);
      bg.fillStyle(COLORS.BG, 0.62);
      bg.fillRoundedRect(tableLeft, y, tableWidth, rowH, 8);
      bg.lineStyle(1.5, row.color, i === 0 ? 0.85 : 0.32);
      bg.strokeRoundedRect(tableLeft, y, tableWidth, rowH, 8);
      this.resultUi.push(bg);

      const rankText = this.add.text(tableLeft + 14, y + rowH / 2, `${i + 1}`, {
        fontFamily: TITLE_FONT,
        fontSize: readableFontSize(compact ? 18 : 22),
        color: `#${row.color.toString(16).padStart(6, '0')}`,
      }).setOrigin(0, 0.5).setDepth(210);
      this.resultUi.push(rankText);

      const nameText = this.add.text(tableLeft + 48, y + 6, row.name, {
        fontFamily: UI_FONT,
        fontSize: readableFontSize(compact ? 12 : 14),
        color: `#${row.color.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }).setOrigin(0, 0).setDepth(210);
      this.resultUi.push(nameText);

      const detail = `${row.state}  PH ${row.phase}`;
      const detailText = this.add.text(tableLeft + 48, y + rowH - 8, detail, {
        fontFamily: UI_FONT,
        fontSize: readableFontSize(compact ? 10 : 11),
        color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      }).setOrigin(0, 1).setDepth(210).setAlpha(0.78);
      this.resultUi.push(detailText);

      const scoreText = this.add.text(tableLeft + tableWidth - 16, y + rowH / 2, `${row.score}c`, {
        fontFamily: UI_FONT,
        fontSize: readableFontSize(compact ? 16 : 20),
        color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
      }).setOrigin(1, 0.5).setDepth(210);
      this.resultUi.push(scoreText);
    }

    const noteY = menuY - buttonHeight / 2 - (compact ? 14 : 18);
    const noteText = this.add.text(centerX, noteY, 'VERSUS // NO RECORDS OR PAYOUTS', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(compact ? 10 : 12),
      color: `#${COLORS.GATE.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5).setDepth(210).setAlpha(0.7);
    this.resultUi.push(noteText);

    const totalButtonsWidth = Math.min(panelWidth - 64, 360);
    const buttonGap = 12;
    const halfButtonWidth = (totalButtonsWidth - buttonGap) / 2;
    const rematchX = centerX - halfButtonWidth / 2 - buttonGap / 2;
    const menuX = centerX + halfButtonWidth / 2 + buttonGap / 2;
    this.createRematchPrimaryButton(rematchX, menuY, halfButtonWidth, buttonHeight);
    this.createResultButton('MENU', menuX, menuY, halfButtonWidth, buttonHeight, COLORS.HUD, () => {
      this.scene.start(SCENE_KEYS.MENU);
    });
  }

  private createRematchPrimaryButton(x: number, y: number, width: number, height: number): void {
    const bg = this.add.graphics().setDepth(210);
    const labelText = this.add.text(x, y, '', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(Phaser.Math.Clamp(Math.round(height * 0.36), 12, 17)),
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(211);
    const hit = this.add.zone(x, y, width, height)
      .setData('cornerRadius', 10)
      .setOrigin(0.5)
      .setDepth(212)
      .setInteractive({ useHandCursor: true });

    let hovered = false;
    let pressed = false;
    let currentColor = COLORS.HUD;
    let currentAction: (() => void) | null = null;
    let enabled = true;

    const draw = (): void => {
      const left = x - width / 2;
      const top = y - height / 2;
      bg.clear();
      const fillA = enabled ? (hovered ? 0.92 : 0.82) : 0.5;
      bg.fillStyle(COLORS.BG, fillA);
      const strokeA = enabled ? (pressed ? 0.95 : hovered ? 0.72 : 0.45) : 0.25;
      bg.lineStyle(1.5, currentColor, strokeA);
      bg.fillRoundedRect(left, top, width, height, 10);
      bg.strokeRoundedRect(left, top, width, height, 10);
      const innerA = enabled ? (pressed ? 0.18 : hovered ? 0.1 : 0.06) : 0.03;
      bg.fillStyle(currentColor, innerA);
      bg.fillRoundedRect(left + 4, top + 4, width - 8, height - 8, 8);
      labelText.setColor(`#${currentColor.toString(16).padStart(6, '0')}`);
      labelText.setAlpha(enabled ? (pressed ? 1 : hovered ? 0.96 : 0.88) : 0.42);
    };

    const apply = (): void => {
      let label: string;
      let color: number;
      let action: (() => void) | null;
      let isEnabled = true;
      if (this.isMultiPilotVersus()) {
        const status = this.getMultiPilotRematchStatus();
        if (this.rematchInFlight) {
          label = 'STARTING…';
          color = COLORS.GATE;
          action = null;
          isEnabled = false;
        } else if (status.total === 0) {
          label = 'ALL LEFT';
          color = COLORS.HAZARD;
          action = null;
          isEnabled = false;
        } else if (this.localRematch) {
          label = `WAITING (${status.ready}/${status.total}) — CANCEL`;
          color = COLORS.HUD;
          action = () => this.cancelRematch();
        } else if (status.ready > 0) {
          label = `REMATCH (${status.ready}/${status.total} READY)`;
          color = COLORS.GATE;
          action = () => this.requestRematch();
        } else {
          label = 'REMATCH';
          color = COLORS.HUD;
          action = () => this.requestRematch();
        }
      } else {
        const peerName = this.getPeerPilotName();
        if (this.peerLeft) {
          label = `${peerName} LEFT`;
          color = COLORS.HAZARD;
          action = null;
          isEnabled = false;
        } else if (this.rematchInFlight) {
          label = 'STARTING…';
          color = COLORS.GATE;
          action = null;
          isEnabled = false;
        } else if (this.localRematch) {
          label = 'WAITING — CANCEL';
          color = COLORS.HUD;
          action = () => this.cancelRematch();
        } else if (this.peerRematch) {
          label = `REMATCH (${peerName} READY)`;
          color = COLORS.GATE;
          action = () => this.requestRematch();
        } else {
          label = 'REMATCH';
          color = COLORS.HUD;
          action = () => this.requestRematch();
        }
      }
      labelText.setText(label);
      this.fitTextToWidth(labelText, width - 16, 10);
      currentColor = color;
      currentAction = action;
      enabled = isEnabled;
      draw();
    };

    hit.on('pointerover', () => { if (!enabled) return; hovered = true; draw(); });
    hit.on('pointerout', () => { hovered = false; pressed = false; draw(); });
    hit.on('pointerdown', (
      _pointer: Phaser.Input.Pointer,
      _lx: number,
      _ly: number,
      event: Phaser.Types.Input.EventData,
    ) => {
      event.stopPropagation();
      if (this.resultInputLocked || !enabled || !currentAction) return;
      pressed = true;
      draw();
      playUiSelectSfx(this);
      currentAction();
    });

    this.resultUi.push(bg, labelText, hit);
    this.rematchPrimaryRefresh = apply;
    apply();
  }

  private fitTextToWidth(text: Phaser.GameObjects.Text, maxWidth: number, minFontSize: number): void {
    let fontSize = Number.parseInt(String(text.style.fontSize), 10);
    if (!Number.isFinite(fontSize)) {
      return;
    }
    while (text.width > maxWidth && fontSize > minFontSize) {
      fontSize -= 1;
      text.setFontSize(fontSize);
    }
  }

  private createResultButton(
    label: string,
    x: number,
    y: number,
    width: number,
    height: number,
    accentColor: number,
    onClick: () => void,
  ): void {
    const bg = this.add.graphics().setDepth(210);
    const labelText = this.add.text(x, y, label, {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(Phaser.Math.Clamp(Math.round(height * 0.42), 14, 19)),
      color: `#${accentColor.toString(16).padStart(6, '0')}`,
      align: 'center',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(211);
    const hit = this.add.zone(x, y, width, height)
      .setData('cornerRadius', 10)
      .setOrigin(0.5)
      .setDepth(212)
      .setInteractive({ useHandCursor: true });

    const draw = (hovered: boolean, pressed: boolean): void => {
      const left = x - width / 2;
      const top = y - height / 2;
      bg.clear();
      bg.fillStyle(COLORS.BG, hovered ? 0.92 : 0.82);
      bg.lineStyle(1.5, accentColor, pressed ? 0.95 : hovered ? 0.72 : 0.45);
      bg.fillRoundedRect(left, top, width, height, 10);
      bg.strokeRoundedRect(left, top, width, height, 10);
      bg.fillStyle(accentColor, pressed ? 0.18 : hovered ? 0.1 : 0.06);
      bg.fillRoundedRect(left + 4, top + 4, width - 8, height - 8, 8);
      labelText.setAlpha(pressed ? 1 : hovered ? 0.96 : 0.88);
    };

    draw(false, false);

    hit.on('pointerover', () => draw(true, false));
    hit.on('pointerout', () => draw(false, false));
    hit.on('pointerdown', (
      _pointer: Phaser.Input.Pointer,
      _lx: number,
      _ly: number,
      event: Phaser.Types.Input.EventData,
    ) => {
      event.stopPropagation();
      if (this.resultInputLocked) return;
      draw(true, true);
      playUiSelectSfx(this);
      onClick();
    });

    this.resultUi.push(bg, labelText, hit);
  }

  private createPauseButton(): void {
    const layout = getLayout();
    const compactHud = layout.gameWidth <= 430;
    const topMargin = compactHud ? 12 : 16;
    const buttonWidth = compactHud ? 58 : 64;
    const buttonHeight = compactHud ? 30 : 34;
    const buttonX = layout.centerX;
    const buttonY = topMargin + buttonHeight / 2;

    this.pauseButtonBg = this.add.graphics().setDepth(230);
    this.pauseButtonText = this.add.text(buttonX, buttonY, '||', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(14),
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(231);

    this.pauseButtonHit = this.add.zone(
      buttonX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
    ).setData('cornerRadius', 8).setOrigin(0, 0).setDepth(232).setInteractive({ useHandCursor: true });
    this.pauseButtonHit.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        playUiSelectSfx(this);
        this.togglePause();
      },
    );
  }

  /** Clear all hazards, enemies, salvage, and pickups — each shatters into debris. */
  private clearBoard(clearBoss = true, trackMissionKills = true): void {
    const drifters = this.difficultySystem.getDrifters();
    for (const d of drifters) {
      this.playerDebris.push(new ShipDebris(this, d.x, d.y, d.vx, d.vy, COLORS.ASTEROID, d.radius));
      d.destroy();
    }
    drifters.length = 0;

    const beams = this.difficultySystem.getBeams();
    for (const b of beams) b.destroy();
    beams.length = 0;

    const enemies = this.difficultySystem.getEnemies();
    for (const e of enemies) {
      this.playerDebris.push(new ShipDebris(this, e.x, e.y, e.getVelocityX(), e.getVelocityY(), COLORS.ENEMY, e.radius));
      if (trackMissionKills) {
        this.missionSystem.trackEnemyKill();
        this.repFluxTracker.trackPlayerKill();
      }
      e.destroy();
    }
    enemies.length = 0;

    const npcs = this.difficultySystem.getNPCs();
    for (const n of npcs) {
      this.playerDebris.push(new ShipDebris(this, n.x, n.y, n.vx, n.vy, n.getHullColor(), n.radius));
      n.destroy();
    }
    npcs.length = 0;

    if (clearBoss) {
      const boss = this.difficultySystem.getBoss();
      if (boss) {
        const center = boss.getCenter();
        this.playerDebris.push(new ShipDebris(this, center.x, center.y, 0, 0, COLORS.ENEMY, 34));
        this.difficultySystem.clearBoss();
      }
    }

    for (const s of this.shields) {
      this.playerDebris.push(new ShipDebris(this, s.x, s.y, s.vx, s.vy, COLORS.SALVAGE, s.radius));
      s.destroy();
    }
    this.shields = [];

    for (const b of this.bonusPickups) {
      this.playerDebris.push(new ShipDebris(this, b.x, b.y, b.vx, b.vy, COLORS.SALVAGE, b.radius));
      b.destroy();
    }
    this.bonusPickups = [];

    for (const b of this.bombPickups) {
      this.playerDebris.push(new ShipDebris(this, b.x, b.y, b.vx, b.vy, COLORS.SALVAGE, b.radius));
      b.destroy();
    }
    this.bombPickups = [];

    for (const wormhole of this.wormholePickups) {
      this.playerDebris.push(new ShipDebris(this, wormhole.x, wormhole.y, wormhole.vx, wormhole.vy, COLORS.GATE, wormhole.radius));
      wormhole.destroy();
    }
    this.wormholePickups = [];

    for (const p of this.versusLaserPickups) p.destroy();
    this.versusLaserPickups = [];
    for (const s of this.versusLaserStrikes) s.destroy();
    this.versusLaserStrikes = [];

    for (const d of this.debrisList) {
      const color = d.isRare ? 0xff44ff : COLORS.SALVAGE;
      this.playerDebris.push(new ShipDebris(this, d.x, d.y, d.driftVx, d.driftVy, color, 20));
      this.salvageSystem.removeDebris(d);
      d.destroy();
    }
    this.debrisList = [];
  }

  /** Flash the board white, clear all entities, then respawn salvage after a delay. */
  private boardWipe(playBombSfx = false): void {
    if (playBombSfx) {
      playSfx(this, 'bomb');
    }
    this.clearBoard(false);
    Overlays.bombFlash(this);
    this.time.delayedCall(800, () => {
      if (this.state === GameState.PLAYING || this.state === GameState.COUNTDOWN) {
        this.spawnDebris();
      }
    });
  }

  // Wires Shift+1..9 / Shift+0 → debugJumpToPhase and exposes the same hook on
  // window so devtools can trigger it. No visible UI; safe to ship.
  private updateScheduledWormhole(
    currentPhase: number,
    delta: number,
    runFrozen: boolean,
    paused: boolean,
    gameplayActive: boolean,
  ): void {
    if (this.naturalWormholeSpawnedThisRun || this.scheduledWormholePhase === null || currentPhase !== this.scheduledWormholePhase) {
      return;
    }

    if (this.wormholeEventPhase !== currentPhase) {
      this.wormholeEventPhase = currentPhase;
      this.wormholeEventTimer = 0;
    }

    if (runFrozen || paused || !gameplayActive || this.pocketActive || this.multiplayer) {
      return;
    }

    if (currentPhase < WORMHOLE_MIN_PHASE || currentPhase > WORMHOLE_MAX_PHASE) {
      return;
    }

    if (this.wormholePickups.length > 0) {
      return;
    }

    if (this.extractionSystem.getGate() || this.extractionSystem.getClosingGate()) {
      return;
    }

    this.wormholeEventTimer += delta;
    if (this.wormholeEventTimer < WORMHOLE_EVENT_SPAWN_DELAY_MS) {
      return;
    }

    this.wormholeEventTimer = -999_999;
    this.naturalWormholeSpawnedThisRun = true;
    this.spawnGateLikeWormhole();
  }

  private maybeSpawnWormholeFromRareDebris(debris: SalvageDebris, onScreen: boolean): void {
    const currentPhase = this.extractionSystem.getPhaseCount();
    if (!onScreen || !this.canSpawnWormholeThisPhase(currentPhase)) {
      return;
    }

    if (Math.random() >= WORMHOLE_DROP_CHANCE_RARE_SALVAGE) {
      return;
    }

    this.naturalWormholeSpawnedThisRun = true;
    this.spawnWormholePickup(
      debris.x,
      debris.y,
      debris.driftVx * 0.45,
      debris.driftVy * 0.45,
    );
  }

  private canSpawnWormholeThisPhase(phase: number): boolean {
    if (this.multiplayer || this.pocketActive || this.naturalWormholeSpawnedThisRun) {
      return false;
    }

    if (phase < WORMHOLE_MIN_PHASE || phase > WORMHOLE_MAX_PHASE) {
      return false;
    }

    if (this.wormholePickups.length > 0) {
      return false;
    }

    return !this.extractionSystem.getGate() && !this.extractionSystem.getClosingGate();
  }

  private rollScheduledWormholePhase(): number | null {
    if (Math.random() >= WORMHOLE_SCHEDULED_RUN_CHANCE) {
      return null;
    }

    return Phaser.Math.Between(WORMHOLE_MIN_PHASE, WORMHOLE_MAX_PHASE);
  }

  private spawnWormholePickup(
    x: number,
    y: number,
    vx: number,
    vy: number,
    previewTime = 0,
    activeTime = WORMHOLE_PICKUP_LIFETIME,
  ): void {
    if (this.wormholePickups.length > 0) {
      return;
    }

    this.wormholePickups.push(new WormholePickup(this, x, y, vx, vy, previewTime, activeTime));
  }

  private spawnGateLikeWormhole(): void {
    const layout = getLayout();
    const inset = EXIT_GATE_RADIUS + 18;
    const x = Phaser.Math.Between(layout.arenaLeft + inset, layout.arenaRight - inset);
    const y = Phaser.Math.Between(layout.arenaTop + inset, layout.arenaBottom - inset);
    this.spawnWormholePickup(x, y, 0, 0, WORMHOLE_EVENT_PREVIEW_MS, WORMHOLE_EVENT_ACTIVE_MS);
  }

  private spawnDebugWormhole(): void {
    if (this.multiplayer || this.pocketActive) {
      return;
    }

    this.scoreRecordingBlocked = true;
    this.destroyAllWormholes();
    this.spawnGateLikeWormhole();
  }

  private getDebugPickupPosition(offsetY = -44): { x: number; y: number } {
    const layout = getLayout();
    return {
      x: Phaser.Math.Clamp(this.player.x, layout.arenaLeft + 40, layout.arenaRight - 40),
      y: Phaser.Math.Clamp(this.player.y + offsetY, layout.arenaTop + 40, layout.arenaBottom - 40),
    };
  }

  private spawnDebugShield(): void {
    this.scoreRecordingBlocked = true;
    const p = this.getDebugPickupPosition(-44);
    this.shields.push(new ShieldPickup(this, p.x, p.y, 0, 0));
  }

  private spawnDebugBomb(): void {
    this.scoreRecordingBlocked = true;
    const p = this.getDebugPickupPosition(-44);
    this.bombPickups.push(new BombPickup(this, p.x, p.y, 0, 0));
  }

  private spawnDebugBonus(): void {
    this.scoreRecordingBlocked = true;
    const p = this.getDebugPickupPosition(-44);
    this.bonusPickups.push(new BonusPickup(this, p.x, p.y, 500, 0, 0, 0));
  }

  private isPlayerInvulnerable(): boolean {
    return this.debugInvulnerable || this.invulnerableTimer > 0;
  }

  private toggleDebugInvulnerable(): void {
    this.debugInvulnerable = !this.debugInvulnerable;
    if (this.debugInvulnerable) {
      this.scoreRecordingBlocked = true;
      this.invulnerableTimer = 0;
      this.tryShowGameplaySlick('DEBUG // INVULNERABLE ON', 1600);
    } else {
      this.player.graphic.setAlpha(1);
      this.tryShowGameplaySlick('DEBUG // INVULNERABLE OFF', 1600);
    }
  }

  private destroyAllWormholes(): void {
    for (const wormhole of this.wormholePickups) {
      wormhole.destroy();
    }
    this.wormholePickups = [];
  }

  private enterWormholePocket(): void {
    if (this.pocketActive || this.multiplayer) {
      return;
    }

    this.pocketEntryPhase = this.extractionSystem.getPhaseCount();
    this.destroyAllWormholes();
    this.clearBoard(true, false);
    this.naturalWormholeSpawnedThisRun = true;
    this.pocketActive = true;
    this.pocketTimerMs = WORMHOLE_POCKET_DURATION_MS;
    this.pocketRareSalvageTimer = WORMHOLE_POCKET_RARE_SALVAGE_INTERVAL_MS;
    this.pocketBonusTimer = WORMHOLE_POCKET_BONUS_INTERVAL_MS;
    this.pocketBoundaryBurnMs = 0;
    this.restorePaletteId = this.activePaletteId === POCKET_PALETTE_ID
      ? getSettings().paletteId
      : this.activePaletteId;
    this.lastGateActive = false;
    this.extractionSystem.enterPocketMode();
    this.difficultySystem.setPocketActive(true);
    this.salvageSystem.setPocketYieldMult(WORMHOLE_POCKET_SALVAGE_MULT);
    this.spawnRareDebris(this.pocketEntryPhase);
    this.clearPocketThreats();
    this.geoSphere.setVisible(false);
    this.applyRuntimePalette(POCKET_PALETTE_ID);
    setWormholeMusic(this);
    playSfx(this, 'pickup');
    playSfx(this, 'bomb');
    Overlays.bombFlash(this);
    Overlays.screenShake(this, 0.012, 260);
  }

  private exitWormholePocket(reason: 'gate' | 'timeout'): void {
    if (!this.pocketActive) {
      return;
    }

    const targetPhase = this.pickPostPocketPhase();
    this.pocketActive = false;
    this.pocketTimerMs = 0;
    this.pocketRareSalvageTimer = 0;
    this.pocketBonusTimer = 0;
    this.pocketBoundaryBurnMs = 0;
    this.pocketBoundaryGraphic?.setVisible(false);
    this.lastGateActive = false;
    this.extractionSystem.exitPocketMode();
    this.difficultySystem.setPocketActive(false);
    this.salvageSystem.setPocketYieldMult(1);
    this.clearBoard(true, false);
    this.extractionSystem.debugSetPhase(targetPhase);
    this.difficultySystem.debugSetPhase(targetPhase);
    this.missionSystem.trackPhaseReached(targetPhase);
    this.regentIntroduced = targetPhase >= 3;
    this.regentEnemyAnnounced = targetPhase >= 5;
    this.regentBeamAnnounced = targetPhase >= 7;
    this.regentLastPhase = targetPhase;
    this.enemyEntranceSfxPlayed = targetPhase >= 5;
    setGameplayMusicForPhase(this, targetPhase);
    this.geoSphere.setVisible(true);
    this.applyRuntimePalette(this.restorePaletteId);
    this.destroyAllWormholes();
    if (reason === 'gate') {
      this.playGateTravelSfx();
      Overlays.screenShake(this, 0.01, 200);
    }
  }

  private playGateTravelSfx(): void {
    playSfx(this, 'bomb', { volumeScale: 0.75 });
  }

  private pickPostPocketPhase(): number {
    const fromPhase = Phaser.Math.Clamp(Math.floor(this.pocketEntryPhase), 1, 9);
    const minPhase = Math.min(10, fromPhase + 1);
    return Phaser.Math.Between(minPhase, 10);
  }

  private clearPocketThreats(): void {
    const beams = this.difficultySystem.getBeams();
    for (const beam of beams) {
      beam.destroy();
    }
    beams.length = 0;

    const enemies = this.difficultySystem.getEnemies();
    for (const enemy of enemies) {
      this.playerDebris.push(new ShipDebris(this, enemy.x, enemy.y, enemy.getVelocityX(), enemy.getVelocityY(), COLORS.ENEMY, enemy.radius));
      enemy.destroy();
    }
    enemies.length = 0;

    const npcs = this.difficultySystem.getNPCs();
    for (const npc of npcs) {
      this.playerDebris.push(new ShipDebris(this, npc.x, npc.y, npc.vx, npc.vy, npc.getHullColor(), npc.radius));
      npc.destroy();
    }
    npcs.length = 0;

    const boss = this.difficultySystem.getBoss();
    if (boss) {
      const center = boss.getCenter();
      this.playerDebris.push(new ShipDebris(this, center.x, center.y, 0, 0, COLORS.ENEMY, 34));
      this.difficultySystem.clearBoss();
    }
  }

  private isPlayerInsideGate(gate: ExitGate): boolean {
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, gate.x, gate.y);
    return dist < PLAYER_RADIUS + EXIT_GATE_HITBOX;
  }

  private applyRuntimePalette(paletteId: RuntimePaletteId): void {
    this.activePaletteId = paletteId;
    applyColorPalette(paletteId);
    for (const star of this.starfieldStars) {
      if (star.color !== 0xffffff) {
        star.color = COLORS.PLAYER;
      }
    }
    this.drawStarfield();
    this.redrawArenaBorder();
    this.hud.refreshPalette();
    if (this.countdownText) {
      this.countdownText.setColor(`#${COLORS.HUD.toString(16).padStart(6, '0')}`);
      this.countdownText.setStroke(`#${COLORS.GRID.toString(16).padStart(6, '0')}`, 2);
    }
    if (this.state === GameState.PAUSED) {
      this.showPauseMenu();
    }
    this.refreshPauseUi();
    this.updateBossStatusUi();
  }

  private installDebugPhaseShortcuts(): void {
    const keyboard = this.input.keyboard;
    if (keyboard) {
      keyboard.on('keydown', (event: KeyboardEvent) => {
        if (!event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
        const code = event.code;
        let phase = 0;
        if (code.startsWith('Digit')) phase = Number(code.slice(5));
        else if (code.startsWith('Numpad')) phase = Number(code.slice(6));
        else {
          switch (code) {
            case 'KeyW':
              event.preventDefault();
              this.spawnDebugWormhole();
              return;
            case 'KeyS':
              event.preventDefault();
              this.spawnDebugShield();
              return;
            case 'KeyB':
              event.preventDefault();
              this.spawnDebugBomb();
              return;
            case 'KeyC':
              event.preventDefault();
              this.spawnDebugBonus();
              return;
            case 'KeyI':
              event.preventDefault();
              this.toggleDebugInvulnerable();
              return;
            default:
              return;
          }
        }
        if (!Number.isFinite(phase)) return;
        const target = phase === 0 ? 10 : phase;
        if (target < 1 || target > 10) return;
        event.preventDefault();
        this.debugJumpToPhase(target);
      });
    }
    if (typeof window !== 'undefined') {
      const debugWindow = window as unknown as {
        bitpJumpToPhase?: (n: number) => void;
        bitpSpawnWormhole?: () => void;
        bitpSpawnShield?: () => void;
        bitpSpawnBomb?: () => void;
        bitpSpawnBonus?: () => void;
        bitpToggleInvulnerable?: () => void;
      };
      debugWindow.bitpJumpToPhase = (n: number) => this.debugJumpToPhase(n);
      debugWindow.bitpSpawnWormhole = () => this.spawnDebugWormhole();
      debugWindow.bitpSpawnShield = () => this.spawnDebugShield();
      debugWindow.bitpSpawnBomb = () => this.spawnDebugBomb();
      debugWindow.bitpSpawnBonus = () => this.spawnDebugBonus();
      debugWindow.bitpToggleInvulnerable = () => this.toggleDebugInvulnerable();
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (typeof window !== 'undefined') {
        const debugWindow = window as unknown as {
          bitpJumpToPhase?: (n: number) => void;
          bitpSpawnWormhole?: () => void;
          bitpSpawnShield?: () => void;
          bitpSpawnBomb?: () => void;
          bitpSpawnBonus?: () => void;
          bitpToggleInvulnerable?: () => void;
        };
        delete debugWindow.bitpJumpToPhase;
        delete debugWindow.bitpSpawnWormhole;
        delete debugWindow.bitpSpawnShield;
        delete debugWindow.bitpSpawnBomb;
        delete debugWindow.bitpSpawnBonus;
        delete debugWindow.bitpToggleInvulnerable;
      }
    });
  }

  /**
   * Hidden dev shortcut: jump the live run to a specific phase. No UI surface —
   * triggered via Shift+1..9 / Shift+0 (phase 10) and `window.bitpJumpToPhase(n)`
   * in the devtools console. Sets `scoreRecordingBlocked` so jumped runs do not
   * pollute the leaderboard.
   */
  private applyPhaseState(phase: number, blockScoreRecording: boolean): void {
    const targetPhase = Phaser.Math.Clamp(Math.floor(phase), 1, 10);
    this.exitWormholePocket('timeout');
    this.destroyAllWormholes();
    this.extractionSystem.debugSetPhase(targetPhase);
    this.difficultySystem.debugSetPhase(targetPhase);
    this.lastGateActive = false;
    this.wormholeEventTimer = 0;
    this.wormholeEventPhase = targetPhase;
    this.regentIntroduced = targetPhase >= 3;
    this.regentEnemyAnnounced = targetPhase >= 5;
    this.regentBeamAnnounced = targetPhase >= 7;
    this.regentLastPhase = targetPhase;
    this.enemyEntranceSfxPlayed = targetPhase >= 5;
    if (blockScoreRecording) {
      this.scoreRecordingBlocked = true;
    }
    this.invulnerableTimer = Math.max(this.invulnerableTimer, 1200);
    setGameplayMusicForPhase(this, targetPhase);
  }

  private debugJumpToPhase(phase: number): void {
    if (this.state !== GameState.PLAYING && this.state !== GameState.PAUSED && this.state !== GameState.COUNTDOWN) return;
    const targetPhase = Phaser.Math.Clamp(Math.floor(phase), 1, 10);

    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.hidePauseMenu();
    this.inputSystem.clear();
    this.countdownTimer = 0;
    if (this.countdownText) {
      this.countdownText.destroy();
      this.countdownText = null;
    }
    if (this.entryGate) {
      this.entryGate.destroy();
      this.entryGate = null;
    }

    this.clearBoard(true, false);
    this.spawnPendingDifficultyDrops();
    this.applyPhaseState(targetPhase, true);
    this.state = GameState.PLAYING;
    this.pausedFromState = GameState.PLAYING;
    this.spawnDebris();
    Overlays.bombFlash(this);
    this.refreshPauseUi();
    this.updateBossStatusUi();
  }

  private togglePause(): void {
    if (this.state === GameState.PAUSED) {
      this.resumeGame();
      return;
    }

    if (this.state !== GameState.COUNTDOWN && this.state !== GameState.PLAYING) {
      return;
    }

    this.pauseGame();
  }

  private pauseGame(): void {
    this.pausedFromState = this.state;
    this.inputSystem.clear();
    this.state = GameState.PAUSED;
    this.time.timeScale = GameScene.PAUSE_SLOW_SCALE;
    this.tweens.timeScale = GameScene.PAUSE_SLOW_SCALE;
    setPauseMusic(this);
    this.showPauseMenu();
    this.refreshPauseUi();
  }

  private resumeGame(): void {
    if (this.state !== GameState.PAUSED) return;

    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.hidePauseMenu();
    this.inputSystem.clear();
    this.state = this.pausedFromState;
    if (this.pocketActive) {
      setWormholeMusic(this);
    } else {
      setGameplayMusicForPhase(this, this.extractionSystem.getPhaseCount());
    }
    this.refreshPauseUi();
  }

  private showPauseMenu(): void {
    this.hidePauseMenu();
    const layout = getLayout();
    const centerX = layout.centerX;
    const narrowPause = isNarrowViewport(layout);
    const shortPause = isShortViewport(layout);
    const densePause = narrowPause || shortPause;
    const compactHud = layout.gameWidth <= 430;
    const topMargin = compactHud ? 12 : 16;
    const pauseButtonHeight = compactHud ? 30 : 34;
    const panelBottomMargin = densePause ? 12 : 16;
    const panelSideInset = densePause ? 20 : 28;
    const panelWidth = layout.gameWidth - panelSideInset * 2;
    const panelGap = densePause ? 8 : compactHud ? 10 : 12;
    const hudBottom = this.hud.getTopHudBottom();
    const pauseButtonBottom = topMargin + pauseButtonHeight;
    const panelTop = Math.max(hudBottom, pauseButtonBottom) + panelGap;
    const panelHeight = layout.gameHeight - panelTop - panelBottomMargin;

    const blocker = this.add.zone(0, 0, layout.gameWidth, layout.gameHeight)
      .setOrigin(0, 0)
      .setDepth(218)
      .setInteractive({ useHandCursor: false });
    blocker.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
      },
    );
    this.pauseUi.push(blocker);

    const dim = this.add.graphics().setDepth(217);
    dim.fillStyle(COLORS.BG, 0.78);
    dim.fillRect(0, 0, layout.gameWidth, layout.gameHeight);
    this.pauseUi.push(dim);

    const panel = this.add.graphics().setDepth(220);
    panel.fillStyle(COLORS.BG, 0.92);
    panel.fillRoundedRect(panelSideInset, panelTop, panelWidth, panelHeight, 16);
    panel.lineStyle(1.5, COLORS.GATE, 0.45);
    panel.strokeRoundedRect(panelSideInset, panelTop, panelWidth, panelHeight, 16);
    this.pauseUi.push(panel);

    const titleY = panelTop + (densePause ? 24 : 30);
    const abandonY = titleY + (densePause ? 34 : 44);
    const abandonHintY = abandonY + (densePause ? 18 : 24);
    const settingsY = abandonHintY + (densePause ? 28 : 38);

    const title = this.add.text(centerX, titleY, 'PAUSED', {
      fontFamily: TITLE_FONT,
      fontSize: readableFontSize(densePause ? 30 : 34),
      color: `#${COLORS.GATE.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(221);
    this.pauseUi.push(title);

    const abandonText = this.add.text(centerX, abandonY, 'ABANDON RUN', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(densePause ? 16 : 18),
      color: `#${COLORS.HAZARD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setInteractive({ useHandCursor: true });
    abandonText.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        playUiSelectSfx(this);
        this.abandonRun();
      },
    );
    this.pauseUi.push(abandonText);

    const abandonHint = this.add.text(centerX, abandonHintY, densePause ? 'RETURN TO MENU // NO BANKING' : 'RETURN TO MENU WITHOUT BANKING', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(densePause ? 9 : 10),
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setAlpha(0.65);
    this.pauseUi.push(abandonHint);

    // Settings section
    const divider = this.add.graphics().setDepth(221);
    divider.lineStyle(1, COLORS.HUD, 0.2);
    divider.lineBetween(centerX - (densePause ? 88 : 100), settingsY - 16, centerX + (densePause ? 88 : 100), settingsY - 16);
    this.pauseUi.push(divider);

    const settingsTitle = this.add.text(centerX, settingsY, 'SETTINGS', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(densePause ? 14 : 16),
      color: `#${COLORS.HUD.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setAlpha(0.7);
    this.pauseUi.push(settingsTitle);

    const settings = getSettings();
    const hudColor = `#${COLORS.HUD.toString(16).padStart(6, '0')}`;
    const gateColor = `#${COLORS.GATE.toString(16).padStart(6, '0')}`;
    const buttonColor = `#${COLORS.HUD.toString(16).padStart(6, '0')}`;
    const settingRowGap = densePause ? 22 : 26;
    const shakeY = settingsY + (densePause ? 24 : 30);
    const scanY = shakeY + settingRowGap;
    const musicY = scanY + settingRowGap;
    const musicVolumeLabelY = musicY + (densePause ? 24 : 32);
    const musicVolumeY = musicVolumeLabelY + (densePause ? 12 : 14);
    const fxVolumeLabelY = musicVolumeY + (densePause ? 14 : 18);
    const fxVolumeY = fxVolumeLabelY + (densePause ? 12 : 14);

    // Screen shake toggle
    const shakeLabel = densePause ? 'SHAKE' : 'SCREEN SHAKE';
    const shakeText = this.add.text(centerX, shakeY, `${shakeLabel}: ${settings.screenShake ? 'ON' : 'OFF'}`, {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(densePause ? 13 : 14),
        color: settings.screenShake ? buttonColor : hudColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setInteractive({ useHandCursor: true });
    shakeText.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        playUiSelectSfx(this);
        const s = getSettings();
        updateSettings({ screenShake: !s.screenShake });
        const updated = getSettings();
        shakeText.setText(`${shakeLabel}: ${updated.screenShake ? 'ON' : 'OFF'}`);
        shakeText.setColor(updated.screenShake ? buttonColor : hudColor);
      },
    );
    this.pauseUi.push(shakeText);

    // Scanlines toggle
    const scanLabel = densePause ? 'SCAN' : 'SCANLINES';
    const scanText = this.add.text(centerX, scanY, `${scanLabel}: ${settings.scanlines ? 'ON' : 'OFF'}`, {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(densePause ? 13 : 14),
        color: settings.scanlines ? buttonColor : hudColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setInteractive({ useHandCursor: true });
    scanText.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        playUiSelectSfx(this);
        const s = getSettings();
        updateSettings({ scanlines: !s.scanlines });
        const updated = getSettings();
        scanText.setText(`${scanLabel}: ${updated.scanlines ? 'ON' : 'OFF'}`);
        scanText.setColor(updated.scanlines ? buttonColor : hudColor);
        this.hologramOverlay.setEnabled(updated.scanlines);
      },
    );
    this.pauseUi.push(scanText);

    const musicText = this.add.text(centerX, musicY, `MUSIC: ${settings.musicEnabled ? 'ON' : 'OFF'}`, {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(densePause ? 13 : 14),
        color: settings.musicEnabled ? buttonColor : hudColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setInteractive({ useHandCursor: true });
    musicText.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        playUiSelectSfx(this);
        const s = getSettings();
        updateSettings({ musicEnabled: !s.musicEnabled });
        const updated = getSettings();
        musicText.setText(`MUSIC: ${updated.musicEnabled ? 'ON' : 'OFF'}`);
        musicText.setColor(updated.musicEnabled ? buttonColor : hudColor);
        refreshMusicForSettings(this);
      },
    );
    this.pauseUi.push(musicText);

    const musicVolumeLabel = this.add.text(centerX, musicVolumeLabelY, 'MUSIC VOL', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(densePause ? 9 : 10),
      color: hudColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setAlpha(0.72);
    this.pauseUi.push(musicVolumeLabel);

    const sliderWidth = densePause ? 96 : 112;
    const musicVolumeSlider = new SettingsSlider({
      scene: this,
      left: centerX - sliderWidth / 2,
      y: musicVolumeY,
      width: sliderWidth,
      depth: 221,
      accentColor: COLORS.GATE,
      initialValue: settings.musicVolume,
      onChange: (value) => {
        updateSettings({ musicVolume: value });
        refreshMusicForSettings(this);
      },
    });
    this.pauseUi.push(...musicVolumeSlider.getObjects());

    const fxVolumeLabel = this.add.text(centerX, fxVolumeLabelY, 'FX VOL', {
      fontFamily: UI_FONT,
      fontSize: readableFontSize(densePause ? 9 : 10),
      color: hudColor,
      align: 'center',
    }).setOrigin(0.5).setDepth(221).setAlpha(0.72);
    this.pauseUi.push(fxVolumeLabel);

    const fxVolumeSlider = new SettingsSlider({
      scene: this,
      left: centerX - sliderWidth / 2,
      y: fxVolumeY,
      width: sliderWidth,
      depth: 221,
      accentColor: COLORS.SALVAGE,
      initialValue: settings.fxVolume,
      onChange: (value) => {
        updateSettings({ fxVolume: value });
      },
    });
    this.pauseUi.push(...fxVolumeSlider.getObjects());

    const activeMissions = this.missionSystem.getActiveMissions();
    if (activeMissions.length > 0) {
      const missionDividerY = fxVolumeY + (densePause ? 16 : 22);
      const mDivider = this.add.graphics().setDepth(221);
      mDivider.lineStyle(1, COLORS.HUD, 0.2);
      mDivider.lineBetween(centerX - (densePause ? 88 : 100), missionDividerY, centerX + (densePause ? 88 : 100), missionDividerY);
      this.pauseUi.push(mDivider);

      const mTitle = this.add.text(centerX, missionDividerY + 16, 'MISSIONS', {
        fontFamily: UI_FONT,
        fontSize: readableFontSize(densePause ? 14 : 16),
        color: hudColor,
        align: 'center',
      }).setOrigin(0.5).setDepth(221).setAlpha(0.7);
      this.pauseUi.push(mTitle);

      const missionCardLeft = panelSideInset + 12;
      const missionCardWidth = panelWidth - 24;
      const missionCardHeight = densePause ? 28 : 36;
      const missionRowGap = densePause ? 32 : 42;
      for (let i = 0; i < activeMissions.length; i++) {
        const m = activeMissions[i];
        const my = missionDividerY + (densePause ? 34 : 40) + i * missionRowGap;
        const prog = Math.min(Math.floor(m.progress), m.def.target);
        const done = m.completed;

        // Card background
        const cardBg = this.add.graphics().setDepth(220);
        cardBg.fillStyle(COLORS.BG, 0.6);
        cardBg.fillRoundedRect(missionCardLeft, my - 4, missionCardWidth, missionCardHeight, 6);
        cardBg.lineStyle(1, done ? COLORS.GATE : COLORS.HUD, done ? 0.5 : 0.15);
        cardBg.strokeRoundedRect(missionCardLeft, my - 4, missionCardWidth, missionCardHeight, 6);
        this.pauseUi.push(cardBg);

        const label = this.add.text(missionCardLeft + 10, my + 2, m.def.label, {
          fontFamily: UI_FONT,
          fontSize: readableFontSize(densePause ? 10 : 11),
          color: done ? gateColor : hudColor,
          wordWrap: { width: missionCardWidth - (densePause ? 88 : 110), useAdvancedWrap: true },
        }).setDepth(221).setAlpha(done ? 0.9 : 0.7);
        this.pauseUi.push(label);

        const status = done
          ? `\u2713 DONE  +${m.def.reward}`
          : `${prog}/${m.def.target}`;
        const statusText = this.add.text(missionCardLeft + missionCardWidth - 10, my + 2, status, {
          fontFamily: UI_FONT,
          fontSize: readableFontSize(densePause ? 10 : 11),
          color: done ? gateColor : hudColor,
          align: 'right',
        }).setOrigin(1, 0).setDepth(221).setAlpha(done ? 0.9 : 0.7);
        this.pauseUi.push(statusText);

        if (!densePause) {
          const rewardHint = this.add.text(missionCardLeft + 10, my + 17, `REWARD: +${m.def.reward}`, {
            fontFamily: UI_FONT,
            fontSize: readableFontSize(9),
            color: `#${COLORS.SALVAGE.toString(16).padStart(6, '0')}`,
          }).setDepth(221).setAlpha(0.5);
          this.pauseUi.push(rewardHint);
        }
      }
    }
  }

  private hidePauseMenu(): void {
    for (const obj of this.pauseUi) {
      obj.destroy();
    }
    this.pauseUi = [];
  }

  private abandonRun(): void {
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.hidePauseMenu();
    this.inputSystem.clear();
    this.scene.start(SCENE_KEYS.MENU);
  }

  private refreshPauseUi(): void {
    const layout = getLayout();
    const compactHud = layout.gameWidth <= 430;
    const topMargin = compactHud ? 12 : 16;
    const buttonWidth = compactHud ? 58 : 64;
    const buttonHeight = compactHud ? 30 : 34;
    const buttonX = layout.centerX;
    const buttonY = topMargin + buttonHeight / 2;
    const buttonVisible = (
      this.state === GameState.COUNTDOWN ||
      this.state === GameState.PLAYING ||
      this.state === GameState.PAUSED
    );
    const paused = this.state === GameState.PAUSED;
    const fillColor = paused ? COLORS.HUD : COLORS.BG;
    const lineColor = COLORS.HUD;
    const textColor = paused ? `#${COLORS.BG.toString(16).padStart(6, '0')}` : `#${COLORS.HUD.toString(16).padStart(6, '0')}`;

    this.pauseButtonBg.clear();
    if (buttonVisible) {
      this.pauseButtonBg.fillStyle(fillColor, paused ? 0.88 : 0.82);
      this.pauseButtonBg.lineStyle(1.25, lineColor, paused ? 0.95 : 0.5);
      this.pauseButtonBg.fillRoundedRect(
        buttonX - buttonWidth / 2,
        buttonY - buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        8,
      );
      this.pauseButtonBg.strokeRoundedRect(
        buttonX - buttonWidth / 2,
        buttonY - buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        8,
      );
    }

    this.pauseButtonBg.setVisible(buttonVisible);
    this.pauseButtonText
      .setVisible(buttonVisible)
      .setPosition(buttonX, buttonY)
      .setText(paused ? '\u25B6' : '||')
      .setColor(textColor);
    this.pauseButtonHit
      .setVisible(buttonVisible)
      .setPosition(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2)
      .setSize(buttonWidth, buttonHeight);

    if (this.pauseButtonHit.input) {
      this.pauseButtonHit.input.enabled = buttonVisible;
    }
  }

}
