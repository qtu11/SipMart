// User Types
export interface User {
  userId: string;
  studentId?: string;
  email: string;
  displayName?: string;
  avatar?: string;
  walletBalance: number; // Tiền cọc
  greenPoints: number;
  rankLevel: 'seed' | 'sprout' | 'sapling' | 'tree' | 'forest';
  ecoHistory: EcoAction[];
  totalCupsSaved: number;
  totalPlasticReduced: number; // gram
  createdAt: Date;
  lastActivity: Date;
  isBlacklisted: boolean;
  blacklistReason?: string;
  blacklistCount: number;
  friends?: string[]; // Array of user IDs
}

export interface EcoAction {
  actionId: string;
  type: 'borrow' | 'return' | 'checkin' | 'share';
  cupId?: string;
  points: number;
  timestamp: Date;
  description: string;
}

// Cup Types
export type CupStatus = 'available' | 'in_use' | 'cleaning' | 'lost';
export type CupMaterial = 'pp_plastic' | 'bamboo_fiber';

export interface Cup {
  cupId: string; // 8-digit ID từ QR code
  material: CupMaterial;
  status: CupStatus;
  createdAt: Date;
  lastCleanedAt?: Date;
  totalUses: number;
  currentUserId?: string; // User đang mượn
  currentTransactionId?: string;
}

// Transaction Types
export type TransactionStatus = 'ongoing' | 'completed' | 'overdue' | 'cancelled';

export interface Transaction {
  transactionId: string;
  userId: string;
  cupId: string;
  borrowStoreId: string;
  returnStoreId?: string;
  borrowTime: Date;
  dueTime: Date;
  returnTime?: Date;
  status: TransactionStatus;
  depositAmount: number;
  refundAmount?: number;
  greenPointsEarned?: number;
  isOverdue: boolean;
  overdueHours?: number;
}

// Store Types
export interface Store {
  storeId: string;
  name: string;
  gpsLocation: {
    lat: number;
    lng: number;
  };
  address: string;
  cupInventory: {
    available: number;
    inUse: number;
    cleaning: number;
    total: number;
  };
  partnerStatus: 'active' | 'inactive' | 'pending';
  createdAt: Date;
}

// Admin Types
export type AdminRoleType = 'super_admin' | 'store_admin';

export interface Admin {
  adminId: string;
  email: string;
  displayName: string;
  role: AdminRoleType;
  storeId?: string; // Cho store_admin
  actionLog: AdminAction[];
  createdAt: Date;
}

export interface AdminAction {
  actionId: string;
  type: 'create_qr' | 'distribute_cups' | 'blacklist_user' | 'update_inventory';
  details: string;
  timestamp: Date;
}

// Gamification Types
export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatar?: string;
  greenPoints: number;
  totalCupsSaved: number;
  rank: number;
  department?: string; // Khoa/Lớp
  class?: string;
}

export interface VirtualTree {
  userId: string;
  level: number; // 1-10
  growth: number; // 0-100%
  health: 'healthy' | 'wilting' | 'dead';
  lastWatered: Date;
  totalWaterings: number;
}

// Green Feed Types
export interface GreenFeedPost {
  postId: string;
  userId: string;
  displayName: string;
  avatar?: string;
  imageUrl: string;
  caption?: string;
  cupId?: string;
  greenPointsEarned: number;
  likes: number;
  comments: Comment[];
  createdAt: Date;
}

export interface Comment {
  commentId: string;
  userId: string;
  displayName: string;
  content: string;
  createdAt: Date;
}

// Analytics Types
export interface Analytics {
  totalCupsSaved: number;
  totalPlasticReduced: number; // gram
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  ongoingTransactions: number;
  overdueTransactions: number;
  averageReturnTime: number; // hours
  storeDistribution: {
    storeId: string;
    storeName: string;
    available: number;
    inUse: number;
  }[];
}

// ============= NEW FEATURES TYPES =============

// Achievements & Badges
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type AchievementCategory = 'cups' | 'social' | 'streak' | 'eco' | 'special';

export interface Achievement {
  achievementId: string;
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  requirement: number;
  rewardPoints: number;
  specialReward?: string;
  category: AchievementCategory;
  createdAt: Date;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  progress: number;
  achievement?: Achievement;
}

