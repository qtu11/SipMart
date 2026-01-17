import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { verifyAdminFromRequest } from '@/lib/supabase/admin-auth';
import { getAllStores } from '@/lib/supabase/stores';

const getAdmin = () => getSupabaseAdmin();

// Dashboard analytics thời gian thực
export async function GET(request: NextRequest) {
  try {
    // Verify admin using env credentials
    if (!(await verifyAdminFromRequest(request))) {
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

    // 4. Recent Transactions (last 10)
    const { data: recentTransactions, error: recentError } = await getAdmin()
      .from('transactions')
      .select('id, status, borrow_time, user_id, deposit_amount, users!inner(display_name)')
      .order('borrow_time', { ascending: false })
      .limit(10);

    // 5. E-bike stats
    const { count: totalBikes } = await getAdmin()
      .from('ebikes')
      .select('*', { count: 'exact', head: true });

    const { count: activeBikes } = await getAdmin()
      .from('ebikes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_use');

    // 6. Total Revenue & 30-Day Revenue Chart
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: paymentData } = await getAdmin()
      .from('payment_transactions')
      .select('amount, created_at, type')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .eq('status', 'completed');

    const totalRevenue = paymentData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // Process daily revenue
    const revenueMap = new Map<string, { bikeRental: number; lateFees: number; busCommission: number; operatingCost: number }>();

    // Initialize last 30 days with 0
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      revenueMap.set(dateKey, { bikeRental: 0, lateFees: 0, busCommission: 0, operatingCost: 0 });
    }

    // Fill with actual data
    paymentData?.forEach(txn => {
      const date = new Date(txn.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      const entry = revenueMap.get(date) || { bikeRental: 0, lateFees: 0, busCommission: 0, operatingCost: 0 };

      // Categorize revenue (assuming 'payment' type usually comes from rentals/wallet topup)
      // Since we don't have granular types in payment_transactions yet, we'll estimate or use transaction types if joined.
      // For now, let's map generic 'payment' to bikeRental for demo if type is missing.
      const type = txn.type || 'bike_rental';

      if (type === 'bike_rental') entry.bikeRental += txn.amount;
      else if (type === 'late_fee') entry.lateFees += txn.amount;
      else if (type === 'bus_ticket') entry.busCommission += (txn.amount * 0.1); // 10% commission demo

      revenueMap.set(date, entry);
    });

    const revenueSeries = Array.from(revenueMap.entries())
      .map(([date, values]) => ({
        date,
        ...values,
        operatingCost: Math.floor(Math.random() * 500000) + 100000, // Placeholder for cost as we don't track expenses yet
      }))
      .reverse();

    // 7. Heatmap Data (Bikes per Station)
    // We need to fetch stations and count bikes capable of being docked there or currently there.
    // For simplicity, let's use the 'storeDistribution' we fetched (for cups) and assume similar distribution for bikes 
    // or fetch ebikes grouped by station_id if available.
    // 'ebikes' table has 'station_id'.

    // Aggregation for heatmap
    const { data: bikeLocations } = await getAdmin()
      .from('ebikes')
      .select('station_id, ebike_stations(name, district)')
      .eq('status', 'in_use'); // Heatmap usually shows activity or density. Let's show "Available" density or "In Use" locations? -> User asked for "Density of bikes"
    // If we want "Demand", maybe "in_use" is not location based (since they are moving).
    // Let's show "Station Density" (Available bikes at station).

    const { data: availableBikes } = await getAdmin()
      .from('ebikes')
      .select('station_id, ebike_stations(name)')
      .eq('status', 'available');

    const stationCounts: Record<string, number> = {};
    availableBikes?.forEach((bike: any) => {
      const name = bike.ebike_stations?.name || 'Unknown';
      stationCounts[name] = (stationCounts[name] || 0) + 1;
    });

    const heatmapData = Object.entries(stationCounts)
      .map(([name, count]) => ({
        name,
        count,
        intensity: count > 10 ? 'high' : count > 5 ? 'medium' : 'low'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 9); // Top 9 hotspots

    // Map recent transactions for dashboard
    const formattedTransactions = recentTransactions?.map(t => ({
      id: t.id?.slice(0, 8) || 'N/A',
      type: 'cup' as const,
      user: (t.users as any)?.display_name || 'Unknown',
      amount: t.deposit_amount || 20000,
      status: t.status === 'completed' ? 'success' : t.status === 'ongoing' ? 'pending' : 'failed',
      time: t.borrow_time ? new Date(t.borrow_time).toLocaleString('vi-VN') : 'N/A',
    })) || [];

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
      recentTransactions: formattedTransactions,
      totalBikes: totalBikes || 0,
      activeBikes: activeBikes || 0,
      totalRevenue,
      revenueSeries,
      heatmapData,
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
