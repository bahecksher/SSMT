import { COMPANY_IDS } from '../data/companyData';
import { CompanyId, isCompanyId } from '../types';
import { supabase } from './supabase';

export interface LeaderboardEntry {
  player_name: string;
  score: number;
  created_at: string;
  company_id?: CompanyId | null;
}

export interface CorporationLeaderboardEntry {
  companyId: CompanyId;
  totalScore: number;
  runCount: number;
  bestScore: number;
}

type Period = 'daily' | 'weekly';

function getCutoffDate(period: Period): string {
  const now = new Date();
  if (period === 'daily') {
    now.setHours(now.getHours() - 24);
  } else {
    now.setDate(now.getDate() - 7);
  }
  return now.toISOString();
}

export async function fetchLeaderboard(period: Period, limit = 10): Promise<LeaderboardEntry[]> {
  const cutoff = getCutoffDate(period);
  const initialResult = await supabase
    .from('scores')
    .select('player_name, score, created_at, company_id')
    .gte('created_at', cutoff)
    .order('score', { ascending: false })
    .limit(limit);
  let data = initialResult.data as LeaderboardEntry[] | null;
  let error = initialResult.error;

  if (error && isMissingCompanyColumnError(error.message)) {
    const fallbackResult = await supabase
      .from('scores')
      .select('player_name, score, created_at')
      .gte('created_at', cutoff)
      .order('score', { ascending: false })
      .limit(limit);
    data = fallbackResult.data as LeaderboardEntry[] | null;
    error = fallbackResult.error;
  }

  if (error) {
    console.warn('Leaderboard fetch failed:', error.message);
    return [];
  }
  return data as LeaderboardEntry[];
}

export async function fetchCorporationLeaderboard(period: Period): Promise<CorporationLeaderboardEntry[]> {
  const cutoff = getCutoffDate(period);
  const rows: LeaderboardEntry[] = [];
  const pageSize = 1000;

  for (let page = 0; page < 10; page++) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const result = await supabase
      .from('scores')
      .select('company_id, score, created_at')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (result.error) {
      if (!isMissingCompanyColumnError(result.error.message)) {
        console.warn('Corporation leaderboard fetch failed:', result.error.message);
      }
      return [];
    }

    const pageRows = result.data as LeaderboardEntry[] | null ?? [];
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

export async function submitScore(playerName: string, score: number, companyId: CompanyId | null): Promise<void> {
  let { error } = await supabase
    .from('scores')
    .insert({ player_name: playerName, score: Math.floor(score), company_id: companyId });

  if (error && isMissingCompanyColumnError(error.message)) {
    ({ error } = await supabase
      .from('scores')
      .insert({ player_name: playerName, score: Math.floor(score) }));
  }

  if (error) {
    console.warn('Score submit failed:', error.message);
  }
}

export async function submitLoss(playerName: string, lostScore: number, companyId: CompanyId | null): Promise<void> {
  if (lostScore <= 0) return;
  let { error } = await supabase
    .from('losses')
    .insert({ player_name: playerName, score: Math.floor(lostScore), company_id: companyId });

  if (error && isMissingCompanyColumnError(error.message)) {
    ({ error } = await supabase
      .from('losses')
      .insert({ player_name: playerName, score: Math.floor(lostScore) }));
  }

  if (error) {
    console.warn('Loss submit failed:', error.message);
  }
}

export async function fetchBiggestLoss(period: Period): Promise<LeaderboardEntry | null> {
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
