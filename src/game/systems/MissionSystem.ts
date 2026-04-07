import { MISSIONS_KEY } from '../constants';
import { MissionType, isMissionType } from '../types';
import type { ActiveMission, MissionSaveData } from '../types';
import { generateMission } from '../data/missionCatalog';
import { REP_PER_TIER, loadCompanyRep, saveCompanyRep } from '../data/companyData';

export class MissionSystem {
  private missions: ActiveMission[];
  private newCompletions: ActiveMission[] = [];
  private miningAccum = 0;
  private salvageAccum = 0;
  private cleanPhasesAccum = 0;
  private tookDamageThisPhase = false;
  private maxPhaseReached = 1;

  constructor(missions: ActiveMission[]) {
    // Reset per-run progress, keep card definitions
    this.missions = missions.map((m) => ({
      ...m,
      progress: 0,
      completed: false,
    }));
  }

  // --- Tracking methods (called from GameScene) ---

  trackAsteroidsBroken(count = 1): void {
    for (const m of this.missions) {
      if (!m.accepted || m.completed) continue;
      if (m.def.type === MissionType.BREAK_ASTEROIDS) {
        m.progress += count;
        this.checkComplete(m);
      }
    }
  }

  trackCreditsExtracted(banked: number): void {
    for (const m of this.missions) {
      if (!m.accepted || m.completed) continue;
      if (m.def.type === MissionType.EXTRACT_CREDITS) {
        m.progress = banked;
        this.checkComplete(m);
      }
    }
  }

  trackNpcKill(): void {
    for (const m of this.missions) {
      if (!m.accepted || m.completed) continue;
      if (m.def.type === MissionType.DESTROY_NPCS) {
        m.progress++;
        this.checkComplete(m);
      }
    }
  }

  trackEnemyKill(): void {
    for (const m of this.missions) {
      if (!m.accepted || m.completed) continue;
      if (m.def.type === MissionType.DESTROY_ENEMIES) {
        m.progress++;
        this.checkComplete(m);
      }
    }
  }

  trackMiningIncome(amount: number): void {
    this.miningAccum += amount;
    for (const m of this.missions) {
      if (!m.accepted || m.completed) continue;
      if (m.def.type === MissionType.MINING_CREDITS) {
        m.progress = this.miningAccum;
        this.checkComplete(m);
      }
    }
  }

  trackSalvageIncome(amount: number): void {
    this.salvageAccum += amount;
    for (const m of this.missions) {
      if (!m.accepted || m.completed) continue;
      if (m.def.type === MissionType.SALVAGE_CREDITS) {
        m.progress = this.salvageAccum;
        this.checkComplete(m);
      }
    }
  }

  trackPhaseReached(phase: number): void {
    // Check clean phase before advancing
    if (!this.tookDamageThisPhase && phase > 1) {
      this.cleanPhasesAccum++;
      for (const m of this.missions) {
        if (!m.accepted || m.completed) continue;
        if (m.def.type === MissionType.NO_DAMAGE_PHASE) {
          m.progress = this.cleanPhasesAccum;
          this.checkComplete(m);
        }
      }
    }
    this.tookDamageThisPhase = false;
    this.maxPhaseReached = phase;
  }

  trackDamageTaken(): void {
    this.tookDamageThisPhase = true;
  }

  trackShieldCollected(): void {
    for (const m of this.missions) {
      if (!m.accepted || m.completed) continue;
      if (m.def.type === MissionType.COLLECT_SHIELDS) {
        m.progress++;
        this.checkComplete(m);
      }
    }
  }

  /** Call on extraction to check survive missions. */
  checkExtraction(): void {
    for (const m of this.missions) {
      if (!m.accepted || m.completed) continue;
      if (m.def.type === MissionType.SURVIVE_EXTRACT) {
        m.progress = this.maxPhaseReached;
        this.checkComplete(m);
      }
    }
  }

  // --- Completion ---

