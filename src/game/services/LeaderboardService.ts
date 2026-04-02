import { CompanyId } from '../types';
import { supabase } from './supabase';

export interface LeaderboardEntry {
  player_name: string;
  score: number;
  created_at: string;
  company_id?: CompanyId | null;
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

function isMissingCompanyColumnError(message: string): boolean {
  return /company_id/i.test(message);
}
