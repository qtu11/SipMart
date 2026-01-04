import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { verifyAdminFromRequest } from '@/lib/supabase/admin-auth';
import { getAllStores } from '@/lib/supabase/stores';

const getAdmin = () => getSupabaseAdmin();

// Dashboard analytics thời gian thực
export async function GET(request: NextRequest) {
  try {
    // Verify admin using env credentials
    if (!verifyAdminFromRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin credentials required' },
        { status: 401 }
      );
    }

    // 1. Get User Stats
    // We can't easily get active users (last 7 days) without querying all or using count with filter
    // Total users
    const { count: totalUsers, error: countError } = await getAdmin()
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Active users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: activeUsers, error: activeError } = await getAdmin()
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gt('last_activity', sevenDaysAgo.toISOString());

    if (activeError) throw activeError;

    // Total stats (sum) - Supabase doesn't support sum in one query easily without RPC or fetching all
    // For scale, we should create an RPC function `get_dashboard_stats`.
    // But for now, let's fetch limited data or just use what we can.
    // Fetching all users just to sum is bad practice, but maybe acceptable for small scale.
    // Let's assume the scale is small for now or check if we can use a summary table.
    // Alternatively, we can use `.select('total_cups_saved, total_plastic_reduced')` and reduce in JS (careful with memory).

    const { data: userStats, error: statsError } = await getAdmin()
      .from('users')
      .select('total_cups_saved, total_plastic_reduced');

    if (statsError) throw statsError;

    const totalCupsSaved = userStats?.reduce((sum, u) => sum + (u.total_cups_saved || 0), 0) || 0;
    const totalPlasticReduced = userStats?.reduce((sum, u) => sum + (u.total_plastic_reduced || 0), 0) || 0;


    // 2. Transaction Stats
    const { data: transactions, error: transError } = await getAdmin()
      .from('transactions')
      .select('status, borrow_time, return_time, borrow_store_id');

    if (transError) throw transError;

    const totalTransactions = transactions?.length || 0;
    const ongoingTransactions = transactions?.filter(t => t.status === 'ongoing').length || 0;
    const overdueTransactions = transactions?.filter(t => t.status === 'overdue').length || 0;

    // Average return time
    let totalReturnTime = 0;
    let completedCount = 0;

    transactions?.forEach(t => {
      if (t.status === 'completed' && t.return_time && t.borrow_time) {
        const returnTime = new Date(t.return_time).getTime();
        const borrowTime = new Date(t.borrow_time).getTime();
        totalReturnTime += (returnTime - borrowTime) / (1000 * 60 * 60); // hours
        completedCount++;
      }
    });

    const averageReturnTime = completedCount > 0 ? totalReturnTime / completedCount : 0;


    // 3. Store Distribution
    // We already have `getAllStores` in lib
    const stores = await getAllStores();

    const storeDistribution = stores.map(store => ({
      storeId: store.storeId,
      storeName: store.name,
      available: store.cupAvailable,
      inUse: store.cupInUse,
      cleaning: store.cupCleaning,
      total: store.cupTotal,
    }));

    return NextResponse.json({
      totalCupsSaved,
      totalPlasticReduced,
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalTransactions,
      ongoingTransactions,
      overdueTransactions,
      averageReturnTime: Math.round(averageReturnTime * 10) / 10,
      storeDistribution,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Analytics error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
