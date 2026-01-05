import { z } from 'zod';

/**
 * Validation schemas for API requests
 */

// Borrow API schema
export const borrowSchema = z.object({
    cupId: z.string().min(1, 'Cup ID is required').max(100),
    storeId: z.string().uuid('Invalid store ID format'),
});

// Return API schema
export const returnSchema = z.object({
    cupId: z.string().min(1, 'Cup ID is required').max(100),
    storeId: z.string().uuid('Invalid store ID format'),
});

// Create cup schema (admin)
export const createCupSchema = z.object({
    cupId: z.string().min(1).max(100),
    material: z.enum(['pp_plastic', 'bamboo_fiber'], {
        message: 'Material must be pp_plastic or bamboo_fiber'
    }),
    storeId: z.string().uuid('Invalid store ID format'),
});

// Bulk create cups schema
export const bulkCreateCupsSchema = z.object({
    count: z.number().int().min(1).max(1000, 'Maximum 1000 cups per request'),
    material: z.enum(['pp_plastic', 'bamboo_fiber']),
    storeId: z.string().uuid('Invalid store ID format'),
    prefix: z.string().min(1).max(20).optional(),
});

// Update user schema
export const updateUserSchema = z.object({
    displayName: z.string().min(1).max(100).optional(),
    studentId: z.string().min(1).max(50).optional(),
    avatar: z.string().url('Invalid avatar URL').optional(),
});

// Blacklist user schema
export const blacklistUserSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
    reason: z.string().min(1).max(500),
});

// Create store schema
export const createStoreSchema = z.object({
    name: z.string().min(1).max(200),
    address: z.string().min(1).max(500),
    gpsLat: z.number().min(-90).max(90),
    gpsLng: z.number().min(-180).max(180),
    cupTotal: z.number().int().min(0).default(0),
});

// Reward claim schema
export const rewardClaimSchema = z.object({
    rewardId: z.string().uuid('Invalid reward ID'),
});

// Feed post schema
export const createPostSchema = z.object({
    caption: z.string().max(2000).optional(),
    imageUrl: z.string().url('Invalid image URL'),
    cupId: z.string().min(1).max(100).optional(),
});

// Comment schema
export const createCommentSchema = z.object({
    postId: z.string().uuid('Invalid post ID'),
    content: z.string().min(1).max(1000),
});

// Friend request schema
export const friendRequestSchema = z.object({
    toUserId: z.string().uuid('Invalid user ID'),
});

// Wallet top-up schema
export const topupSchema = z.object({
    amount: z.number().int().min(10000, 'Minimum top-up is 10,000 VND').max(10000000, 'Maximum top-up is 10,000,000 VND'),
});

/**
 * Helper function to validate request body
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
    try {
        const validated = schema.parse(data);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.issues[0];
            return { success: false, error: firstError.message };
        }
        return { success: false, error: 'Validation failed' };
    }
}
