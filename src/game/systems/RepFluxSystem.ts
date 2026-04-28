import { CompanyId } from '../types';
import { COMPANY_IDS, loadCompanyRep, saveCompanyRep } from '../data/companyData';

export const REP_FLUX_TUNING = {
  /** +1 RECLAIM per N salvage credits taken in (run total). Only awarded on extract. */
  salvageCreditsPerRep: 200,
  /** +1 DEEPCORE per N mining credits taken in (run total). Only awarded on extract. */
  miningCreditsPerRep: 200,
  /** While affiliated to IRONVEIL: +1 IRONVEIL per N player-credited kills. */
  ironVeilKillsPerRep: 5,
  /** While affiliated to IRONVEIL: each kill subtracts this much rep from each rival corp. */
  ironVeilRivalRepCostPerKill: 1,
  /** Cap on total rep loss per rival corp per run from the IRONVEIL kill tax. */
  ironVeilRivalRepCostCapPerRun: 3,
  /** +1 FREEPORT on any successful extract (cap 1/run, naturally satisfied). */
  freePortExtractRep: 1,
  /** -2 FREEPORT on death (no extract this run). */
  freePortDeathRep: 2,
} as const;

export type RepDeltaMap = Record<CompanyId, number>;

export type RunOutcome = 'extract' | 'death';

export function emptyRepDeltas(): RepDeltaMap {
  return {
    [CompanyId.DEEPCORE]: 0,
    [CompanyId.RECLAIM]: 0,
    [CompanyId.IRONVEIL]: 0,
    [CompanyId.FREEPORT]: 0,
  };
}

export class RepFluxTracker {
  private playerKills = 0;
  private salvageIncome = 0;
  private miningIncome = 0;

  trackPlayerKill(): void {
    this.playerKills++;
  }

  trackSalvageIncome(amount: number): void {
    if (amount > 0) this.salvageIncome += amount;
  }

  trackMiningIncome(amount: number): void {
    if (amount > 0) this.miningIncome += amount;
  }

  computeDeltas(outcome: RunOutcome, affiliatedCompanyId: CompanyId | null): RepDeltaMap {
    const deltas = emptyRepDeltas();

    if (outcome === 'extract') {
      deltas[CompanyId.FREEPORT] += REP_FLUX_TUNING.freePortExtractRep;
      deltas[CompanyId.RECLAIM]  += Math.floor(this.salvageIncome / REP_FLUX_TUNING.salvageCreditsPerRep);
      deltas[CompanyId.DEEPCORE] += Math.floor(this.miningIncome / REP_FLUX_TUNING.miningCreditsPerRep);
    } else {
      deltas[CompanyId.FREEPORT] -= REP_FLUX_TUNING.freePortDeathRep;
    }

    if (affiliatedCompanyId === CompanyId.IRONVEIL && this.playerKills > 0) {
      deltas[CompanyId.IRONVEIL] += Math.floor(this.playerKills / REP_FLUX_TUNING.ironVeilKillsPerRep);
      const rawCost = this.playerKills * REP_FLUX_TUNING.ironVeilRivalRepCostPerKill;
      const rivalCost = Math.min(rawCost, REP_FLUX_TUNING.ironVeilRivalRepCostCapPerRun);
      deltas[CompanyId.DEEPCORE] -= rivalCost;
      deltas[CompanyId.RECLAIM]  -= rivalCost;
      deltas[CompanyId.FREEPORT] -= rivalCost;
    }

    return deltas;
  }
}

/** Apply deltas to persisted rep, clamping at zero. Returns the *actually applied* delta per corp
 *  (clamped at zero), so the UI can surface the real change rather than the requested change. */
export function applyRepDeltas(deltas: RepDeltaMap): RepDeltaMap {
  const save = loadCompanyRep();
  const applied = emptyRepDeltas();
  let touched = false;
  for (const id of COMPANY_IDS) {
    const delta = deltas[id];
    if (delta === 0) continue;
    const before = save.rep[id] ?? 0;
    const after = Math.max(0, before + delta);
    if (after !== before) {
      save.rep[id] = after;
      applied[id] = after - before;
      touched = true;
    }
  }
  if (touched) saveCompanyRep(save);
  return applied;
}

export function hasAnyRepDelta(deltas: RepDeltaMap): boolean {
  return COMPANY_IDS.some((id) => deltas[id] !== 0);
}

/** "REP +3 RECLAIM, -2 IRONVEIL" — null if all zeros. */
export function formatRepDeltasOneLine(deltas: RepDeltaMap): string | null {
  const parts: string[] = [];
  for (const id of COMPANY_IDS) {
    const delta = deltas[id];
    if (delta === 0) continue;
    const sign = delta > 0 ? '+' : '';
    parts.push(`${sign}${delta} ${id}`);
  }
  return parts.length > 0 ? `REP ${parts.join(', ')}` : null;
}
