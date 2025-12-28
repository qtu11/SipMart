import { getSupabaseAdmin } from './server';
import type { User, EcoAction } from '../types';

// Helper to get admin client
const getAdmin = () => getSupabaseAdmin();

// Create user
export async function createUser(
  userId: string,
  email: string,
  displayName?: string,
  studentId?: string
): Promise<User> {
  try {
    console.log('🔵 Creating user in Supabase:', { userId, email, displayName, studentId });
    
    const { data, error } = await getAdmin()
      .from('users')
      .insert({
        user_id: userId,
        email,
        display_name: displayName || email.split('@')[0],
        student_id: studentId || null,
        wallet_balance: 0,
        green_points: 0,
        rank_level: 'seed',
        total_cups_saved: 0,
        total_plastic_reduced: 0,
        is_blacklisted: false,
        blacklist_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('✅ User created successfully:', data);
    return mapUserFromDb(data);
  } catch (error: any) {
    console.error('❌ createUser error:', error);
    throw error;
  }
}

// Get user by ID
export async function getUser(userId: string): Promise<User | null> {
  const { data, error } = await getAdmin()
    .from('users')
    .select(`
      *,
      eco_actions (*)
    `)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return mapUserFromDb(data);
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await getAdmin()
    .from('users')
    .select(`
      *,
      eco_actions (*)
    `)
    .eq('email', email)
    .single();

  if (error || !data) return null;

  return mapUserFromDb(data);
}

// Get user by student ID
export async function getUserByStudentId(studentId: string): Promise<User | null> {
  const { data, error } = await getAdmin()
    .from('users')
    .select(`
      *,
      eco_actions (*)
    `)
    .eq('student_id', studentId)
    .single();

  if (error || !data) return null;

  return mapUserFromDb(data);
}

// Get all users
export async function getAllUsers(limit?: number): Promise<User[]> {
  let query = getAdmin()
    .from('users')
    .select(`
      *,
      eco_actions (*)
    `)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  if (!data) return [];

  return data.map(mapUserFromDb);
}

// Update user
export async function updateUser(
  userId: string,
  data: Partial<Omit<User, 'userId' | 'ecoHistory'>>
): Promise<User> {
  const updateData: any = {
    last_activity: new Date().toISOString(),
  };

  if (data.email !== undefined) updateData.email = data.email;
  if (data.displayName !== undefined) updateData.display_name = data.displayName;
  if (data.avatar !== undefined) updateData.avatar = data.avatar;
  if (data.walletBalance !== undefined) updateData.wallet_balance = data.walletBalance;
  if (data.greenPoints !== undefined) updateData.green_points = data.greenPoints;
  if (data.rankLevel !== undefined) updateData.rank_level = data.rankLevel;
  if (data.totalCupsSaved !== undefined) updateData.total_cups_saved = data.totalCupsSaved;
  if (data.totalPlasticReduced !== undefined) updateData.total_plastic_reduced = data.totalPlasticReduced;
  if (data.isBlacklisted !== undefined) updateData.is_blacklisted = data.isBlacklisted;
  if (data.blacklistReason !== undefined) updateData.blacklist_reason = data.blacklistReason;
  if (data.blacklistCount !== undefined) updateData.blacklist_count = data.blacklistCount;
  if (data.studentId !== undefined) updateData.student_id = data.studentId;

  const { data: updated, error } = await getAdmin()
    .from('users')
    .update(updateData)
    .eq('user_id', userId)
    .select(`
      *,
      eco_actions (*)
    `)
    .single();

  if (error) throw error;
  if (!updated) throw new Error('User not found');

  return mapUserFromDb(updated);
}

// Add green points and check rank up
export async function addGreenPoints(
  userId: string,
  points: number,
  description: string
): Promise<{ rankUp: boolean; newRank?: User['rankLevel']; pointsAdded: number }> {
  // Get current user
  const user = await getUser(userId);
  if (!user) throw new Error('User not found');

  const oldPoints = user.greenPoints;
  const newPoints = oldPoints + points;

  // Rank thresholds
  const rankThresholds: Record<User['rankLevel'], number> = {
    seed: 0,
    sprout: 100,
    sapling: 500,
    tree: 2000,
    forest: 5000,
  };

  let newRank = user.rankLevel;
  let rankUp = false;

  // Check rank up
  if (newPoints >= rankThresholds.forest && user.rankLevel !== 'forest') {
    newRank = 'forest';
    rankUp = true;
  } else if (newPoints >= rankThresholds.tree && user.rankLevel !== 'tree' && user.rankLevel !== 'forest') {
    newRank = 'tree';
    rankUp = true;
  } else if (newPoints >= rankThresholds.sapling && user.rankLevel !== 'sapling' && !['tree', 'forest'].includes(user.rankLevel)) {
    newRank = 'sapling';
    rankUp = true;
  } else if (newPoints >= rankThresholds.sprout && user.rankLevel === 'seed') {
    newRank = 'sprout';
    rankUp = true;
  }

  // Update user
  const { error: updateError } = await getAdmin()
    .from('users')
    .update({
      green_points: newPoints,
      rank_level: newRank,
      last_activity: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) throw updateError;

  // Add eco action
  await getAdmin()
    .from('eco_actions')
    .insert({
      user_id: userId,
      type: 'share',
      points,
      description,
    });

  return {
    rankUp,
    newRank: rankUp ? newRank : undefined,
    pointsAdded: points,
  };
}

// Update wallet
export async function updateWallet(userId: string, amount: number): Promise<void> {
  // Get current value first
  const user = await getUser(userId);
  if (!user) throw new Error('User not found');

  const { error } = await getAdmin()
    .from('users')
    .update({
      wallet_balance: user.walletBalance + amount,
      last_activity: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) throw error;
}

// Increment cups saved
export async function incrementCupsSaved(userId: string, count: number = 1): Promise<void> {
  // Get current value first
  const user = await getUser(userId);
  if (!user) throw new Error('User not found');

  const { error } = await getAdmin()
    .from('users')
    .update({
      total_cups_saved: user.totalCupsSaved + count,
      last_activity: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) throw error;
}

// Blacklist user
export async function blacklistUser(userId: string, reason: string): Promise<void> {
  // Get current value first
  const user = await getUser(userId);
  if (!user) throw new Error('User not found');

  const { error } = await getAdmin()
    .from('users')
    .update({
      is_blacklisted: true,
      blacklist_reason: reason,
      blacklist_count: user.blacklistCount + 1,
    })
    .eq('user_id', userId);

  if (error) throw error;
}

// Unblacklist user
export async function unblacklistUser(userId: string): Promise<void> {
  const { error } = await getAdmin()
    .from('users')
    .update({
      is_blacklisted: false,
      blacklist_reason: null,
    })
    .eq('user_id', userId);

  if (error) throw error;
}

// Helper: Map database row to User type
function mapUserFromDb(row: any): User {
  return {
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name || undefined,
    avatar: row.avatar || undefined,
    walletBalance: parseFloat(row.wallet_balance) || 0,
    greenPoints: row.green_points || 0,
    rankLevel: row.rank_level as User['rankLevel'],
    ecoHistory: (row.eco_actions || []).map((action: any) => ({
      actionId: action.action_id,
      type: action.type as EcoAction['type'],
      cupId: action.cup_id || undefined,
      points: action.points || 0,
      timestamp: new Date(action.timestamp),
      description: action.description,
    })),
    totalCupsSaved: row.total_cups_saved || 0,
    totalPlasticReduced: row.total_plastic_reduced || 0,
    createdAt: new Date(row.created_at),
    lastActivity: new Date(row.last_activity),
    isBlacklisted: row.is_blacklisted || false,
    blacklistReason: row.blacklist_reason || undefined,
    blacklistCount: row.blacklist_count || 0,
    studentId: row.student_id || undefined,
  };
}

