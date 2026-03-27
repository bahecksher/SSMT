import { supabase } from './supabase';

export interface LeaderboardEntry {
  player_name: string;
  score: number;
  created_at: string;
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
  const { data, error } = await supabase
    .from('scores')
    .select('player_name, score, created_at')
    .gte('created_at', cutoff)
    .order('score', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('Leaderboard fetch failed:', error.message);
    return [];
  }
  return data as LeaderboardEntry[];
}

export async function submitScore(playerName: string, score: number): Promise<void> {
  const { error } = await supabase
    .from('scores')
    .insert({ player_name: playerName, score: Math.floor(score) });

  if (error) {
    console.warn('Score submit failed:', error.message);
  }
}
