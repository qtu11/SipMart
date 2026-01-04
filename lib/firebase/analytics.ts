// Firebase Advanced Analytics
import { db } from './config';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit as limitQuery,
} from 'firebase/firestore';
import {
  AdvancedAnalytics,
  PersonalEcoDashboard,
  StoreEfficiency,
  DailyReportData,
  TransactionHistory,
} from '@/lib/types';

// ============= ADVANCED ANALYTICS FOR ADMIN =============

export async function getAdvancedAnalytics(): Promise<AdvancedAnalytics | null> {
  try {
    // Get all collections data
    const [users, cups, transactions, stores] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'cups')),
      getDocs(collection(db, 'transactions')),
      getDocs(collection(db, 'stores')),
    ]);

    const userData = users.docs.map(doc => doc.data());
    const cupsData = cups.docs.map(doc => doc.data());
    const transactionsData = transactions.docs.map(doc => doc.data());
    const storesData = stores.docs.map(doc => doc.data());

    // Basic metrics
    const totalCupsSaved = userData.reduce((sum, u) => sum + (u.totalCupsSaved || 0), 0);
    const totalPlasticReduced = userData.reduce((sum, u) => sum + (u.totalPlasticReduced || 0), 0);
    const totalUsers = users.size;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const activeUsersLast7Days = userData.filter(
      u => u.lastActivity && new Date(u.lastActivity.seconds * 1000) > sevenDaysAgo
    ).length;

    const newUsersToday = userData.filter(
      u => u.createdAt && new Date(u.createdAt.seconds * 1000) > oneDayAgo
    ).length;

    // User Behavior
    const averageUserRetentionRate = (activeUsersLast7Days / totalUsers) * 100;
    const churnRate = 100 - averageUserRetentionRate;

    // Cup Performance
    const totalCups = cupsData.length;
    const cupsInUse = cupsData.filter(c => c.status === 'in_use').length;
    const lostCups = cupsData.filter(c => c.status === 'lost').length;

    const cupUtilizationRate = (cupsInUse / totalCups) * 100;
    const lostCupRate = (lostCups / totalCups) * 100;

    const cupAges = cupsData.map(c => {
      const created = new Date(c.createdAt.seconds * 1000);
      return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    });
    const averageCupLifespan = cupAges.reduce((sum, age) => sum + age, 0) / cupAges.length;

    const ppCount = cupsData.filter(c => c.material === 'pp_plastic').length;
    const bambooCount = cupsData.filter(c => c.material === 'bamboo_fiber').length;
    const mostUsedCupMaterial = ppCount > bambooCount ? 'pp_plastic' : 'bamboo_fiber';

    // Financial
    const totalRevenue = transactionsData.reduce((sum, t) => sum + (t.depositAmount || 0), 0);
    const totalRefunded = transactionsData.reduce((sum, t) => sum + (t.refundAmount || 0), 0);
    const totalPenalty = totalRevenue - totalRefunded;

    // Transactions
    const totalTransactions = transactionsData.length;
    const ongoingTransactions = transactionsData.filter(t => t.status === 'ongoing').length;
    const overdueTransactions = transactionsData.filter(t => t.isOverdue).length;

    const completedTrans = transactionsData.filter(t => t.status === 'completed');
    const returnTimes = completedTrans.map(t => {
      if (!t.borrowTime || !t.returnTime) return 0;
      const borrow = new Date(t.borrowTime.seconds * 1000);
      const returnTime = new Date(t.returnTime.seconds * 1000);
      return (returnTime.getTime() - borrow.getTime()) / (1000 * 60 * 60);
    });
    const averageReturnTime = returnTimes.reduce((sum, time) => sum + time, 0) / returnTimes.length || 0;

    // Store Performance
    const storeEfficiency: StoreEfficiency[] = storesData.map(store => {
      const storeTrans = transactionsData.filter(t => t.borrowStoreId === store.storeId);
      const storeOverdue = storeTrans.filter(t => t.isOverdue).length;
      const overdueRate = storeTrans.length > 0 ? (storeOverdue / storeTrans.length) * 100 : 0;

      const storeReturnTimes = storeTrans
        .filter(t => t.status === 'completed' && t.borrowTime && t.returnTime)
        .map(t => {
          const borrow = new Date(t.borrowTime.seconds * 1000);
          const returnTime = new Date(t.returnTime.seconds * 1000);
          return (returnTime.getTime() - borrow.getTime()) / (1000 * 60 * 60);
        });

      const avgReturnTime = storeReturnTimes.length > 0
        ? storeReturnTimes.reduce((sum, time) => sum + time, 0) / storeReturnTimes.length
        : 0;

      const efficiencyScore = Math.max(0, 100 - overdueRate - (avgReturnTime / 24) * 10);

      return {
        storeId: store.storeId,
        storeName: store.name,
        transactionsCount: storeTrans.length,
        averageReturnTime: avgReturnTime,
        overdueRate,
        efficiencyScore,
      };
    });

    storeEfficiency.sort((a, b) => b.efficiencyScore - a.efficiencyScore);

    const busiestStore = storeEfficiency[0]?.storeName || '';
    const slowestStore = storeEfficiency[storeEfficiency.length - 1]?.storeName || '';

    // Time-based analysis
    const peakHours = analyzePeakHours(transactionsData);
    const peakDays = analyzePeakDays(transactionsData);

    // Store distribution
    const storeDistribution = storesData.map(store => ({
      storeId: store.storeId,
      storeName: store.name,
      available: store.cupAvailable || 0,
      inUse: store.cupInUse || 0,
    }));

    // AI Predictions (simple logic, can be enhanced with ML)
    const avgTransactionsPerDay = totalTransactions / 30; // assuming 30 days
    const predictedCupsNeededNextWeek = Math.ceil(avgTransactionsPerDay * 7 * 1.2); // 20% buffer
    const recommendedStockLevel = Math.ceil(predictedCupsNeededNextWeek * 1.5);

    return {
      // Basic
      totalCupsSaved,
      totalPlasticReduced,
      totalUsers,
      activeUsers: activeUsersLast7Days,
      totalTransactions,
      ongoingTransactions,
      overdueTransactions,
      averageReturnTime,
      storeDistribution,

      // Advanced
      averageUserRetentionRate,
      newUsersToday,
      activeUsersLast7Days,
      churnRate,
      cupUtilizationRate,
      averageCupLifespan,
      lostCupRate,
      mostUsedCupMaterial,
      totalRevenue,
      totalRefunded,
      totalPenalty,
      busiestStore,
      slowestStore,
      storeEfficiencyRanking: storeEfficiency,
      peakHours,
      peakDays,
      predictedCupsNeededNextWeek,
      recommendedStockLevel,
    };
  } catch (error) {    return null;
  }
}

