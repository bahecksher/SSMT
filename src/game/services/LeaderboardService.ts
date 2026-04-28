import { COMPANY_IDS } from '../data/companyData';
import { CompanyId, isCompanyId, RunMode } from '../types';
import { supabase } from './supabase';

export type LeaderboardMode = 'QUICK' | 'CAMPAIGN';

export function runModeToLeaderboardMode(mode: RunMode): LeaderboardMode {
  return mode === RunMode.CAMPAIGN ? 'CAMPAIGN' : 'QUICK';
}

export interface LeaderboardEntry {
  player_name: string;
  score: number;
  created_at: string;
  company_id?: CompanyId | null;
  mode?: LeaderboardMode | null;
}

export interface CorporationLeaderboardEntry {
  companyId: CompanyId;
  totalScore: number;
  runCount: number;
  bestScore: number;
}

type Period = 'daily' | 'weekly';

export function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

function getCutoffDate(period: Period): string {
  const now = new Date();
  if (period === 'daily') {
    now.setHours(now.getHours() - 24);
  } else {
    now.setDate(now.getDate() - 7);
  }
  return now.toISOString();
}

function buildTimedLeaderboardQuery(
  table: 'scores' | 'losses',
  cutoff: string,
  columns: string,
  mode?: LeaderboardMode,
) {
  let query = supabase
    .from(table)
    .select(columns)
    .gte('created_at', cutoff);
  if (mode) {
    query = query.eq('mode', mode);
  }
  return query;
}

export async function fetchLeaderboard(
  period: Period,
  limit = 10,
  mode?: LeaderboardMode,
): Promise<LeaderboardEntry[]> {
  if (!isOnline()) return [];
  const cutoff = getCutoffDate(period);
  const attempts: Array<{ columns: string; mode?: LeaderboardMode }> = [
    { columns: 'player_name, score, created_at, company_id, mode', mode },
    { columns: 'player_name, score, created_at, mode', mode },
    { columns: 'player_name, score, created_at, company_id' },
    { columns: 'player_name, score, created_at' },
  ];
  let lastError: { message: string } | null = null;

  for (const attempt of attempts) {
    const result = await buildTimedLeaderboardQuery('scores', cutoff, attempt.columns, attempt.mode)
      .order('score', { ascending: false })
      .limit(limit);
    if (!result.error) {
      return (result.data as unknown as LeaderboardEntry[] | null) ?? [];
    }

    lastError = result.error;
    const canRetryWithoutMode = Boolean(attempt.mode) && isMissingModeColumnError(result.error.message);
    const canRetryWithoutCompany = attempt.columns.includes('company_id') && isMissingCompanyColumnError(result.error.message);
    if (!canRetryWithoutMode && !canRetryWithoutCompany) {
      break;
    }
  }

  if (lastError) {
    console.warn('Leaderboard fetch failed:', lastError.message);
  }
  return [];
}

async function fetchCorporationLeaderboardPage(
  cutoff: string,
  from: number,
  to: number,
  mode?: LeaderboardMode,
): Promise<LeaderboardEntry[] | null> {
  const attempts: Array<{ columns: string; mode?: LeaderboardMode }> = [
    { columns: 'company_id, score, created_at, mode', mode },
    { columns: 'company_id, score, created_at' },
  ];
  let lastError: { message: string } | null = null;

  for (const attempt of attempts) {
    const result = await buildTimedLeaderboardQuery('scores', cutoff, attempt.columns, attempt.mode)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (!result.error) {
      return (result.data as unknown as LeaderboardEntry[] | null) ?? [];
    }

    lastError = result.error;
    const canRetryWithoutMode = Boolean(attempt.mode) && isMissingModeColumnError(result.error.message);
    if (!canRetryWithoutMode && !isMissingCompanyColumnError(result.error.message)) {
      break;
    }
    if (isMissingCompanyColumnError(result.error.message)) {
      return null;
    }
  }

  if (lastError) {
    console.warn('Corporation leaderboard fetch failed:', lastError.message);
  }
  return null;
}

