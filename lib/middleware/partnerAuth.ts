import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { logger } from '@/lib/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'partner-portal-secret-key';

export interface PartnerAuthResult {
    authenticated: boolean;
    userId?: string;
    partnerId?: string;
    branchId?: string;
    email?: string;
    role?: string;
    permissions?: Record<string, any>;
    error?: string;
}

/**
 * Verify Partner Portal JWT token
 */
export async function verifyPartnerAuth(request: NextRequest): Promise<PartnerAuthResult> {
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                authenticated: false,
                error: 'Missing or invalid Authorization header'
            };
        }

        const token = authHeader.substring(7); // Remove 'Bearer '

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;

            // Check token type
            if (decoded.type !== 'partner') {
                return {
                    authenticated: false,
                    error: 'Invalid token type'
                };
            }

            return {
                authenticated: true,
                userId: decoded.userId,
                partnerId: decoded.partnerId,
                branchId: decoded.branchId,
                email: decoded.email,
                role: decoded.role,
                permissions: decoded.permissions
            };

        } catch (jwtError: any) {
            if (jwtError.name === 'TokenExpiredError') {
                return {
                    authenticated: false,
                    error: 'Token expired'
                };
            }
            return {
                authenticated: false,
                error: 'Invalid token'
            };
        }

    } catch (error: any) {
        logger.error('Partner Auth Verification Error', error);
        return {
            authenticated: false,
            error: 'Authentication failed'
        };
    }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
    permissions: Record<string, any> | undefined,
    module: string,
    action: string
): boolean {
    if (!permissions) return false;
    return permissions[module]?.[action] === true;
}

/**
 * Check if user has any of the specified roles
 */
export function hasRole(userRole: string | undefined, allowedRoles: string[]): boolean {
    if (!userRole) return false;
    return allowedRoles.includes(userRole);
}

/**
 * Middleware helper to check permission and return 403 if not allowed
 */
export function requirePermission(
    authResult: PartnerAuthResult,
    module: string,
    action: string
): { allowed: boolean; error?: string } {
    if (!authResult.authenticated) {
        return { allowed: false, error: 'Unauthorized' };
    }

    if (!hasPermission(authResult.permissions, module, action)) {
        return {
            allowed: false,
            error: `Bạn không có quyền thực hiện hành động này (${module}.${action})`
        };
    }

    return { allowed: true };
}

/**
 * Middleware helper to check role
 */
export function requireRole(
    authResult: PartnerAuthResult,
    allowedRoles: string[]
): { allowed: boolean; error?: string } {
    if (!authResult.authenticated) {
        return { allowed: false, error: 'Unauthorized' };
    }

    if (!hasRole(authResult.role, allowedRoles)) {
        return {
            allowed: false,
            error: `Chức năng này chỉ dành cho: ${allowedRoles.join(', ')}`
        };
    }

    return { allowed: true };
}