// Rewards Store
export type RewardCategory = 'voucher' | 'merchandise' | 'privilege' | 'charity';
export type RewardClaimStatus = 'pending' | 'claimed' | 'expired';

export interface Reward {
  rewardId: string;
  name: string;
  description: string;
  image: string;
  pointsCost: number;
  stock: number;
  category: RewardCategory;
  validUntil?: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface RewardClaim {
  claimId: string;
  userId: string;
  rewardId: string;
  pointsUsed: number;
  status: RewardClaimStatus;
  claimedAt: Date;
  usedAt?: Date;
  reward?: Reward;
}

// Challenges & Events
export type ChallengeType = 'weekly' | 'special' | 'event';

export interface ChallengeRequirement {
  type: 'return_fast' | 'cups_count' | 'streak' | 'social' | 'green_feed';
  count?: number;
  timeLimit?: number; // hours
  target?: any;
}

export interface Challenge {
  challengeId: string;
  name: string;
  description: string;
  type: ChallengeType;
  requirement: ChallengeRequirement;
  rewardPoints: number;
  rewardBadge?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface UserChallenge {
  id: string;
  userId: string;
  challengeId: string;
  progress: number;
  completed: boolean;
  completedAt?: Date;
  joinedAt: Date;
  challenge?: Challenge;
}

// Payment Methods
export type PaymentMethodType = 'vnpay' | 'momo' | 'zalopay' | 'bank_card' | 'student_card';

export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  provider: string;
  accountNumber?: string;
  accountName?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
}

export type PaymentTransactionType = 'deposit' | 'topup' | 'refund' | 'penalty';
export type PaymentTransactionStatus = 'pending' | 'success' | 'failed';

export interface PaymentTransaction {
  id: string;
  userId: string;
  type: PaymentTransactionType;
  amount: number;
  paymentMethod: string;
  transactionCode: string;
  status: PaymentTransactionStatus;
  description?: string;
  metadata?: any;
  createdAt: Date;
  completedAt?: Date;
}

// Transaction History (Extended)
export interface TransactionHistory extends Transaction {
  userName: string;
  userAvatar?: string;
  borrowStoreName: string;
  returnStoreName?: string;
  cupMaterial: CupMaterial;
  penaltyAmount?: number;
}

// Personal Eco Dashboard
export interface PersonalEcoDashboard {
  userId: string;
  totalCupsSaved: number;
  treesEquivalent: number; // Cây
  waterSaved: number; // Lít
  energySaved: number; // kWh
  co2Reduced: number; // kg
  monthlyStats: {
    month: string;
    cupsSaved: number;
    points: number;
  }[];
  percentileRank: number; // Top % so với community
}

// Admin Advanced Analytics
export interface AdvancedAnalytics extends Analytics {
  // User Behavior
  averageUserRetentionRate: number; // %
  newUsersToday: number;
  activeUsersLast7Days: number;
  churnRate: number; // %

  // Cup Performance
  cupUtilizationRate: number; // %
  averageCupLifespan: number; // days
  lostCupRate: number; // %
  mostUsedCupMaterial: CupMaterial;

  // Financial
  totalRevenue: number;
  totalRefunded: number;
  totalPenalty: number;

  // Store Performance
  busiestStore: string;
  slowestStore: string;
  storeEfficiencyRanking: StoreEfficiency[];

  // Time-based
  peakHours: number[];
  peakDays: string[];