export async function fetchCorporationLeaderboard(
  period: Period,
  mode?: LeaderboardMode,
): Promise<CorporationLeaderboardEntry[]> {
  if (!isOnline()) return [];
  const cutoff = getCutoffDate(period);
  const rows: LeaderboardEntry[] = [];
  const pageSize = 1000;

  for (let page = 0; page < 10; page++) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const pageRows = await fetchCorporationLeaderboardPage(cutoff, from, to, mode);
    if (!pageRows) {
      return [];
    }
    rows.push(...pageRows);
    if (pageRows.length < pageSize) {
      break;
    }
  }

  const attributedRows = rows
    .filter((entry): entry is LeaderboardEntry & { company_id: CompanyId } => isCompanyId(entry.company_id));
  if (attributedRows.length === 0) {
    return [];
  }

  const aggregates = new Map<CompanyId, CorporationLeaderboardEntry>();
  for (const companyId of COMPANY_IDS) {
    aggregates.set(companyId, {
      companyId,
      totalScore: 0,
      runCount: 0,
      bestScore: 0,
    });
  }

  for (const row of attributedRows) {
    const aggregate = aggregates.get(row.company_id);
    if (!aggregate) {
      continue;
    }

    const score = Math.max(0, Math.floor(row.score));
    aggregate.totalScore += score;
    aggregate.runCount += 1;
    aggregate.bestScore = Math.max(aggregate.bestScore, score);
  }

  return Array.from(aggregates.values())
    .filter((entry) => entry.runCount > 0)
    .sort((a, b) => b.totalScore - a.totalScore || b.bestScore - a.bestScore || b.runCount - a.runCount);
}

async function insertScoreRow(
  table: 'scores' | 'losses',
  playerName: string,
  score: number,
  companyId: CompanyId | null,
  mode: LeaderboardMode,
): Promise<void> {
  const payload: Record<string, unknown> = {
    player_name: playerName,
    score: Math.floor(score),
    company_id: companyId,
    mode,
  };
  let { error } = await supabase.from(table).insert(payload);

  // Progressively strip unknown columns so legacy schemas still accept the row.
  for (let attempt = 0; attempt < 2 && error; attempt++) {
    let stripped = false;
    if (isMissingModeColumnError(error.message) && 'mode' in payload) {
      delete payload.mode;
      stripped = true;
    } else if (isMissingCompanyColumnError(error.message) && 'company_id' in payload) {
      delete payload.company_id;
      stripped = true;
    }
    if (!stripped) break;
    ({ error } = await supabase.from(table).insert(payload));
  }

  if (error) {
    console.warn(`${table} submit failed:`, error.message);
  }
}

export async function submitScore(
  playerName: string,
  score: number,
  companyId: CompanyId | null,
  mode: LeaderboardMode = 'QUICK',
): Promise<void> {
  if (!isOnline()) return;
  await insertScoreRow('scores', playerName, score, companyId, mode);
}

export async function submitLoss(
  playerName: string,
  lostScore: number,
  companyId: CompanyId | null,
  mode: LeaderboardMode = 'QUICK',
): Promise<void> {
  if (lostScore <= 0) return;
  if (!isOnline()) return;
  await insertScoreRow('losses', playerName, lostScore, companyId, mode);
}

export async function fetchBiggestLoss(period: Period): Promise<LeaderboardEntry | null> {
  if (!isOnline()) return null;
  const cutoff = getCutoffDate(period);
  const initialResult = await supabase
    .from('losses')
    .select('player_name, score, created_at, company_id')
    .gte('created_at', cutoff)
    .order('score', { ascending: false })
    .limit(1);
  let data = initialResult.data as LeaderboardEntry[] | null;
  let error = initialResult.error;

  if (error && isMissingCompanyColumnError(error.message)) {
    const fallbackResult = await supabase
      .from('losses')
      .select('player_name, score, created_at')
      .gte('created_at', cutoff)
      .order('score', { ascending: false })
      .limit(1);
    data = fallbackResult.data as LeaderboardEntry[] | null;
    error = fallbackResult.error;
  }

  if (error) {
    // Table may not exist yet — silently return null
    return null;
  }
  return data && data.length > 0 ? data[0] : null;
}

function isMissingCompanyColumnError(message: string): boolean {
  return /company_id/i.test(message);
}

function isMissingModeColumnError(message: string): boolean {
  return /\bmode\b/i.test(message);
}