function analyzePeakHours(transactionsData: any[]): number[] {
  const hourCounts: { [hour: number]: number } = {};

  transactionsData.forEach(t => {
    if (t.borrowTime) {
      const hour = new Date(t.borrowTime.seconds * 1000).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  });

  const sorted = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, 3).map(([hour]) => parseInt(hour));
}

function analyzePeakDays(transactionsData: any[]): string[] {
  const dayCounts: { [day: string]: number } = {};
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  transactionsData.forEach(t => {
    if (t.borrowTime) {
      const dayIndex = new Date(t.borrowTime.seconds * 1000).getDay();
      const dayName = dayNames[dayIndex];
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    }
  });

  const sorted = Object.entries(dayCounts).sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, 3).map(([day]) => day);
}

// ============= PERSONAL ECO DASHBOARD =============

export async function getPersonalEcoDashboard(userId: string): Promise<PersonalEcoDashboard | null> {
  try {
    const userDoc = await getDocs(query(collection(db, 'users'), where('userId', '==', userId), limitQuery(1)));
    if (userDoc.empty) return null;

    const userData = userDoc.docs[0].data();
    const totalCupsSaved = userData.totalCupsSaved || 0;

    // Calculate environmental impact
    const treesEquivalent = Math.floor(totalCupsSaved / 50); // 50 cups = 1 tree
    const waterSaved = totalCupsSaved * 0.5; // 0.5 liter per cup
    const energySaved = totalCupsSaved * 0.03; // 0.03 kWh per cup
    const co2Reduced = totalCupsSaved * 0.017; // 17 grams = 0.017 kg per cup

    // Get user's transactions for monthly stats
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      where('status', '==', 'completed'),
      orderBy('returnTime', 'desc')
    );
    const transactionsSnap = await getDocs(transactionsQuery);
    const transactions = transactionsSnap.docs.map(doc => doc.data());

    // Group by month
    const monthlyMap: { [month: string]: { cupsSaved: number; points: number } } = {};

    transactions.forEach(t => {
      if (t.returnTime) {
        const date = new Date(t.returnTime.seconds * 1000);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { cupsSaved: 0, points: 0 };
        }
        
        monthlyMap[monthKey].cupsSaved += 1;
        monthlyMap[monthKey].points += t.greenPointsEarned || 0;
      }
    });

    const monthlyStats = Object.entries(monthlyMap)
      .map(([month, data]) => ({
        month,
        cupsSaved: data.cupsSaved,
        points: data.points,
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12);

    // Calculate percentile rank
    const allUsers = await getDocs(collection(db, 'users'));
    const allUserCupsSaved = allUsers.docs.map(doc => doc.data().totalCupsSaved || 0);
    const betterThan = allUserCupsSaved.filter(cups => totalCupsSaved > cups).length;
    const percentileRank = Math.round((betterThan / allUserCupsSaved.length) * 100);

    return {
      userId,
      totalCupsSaved,
      treesEquivalent,
      waterSaved,
      energySaved,
      co2Reduced,
      monthlyStats,
      percentileRank,
    };
  } catch (error) {    return null;
  }
}

// ============= TRANSACTION HISTORY =============

