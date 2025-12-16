import { supabase } from '@/integrations/supabase/client';

const K_FACTOR = 32; // Standard K-factor for Elo calculations

export function calculateEloChange(
  winnerRating: number,
  loserRating: number
): { winnerNew: number; loserNew: number } {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

  const winnerNew = Math.round(winnerRating + K_FACTOR * (1 - expectedWinner));
  const loserNew = Math.round(loserRating + K_FACTOR * (0 - expectedLoser));

  return { winnerNew, loserNew };
}

export async function recordBattle(
  winnerId: string,
  loserId: string,
  winnerEloBefore: number,
  loserEloBefore: number,
  goal: string,
  boardName: string
): Promise<{ winnerEloAfter: number; loserEloAfter: number } | null> {
  const { winnerNew, loserNew } = calculateEloChange(winnerEloBefore, loserEloBefore);

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Update winner's Elo rating
  const { error: winnerError } = await supabase
    .from('experiments')
    .update({ elo_rating: winnerNew })
    .eq('id', winnerId);

  if (winnerError) {
    console.error('Error updating winner Elo:', winnerError);
    return null;
  }

  // Update loser's Elo rating
  const { error: loserError } = await supabase
    .from('experiments')
    .update({ elo_rating: loserNew })
    .eq('id', loserId);

  if (loserError) {
    console.error('Error updating loser Elo:', loserError);
    return null;
  }

  // Record battle history
  const { error: historyError } = await supabase
    .from('battle_history')
    .insert({
      winner_id: winnerId,
      loser_id: loserId,
      winner_elo_before: winnerEloBefore,
      winner_elo_after: winnerNew,
      loser_elo_before: loserEloBefore,
      loser_elo_after: loserNew,
      goal,
      board_name: boardName,
      user_id: user?.id || null,
    });

  if (historyError) {
    console.error('Error recording battle history:', historyError);
  }

  return { winnerEloAfter: winnerNew, loserEloAfter: loserNew };
}
