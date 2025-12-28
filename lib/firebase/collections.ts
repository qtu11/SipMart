// Firestore Collections Reference
export const COLLECTIONS = {
  USERS: 'users',
  CUPS: 'cups',
  TRANSACTIONS: 'transactions',
  STORES: 'stores',
  ADMINS: 'admins',
  LEADERBOARD: 'leaderboard',
  VIRTUAL_TREES: 'virtualTrees',
  GREEN_FEED: 'greenFeed',
  ANALYTICS: 'analytics',
  NOTIFICATIONS: 'notifications',
  STORIES: 'stories',
  FRIEND_REQUESTS: 'friendRequests',
  FRIENDSHIPS: 'friendships',
} as const;

// Helper functions để tạo document references
export const getUserRef = (userId: string) => `${COLLECTIONS.USERS}/${userId}`;
export const getCupRef = (cupId: string) => `${COLLECTIONS.CUPS}/${cupId}`;
export const getTransactionRef = (transactionId: string) => `${COLLECTIONS.TRANSACTIONS}/${transactionId}`;
export const getStoreRef = (storeId: string) => `${COLLECTIONS.STORES}/${storeId}`;
export const getAdminRef = (adminId: string) => `${COLLECTIONS.ADMINS}/${adminId}`;
export const getVirtualTreeRef = (userId: string) => `${COLLECTIONS.VIRTUAL_TREES}/${userId}`;
export const getGreenFeedRef = (postId: string) => `${COLLECTIONS.GREEN_FEED}/${postId}`;