  private checkComplete(m: ActiveMission): void {
    if (m.completed) return;
    if (m.progress >= m.def.target) {
      m.completed = true;
      this.newCompletions.push(m);
    }
  }

  /** Drain the list of missions that completed since last call. */
  consumeNewCompletions(): ActiveMission[] {
    const list = this.newCompletions;
    this.newCompletions = [];
    return list;
  }

  /** Total bonus credits from completed accepted missions. */
  getCompletedReward(): number {
    let total = 0;
    for (const m of this.missions) {
      if (m.accepted && m.completed) {
        total += m.def.reward;
      }
    }
    return total;
  }

  getActiveMissions(): ActiveMission[] {
    return this.missions.filter((m) => m.accepted);
  }

  getAllMissions(): ActiveMission[] {
    return this.missions;
  }

  // --- Persistence ---

  /** Save current mission cards (progress will be reset on next run). */
  save(): void {
    const saved = loadMissionSave();
    saveMissionSelection(this.missions, saved.rerollsRemaining ?? MAX_REROLLS);
  }

  /** Remove completed missions from persistence and bump lifetime count. */
  claimAndClear(): void {
    const saved = loadMissionSave();
    const completed = this.missions.filter((m) => m.accepted && m.completed);
    saved.completedLifetime += completed.length;

    // Replenish 1 discard per successful extraction (capped at MAX_REROLLS)
    saved.rerollsRemaining = Math.min(MAX_REROLLS, (saved.rerollsRemaining ?? 0) + 1);

    // Award rep for completed missions
    if (completed.length > 0) {
      const repSave = loadCompanyRep();
      for (const m of completed) {
        const company = m.def.company;
        const repGain = REP_PER_TIER[m.def.tier];
        repSave.rep[company] = (repSave.rep[company] ?? 0) + repGain;
      }
      saveCompanyRep(repSave);
    }

    // Remove completed missions, keep incomplete ones
    saved.activeMissions = this.missions.filter(
      (m) => !(m.accepted && m.completed),
    );
    writeMissionSave(saved);
  }

  destroy(): void {
    // No cleanup needed
  }
}

// --- localStorage helpers ---

export function loadMissionSave(): MissionSaveData {
  try {
    const raw = localStorage.getItem(MISSIONS_KEY);
    if (raw) return JSON.parse(raw) as MissionSaveData;
  } catch {
    // corrupted or private browsing
  }
  return { activeMissions: [], completedLifetime: 0, rerollsRemaining: MAX_REROLLS };
}

/** Max discards a player can hold. Replenished by 1 on each successful extraction. */
export const MAX_REROLLS = 3;

export function saveMissionSelection(activeMissions: ActiveMission[], rerollsRemaining: number): void {
  const saved = loadMissionSave();
  saved.activeMissions = activeMissions;
  saved.rerollsRemaining = rerollsRemaining;
  writeMissionSave(saved);
}

function writeMissionSave(data: MissionSaveData): void {
  try {
    localStorage.setItem(MISSIONS_KEY, JSON.stringify(data));
  } catch {
    // private browsing
  }
}

/**
 * Load persisted missions and fill empty slots with new random ones.
 * Returns exactly 3 missions.
 */
export function loadOrGenerateMissions(): ActiveMission[] {
  const saved = loadMissionSave();
  // Filter out stale missions from old format (missing company field)
  const missions = saved.activeMissions.filter((m) => m.def?.company && isMissionType(m.def?.type));

  // Reset progress for persisted missions (fresh run)
  for (const m of missions) {
    m.progress = 0;
    m.completed = false;
  }

  // Fill up to 3
  const existingIds = new Set(missions.map((m) => m.id));
  while (missions.length < 3) {
    const newMission = generateMission(existingIds);
    existingIds.add(newMission.id);
    missions.push(newMission);
  }

  // Persist the full set
  saved.activeMissions = missions;
  writeMissionSave(saved);

  return missions;
}