  // Predictions (AI)
  predictedCupsNeededNextWeek: number;
  recommendedStockLevel: number;
}

export interface StoreEfficiency {
  storeId: string;
  storeName: string;
  transactionsCount: number;
  averageReturnTime: number;
  overdueRate: number;
  efficiencyScore: number; // 0-100
}

// Admin Role & Permissions
export type AdminPermission =
  | 'view_dashboard'
  | 'create_qr'
  | 'manage_users'
  | 'blacklist_users'
  | 'manage_inventory'
  | 'view_analytics'
  | 'export_data'
  | 'manage_campaigns'
  | 'system_settings'
  | 'manage_roles'
  | 'view_incidents'
  | 'resolve_incidents';

// Admin Role Management Interface (different from AdminRoleType)
export interface AdminRoleConfig {
  id: string;
  roleName: string;
  permissions: AdminPermission[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Campaigns
export type CampaignType = 'happy_hour' | 'welcome' | 'double_points' | 'bonus';
export type CampaignTarget = 'all' | 'freshmen' | 'top_users' | 'custom';
export type CampaignRewardType = 'points_multiplier' | 'fixed_points' | 'badge';

export interface CampaignReward {
  multiplier?: number;
  points?: number;
  badgeId?: string;
}

export interface Campaign {
  campaignId: string;
  name: string;
  description: string;
  type: CampaignType;
  target: CampaignTarget;
  rewardType: CampaignRewardType;
  rewardValue: CampaignReward;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
}

// System Settings
export type SettingCategory = 'deposit' | 'points' | 'gamification' | 'features';
export type SettingDataType = 'number' | 'boolean' | 'string' | 'json';

export interface SystemSetting {
  id: string;
  key: string;
  value: any;
  dataType: SettingDataType;
  category: SettingCategory;
  updatedAt: Date;
  updatedBy?: string;
}

export interface SystemSettings {
  // Deposit & Penalty
  depositAmount: number;
  returnTimeLimit: number; // hours
  penaltyPerHour: number;
  maxOverdueHours: number;

  // Points
  pointsForReturn: number;
  pointsForLateReturn: number;
  pointsForCheckin: number;
  pointsForGreenFeed: number;

  // Gamification
  rankThresholds: {
    seed: number;
    sprout: number;
    sapling: number;
    tree: number;
    forest: number;
  };

  // Features
  enableChatAI: boolean;
  enableGreenFeed: boolean;
  enableFriends: boolean;
  enableChallenges: boolean;
  enableRewardsStore: boolean;
  maintenanceMode: boolean;
}

// Incidents
export type IncidentType = 'lost_cup' | 'damaged_cup' | 'overdue' | 'complaint';
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed';
export type IncidentPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Incident {
  incidentId: string;
  type: IncidentType;
  cupId?: string;
  userId?: string;
  storeId?: string;
  description: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  assignedTo?: string;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

// Auto Reports
export type ReportType = 'daily' | 'weekly' | 'monthly';

export interface AutoReport {
  reportId: string;
  type: ReportType;
  recipients: string[];
  lastSent?: Date;
  nextSend: Date;
  isActive: boolean;
  config?: any;
  createdAt: Date;
}

export interface DailyReportData {
  date: string;
  totalTransactions: number;
  completedTransactions: number;
  overdueTransactions: number;
  newUsers: number;
  revenue: number;
  topStores: {
    storeId: string;
    storeName: string;
    transactions: number;
  }[];
  alerts: {
    type: 'low_stock' | 'overdue' | 'lost_cup';
    message: string;
    storeId?: string;
    userId?: string;
  }[];
}

// Mini Games
export type GameType = 'tree_watering' | 'cup_catch' | 'eco_quiz';

export interface GameScore {
  scoreId: string;
  userId: string;
  gameType: GameType;
  score: number;
  reward: number; // Green Points
  metadata?: any;
  playedAt: Date;
}

// QR Code Custom Design
export interface QRCodeDesign {
  cupId: string;
  logo: string;
  color: string;
  size: number; // px
  format: 'png' | 'svg' | 'pdf';
  includeLabel: boolean;
  labelText?: string;
}

// Bulk Operations
export interface BulkOperation {
  operationId: string;
  type: 'import_users' | 'export_data' | 'give_points' | 'send_notification';
  targetCount: number;
  successCount: number;
  failCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  createdAt: Date;
  completedAt?: Date;
}

// Inventory Management
export interface InventoryAlert {
  storeId: string;
  storeName: string;
  alertType: 'low_stock' | 'overstock' | 'transfer_needed';
  currentStock: number;
  recommendedAction: string;
  priority: 'low' | 'medium' | 'high';
}

export interface InventoryTransfer {
  transferId: string;
  fromStoreId: string;
  toStoreId: string;
  cupCount: number;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  requestedBy: string; // Admin ID
  createdAt: Date;
  completedAt?: Date;
}

