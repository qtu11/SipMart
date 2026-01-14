import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { jsonResponse, errorResponse, unauthorizedResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

// GET: Get user's tree status
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);

    // Allow getting other users' tree if userId param exists (for viewing friends)
    // But default to current user
    const url = new URL(request.url);
    const targetUserId = url.searchParams.get('userId');
    const userId = targetUserId || authResult.userId;

    if (!userId) {
      return unauthorizedResponse();
    }

    const supabase = getSupabaseAdmin();

    // Try to find existing tree
    const { data: tree, error } = await supabase
      .from('virtual_trees')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      throw error;
    }

    if (!tree) {
      // Create new tree if not exists
      const { data: newTree, error: createError } = await supabase
        .from('virtual_trees')
        .insert({
          user_id: userId,
          level: 1,
          growth: 0,
          health: 'healthy',
        })
        .select()
        .single();

      if (createError) {
        // Table might not exist, return default tree
        return jsonResponse({
          userId,
          level: 1,
          growth: 0,
          health: 'healthy',
          totalWaterings: 0
        });
      }

      return jsonResponse(mapTreeFromDb(newTree));
    }

    return jsonResponse(mapTreeFromDb(tree));

  } catch (error) {
    logger.error('Tree GET API Error', { error });
    return errorResponse('Internal Server Error', 500);
  }
}

// POST: Water the tree
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.userId) {
      return unauthorizedResponse();
    }

    const userId = authResult.userId;
    const supabase = getSupabaseAdmin();

    // Get or create tree
    let { data: tree } = await supabase
      .from('virtual_trees')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!tree) {
      const { data: newTree, error: createError } = await supabase
        .from('virtual_trees')
        .insert({
          user_id: userId,
          level: 1,
          growth: 0,
          health: 'healthy',
        })
        .select()
        .single();

      if (createError) {
        // Return mock success if table doesn't exist
        return jsonResponse({
          tree: { userId, level: 1, growth: 10, health: 'healthy' },
          leveledUp: false
        });
      }
      tree = newTree;
    }

    // Calculation
    const growthAdd = 10; // 10% per water
    let newGrowth = (tree.growth || 0) + growthAdd;
    let newLevel = tree.level || 1;
    let leveledUp = false;

    if (newGrowth >= 100) {
      newLevel += 1;
      newGrowth = newGrowth - 100;
      leveledUp = true;
    }

    // Update tree
    const { data: updatedTree, error: updateError } = await supabase
      .from('virtual_trees')
      .update({
        growth: newGrowth,
        level: newLevel,
        health: 'healthy',
        last_watered: new Date().toISOString(),
        total_waterings: (tree.total_waterings || 0) + 1,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // If leveled up, add bonus points
    if (leveledUp) {
      // Get current user points
      const { data: userData } = await supabase
        .from('users')
        .select('green_points')
        .eq('user_id', userId)
        .single();

      if (userData) {
        await supabase
          .from('users')
          .update({ green_points: (userData.green_points || 0) + 50 })
          .eq('user_id', userId);
      }

      // Log Game Score (optional, might fail if table doesn't exist)
      await supabase
        .from('game_scores')
        .insert({
          user_id: userId,
          game_type: 'tree_level_up',
          score: newLevel,
          reward: 50,
        });
    }

    return jsonResponse({
      tree: mapTreeFromDb(updatedTree),
      leveledUp
    });

  } catch (error) {
    logger.error('Tree POST API Error', { error });
    return errorResponse('Internal Server Error', 500);
  }
}

function mapTreeFromDb(row: any) {
  return {
    userId: row.user_id,
    level: row.level || 1,
    growth: row.growth || 0,
    health: row.health || 'healthy',
    lastWatered: row.last_watered,
    totalWaterings: row.total_waterings || 0,
    createdAt: row.created_at,
  };
}
