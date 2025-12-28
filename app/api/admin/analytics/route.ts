import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin-config';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { getAllStoresAdmin } from '@/lib/firebase/admin-stores';
import { verifyAdminFromRequest } from '@/lib/supabase/admin-auth';

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
    const db = getAdminDb();
    
    // Lấy tổng số users
    const usersSnapshot = await db.collection(COLLECTIONS.USERS).get();
    const totalUsers = usersSnapshot.size;
    
    // Đếm active users (có activity trong 7 ngày)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    let activeUsers = 0;
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const lastActivity = data.lastActivity?.toDate();
      if (lastActivity && lastActivity > sevenDaysAgo) {
        activeUsers++;
      }
    });

    // Tính tổng số ly đã cứu và nhựa giảm
    let totalCupsSaved = 0;
    let totalPlasticReduced = 0;
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      totalCupsSaved += data.totalCupsSaved || 0;
      totalPlasticReduced += data.totalPlasticReduced || 0;
    });

    // Lấy transactions
    const transactionsSnapshot = await db.collection(COLLECTIONS.TRANSACTIONS).get();
    const totalTransactions = transactionsSnapshot.size;
    
    let ongoingTransactions = 0;
    let overdueTransactions = 0;
    let totalReturnTime = 0;
    let completedCount = 0;

    transactionsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'ongoing') ongoingTransactions++;
      if (data.status === 'overdue') overdueTransactions++;
      if (data.status === 'completed' && data.returnTime && data.borrowTime) {
        const returnTime = data.returnTime.toDate();
        const borrowTime = data.borrowTime.toDate();
        totalReturnTime += (returnTime.getTime() - borrowTime.getTime()) / (1000 * 60 * 60);
        completedCount++;
      }
    });

    const averageReturnTime = completedCount > 0 ? totalReturnTime / completedCount : 0;

    // Lấy distribution theo store
    const stores = await getAllStoresAdmin();
    const storeDistribution = stores.map(store => ({
      storeId: store.storeId,
      storeName: store.name,
      available: store.cupInventory.available,
      inUse: store.cupInventory.inUse,
      cleaning: store.cupInventory.cleaning,
      total: store.cupInventory.total,
    }));

    return NextResponse.json({
      totalCupsSaved,
      totalPlasticReduced, // gram
      totalUsers,
      activeUsers,
      totalTransactions,
      ongoingTransactions,
      overdueTransactions,
      averageReturnTime: Math.round(averageReturnTime * 10) / 10, // hours
      storeDistribution,
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