export async function getTransactionHistory(
  userId: string,
  limit?: number,
  startDate?: Date,
  endDate?: Date
): Promise<TransactionHistory[]> {
  try {
    let q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('borrowTime', 'desc')
    );

    const snapshot = await getDocs(q);
    let transactions = snapshot.docs.map(doc => doc.data());

    // Filter by date if provided
    if (startDate || endDate) {
      transactions = transactions.filter(t => {
        if (!t.borrowTime) return false;
        const date = new Date(t.borrowTime.seconds * 1000);
        if (startDate && date < startDate) return false;
        if (endDate && date > endDate) return false;
        return true;
      });
    }

    // Limit results
    if (limit) {
      transactions = transactions.slice(0, limit);
    }

    // Populate additional data
    const history: TransactionHistory[] = await Promise.all(
      transactions.map(async (t) => {
        // Get user data
        const userQuery = query(collection(db, 'users'), where('userId', '==', t.userId), limitQuery(1));
        const userDoc = await getDocs(userQuery);
        const user = userDoc.docs[0]?.data();

        // Get cup data
        const cupQuery = query(collection(db, 'cups'), where('cupId', '==', t.cupId), limitQuery(1));
        const cupDoc = await getDocs(cupQuery);
        const cup = cupDoc.docs[0]?.data();

        // Get store names
        const borrowStoreQuery = query(collection(db, 'stores'), where('storeId', '==', t.borrowStoreId), limitQuery(1));
        const borrowStoreDoc = await getDocs(borrowStoreQuery);
        const borrowStore = borrowStoreDoc.docs[0]?.data();

        let returnStore;
        if (t.returnStoreId) {
          const returnStoreQuery = query(collection(db, 'stores'), where('storeId', '==', t.returnStoreId), limitQuery(1));
          const returnStoreDoc = await getDocs(returnStoreQuery);
          returnStore = returnStoreDoc.docs[0]?.data();
        }

        // Calculate penalty if overdue
        let penaltyAmount = 0;
        if (t.isOverdue && t.overdueHours) {
          const penaltyPerHour = 5000; // 5000 VND per hour
          penaltyAmount = t.overdueHours * penaltyPerHour;
        }

        return {
          ...t,
          userName: user?.displayName || 'Unknown',
          userAvatar: user?.avatar,
          borrowStoreName: borrowStore?.name || 'Unknown Store',
          returnStoreName: returnStore?.name,
          cupMaterial: cup?.material || 'pp_plastic',
          penaltyAmount,
        } as TransactionHistory;
      })
    );

    return history;
  } catch (error) {    return [];
  }
}

// ============= DAILY REPORT DATA =============

export async function generateDailyReport(): Promise<DailyReportData> {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const [transactions, users, stores] = await Promise.all([
      getDocs(collection(db, 'transactions')),
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'stores')),
    ]);

    const transactionsData = transactions.docs.map(doc => doc.data());
    const usersData = users.docs.map(doc => doc.data());
    const storesData = stores.docs.map(doc => doc.data());

    // Filter today's transactions
    const todayTransactions = transactionsData.filter(t => {
      if (!t.borrowTime) return false;
      const date = new Date(t.borrowTime.seconds * 1000);
      return date >= startOfDay && date < endOfDay;
    });

    const completedTransactions = todayTransactions.filter(t => t.status === 'completed').length;
    const overdueTransactions = todayTransactions.filter(t => t.isOverdue).length;

    // New users today
    const newUsers = usersData.filter(u => {
      if (!u.createdAt) return false;
      const date = new Date(u.createdAt.seconds * 1000);
      return date >= startOfDay && date < endOfDay;
    }).length;

    // Revenue today
    const revenue = todayTransactions.reduce((sum, t) => sum + (t.depositAmount || 0), 0);

    // Top stores
    const storeTransCounts: { [storeId: string]: number } = {};
    todayTransactions.forEach(t => {
      storeTransCounts[t.borrowStoreId] = (storeTransCounts[t.borrowStoreId] || 0) + 1;
    });

    const topStores = Object.entries(storeTransCounts)
      .map(([storeId, count]) => {
        const store = storesData.find(s => s.storeId === storeId);
        return {
          storeId,
          storeName: store?.name || 'Unknown',
          transactions: count,
        };
      })
      .sort((a, b) => b.transactions - a.transactions)
      .slice(0, 3);

    // Alerts
    const alerts: DailyReportData['alerts'] = [];

    // Low stock alerts
    storesData.forEach(store => {
      if ((store.cupAvailable || 0) < 10) {
        alerts.push({
          type: 'low_stock',
          message: `${store.name} chỉ còn ${store.cupAvailable} ly`,
          storeId: store.storeId,
        });
      }
    });

    // Overdue alerts
    if (overdueTransactions > 0) {
      alerts.push({
        type: 'overdue',
        message: `${overdueTransactions} giao dịch quá hạn`,
      });
    }

    return {
      date: startOfDay.toISOString().split('T')[0],
      totalTransactions: todayTransactions.length,
      completedTransactions,
      overdueTransactions,
      newUsers,
      revenue,
      topStores,
      alerts,
    };
  } catch (error) {    return {
      date: new Date().toISOString().split('T')[0],
      totalTransactions: 0,
      completedTransactions: 0,
      overdueTransactions: 0,
      newUsers: 0,
      revenue: 0,
      topStores: [],
      alerts: [],
    };
  }
}

