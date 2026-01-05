// Centralized gamification configuration
// Used as default values with fallback to environment variables

export const GAMIFICATION_CONFIG = {
    points: {
        borrow: parseInt(process.env.NEXT_PUBLIC_POINTS_BORROW || '50'),
        returnOnTime: parseInt(process.env.NEXT_PUBLIC_POINTS_RETURN || '100'),
        returnLate: parseInt(process.env.NEXT_PUBLIC_POINTS_RETURN_LATE || '50'),
        speedReturner: parseInt(process.env.NEXT_PUBLIC_POINTS_SPEED_RETURNER || '200'),
        firstBorrow: parseInt(process.env.NEXT_PUBLIC_POINTS_FIRST_BORROW || '100'),
    },
    deposit: {
        amount: parseInt(process.env.NEXT_PUBLIC_DEPOSIT_AMOUNT || '20000'),
        late24to48Fee: parseInt(process.env.NEXT_PUBLIC_LATE_FEE_24_48 || '5000'),
        penaltyPerHour: parseInt(process.env.NEXT_PUBLIC_PENALTY_PER_HOUR || '5000'),
    },
    tiers: {
        seed: {
            name: 'Hạng Mầm',
            borrowLimit: 1,
            threshold: 0,
            emoji: '🌱',
        },
        sprout: {
            name: 'Hạng Chồi',
            borrowLimit: 2,
            threshold: 100,
            emoji: '🌿',
        },
        sapling: {
            name: 'Hạng Cây Non',
            borrowLimit: 2,
            threshold: 500,
            emoji: '🌳',
        },
        tree: {
            name: 'Chiến Binh Xanh',
            borrowLimit: 3,
            threshold: 2000,
            emoji: '🌲',
        },
        forest: {
            name: 'Rừng Xanh',
            borrowLimit: 5,
            threshold: 5000,
            emoji: '🌴',
        },
    },
    streak: {
        voucherAfter: parseInt(process.env.NEXT_PUBLIC_STREAK_VOUCHER_AFTER || '5'),
        voucherDiscount: parseFloat(process.env.NEXT_PUBLIC_STREAK_VOUCHER_DISCOUNT || '0.1'),
    },
    borrow: {
        durationHours: parseInt(process.env.NEXT_PUBLIC_BORROW_DURATION_HOURS || '24'),
    },
} as const;

export type RankLevel = keyof typeof GAMIFICATION_CONFIG.tiers;

// Helper to get tier info by rank level
export function getTierConfig(rankLevel: RankLevel) {
    return GAMIFICATION_CONFIG.tiers[rankLevel];
}

// Helper to calculate next tier
export function getNextTier(currentPoints: number): {
    currentTier: RankLevel;
    nextTier: RankLevel | null;
    pointsToNext: number;
} {
    const tiers = GAMIFICATION_CONFIG.tiers;
    const tierEntries = Object.entries(tiers) as [RankLevel, typeof tiers.seed][];

    let currentTier: RankLevel = 'seed';
    let nextTier: RankLevel | null = null;
    let pointsToNext = 0;

    for (let i = 0; i < tierEntries.length; i++) {
        const [tier, config] = tierEntries[i];
        if (currentPoints >= config.threshold) {
            currentTier = tier;
        }
        if (currentPoints < config.threshold && !nextTier) {
            nextTier = tier;
            pointsToNext = config.threshold - currentPoints;
            break;
        }
    }

    return { currentTier, nextTier, pointsToNext };
}
