/**
 * Shared TypeScript types for API requests/responses
 * Eliminates 'any' type usage across the codebase
 */

// ============= User Types =============
export interface User {
    userId: string;
    studentId?: string;
    email: string;
    displayName?: string;
    avatar?: string;
    walletBalance: number;
    greenPoints: number;
    rankLevel: 'seed' | 'sprout' | 'sapling' | 'tree' | 'forest';
    totalCupsSaved: number;
    totalPlasticReduced: number;
    createdAt: Date;
    lastActivity: Date;
    isBlacklisted: boolean;
    blacklistReason?: string;
    blacklistCount: number;
}

export interface UserProfile extends User {
    id?: string;
    user_id?: string;
    uid?: string;
}

// ============= Cup Types =============
export interface Cup {
    cupId: string;
    material: 'pp_plastic' | 'bamboo_fiber';
    status: 'available' | 'in_use' | 'cleaning' | 'lost';
    createdAt: Date;
    lastCleanedAt?: Date;
    totalUses: number;
    currentUserId?: string;
    currentTransactionId?: string;
}

// ============= Transaction Types =============
export interface Transaction {
    transactionId: string;
    userId: string;
    cupId: string;
    borrowStoreId: string;
    returnStoreId?: string;
    borrowTime: Date;
    dueTime: Date;
    returnTime?: Date;
    status: 'ongoing' | 'completed' | 'overdue' | 'cancelled';
    depositAmount: number;
    refundAmount?: number;
    greenPointsEarned?: number;
    isOverdue: boolean;
    overdueHours?: number;
}

// ============= Store Types =============
export interface Store {
    storeId: string;
    name: string;
    gpsLat: number;
    gpsLng: number;
    address: string;
    cupAvailable: number;
    cupInUse: number;
    cupCleaning: number;
    cupTotal: number;
    partnerStatus: 'active' | 'inactive' | 'pending';
    createdAt: Date;
}

// ============= API Request/Response Types =============

export interface BorrowRequest {
    userId: string;
    cupId: string;
    storeId: string;
}

export interface BorrowResponse {
    success: boolean;
    message: string;
    transactionId: string;
    dueTime: Date;
    depositAmount: number;
}

export interface ReturnRequest {
    userId: string;
    cupId: string;
    storeId: string;
}

export interface ReturnResponse {
    success: boolean;
    message: string;
    refundAmount: number;
    greenPointsEarned: number;
    isOverdue: boolean;
    overdueHours?: number;
    cupsSaved: number;
}

export interface WalletTopUpRequest {
    userId: string;
    amount: number;
    paymentMethod: 'vnpay' | 'momo' | 'zalopay' | 'bank_card';
}

export interface ApiError {
    error: string;
    details?: unknown;
    code?: string;
}

export interface ApiSuccess<T = unknown> {
    success: true;
    data: T;
    message?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ============= Notification Types =============
export interface Notification {
    notificationId?: string;
    notification_id?: string;
    id?: string;
    userId: string;
    type: 'success' | 'warning' | 'info' | 'reminder';
    title: string;
    message: string;
    url?: string;
    data?: string;
    read: boolean;
    timestamp: Date;
}

// ============= Achievement Types =============
export interface Achievement {
    achievementId: string;
    badgeId: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    requirement: number;
    rewardPoints: number;
    specialReward?: string;
    category: 'cups' | 'social' | 'streak' | 'eco' | 'special';
    createdAt: Date;
}

// ============= VNPay Types =============
export interface VNPayParams {
    [key: string]: string | number;
}

export interface VNPaySortableObject {
    [key: string]: string | number;
}

// ============= Incident Types =============
export interface Incident {
    incidentId: string;
    type: 'lost_cup' | 'damaged_cup' | 'overdue' | 'complaint';
    cupId?: string;
    userId?: string;
    storeId?: string;
    description: string;
    status: 'open' | 'investigating' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    assignedTo?: string;
    resolution?: string;
    createdAt: Date;
    updatedAt: Date;
    resolvedAt?: Date;
}

// ============= Settings Types =============
export interface SettingValue {
    key: string;
    value: string | number | boolean;
}
