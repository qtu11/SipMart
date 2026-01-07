import { getSupabaseAdmin } from './server';

const getAdmin = () => getSupabaseAdmin();

export interface AuditLog {
    logId: string;
    actorId?: string;
    actorType: 'user' | 'admin' | 'system';
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValue?: Record<string, any>;
    newValue?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
}

export type AuditAction =
    | 'user_login'
    | 'user_logout'
    | 'user_register'
    | 'user_update_profile'
    | 'user_blacklist'
    | 'user_unblacklist'
    | 'cup_borrow'
    | 'cup_return'
    | 'cup_create'
    | 'cup_delete'
    | 'payment_topup'
    | 'payment_refund'
    | 'payment_withdrawal'
    | 'reward_claim'
    | 'achievement_unlock'
    | 'challenge_join'
    | 'challenge_complete'
    | 'admin_login'
    | 'admin_create_user'
    | 'admin_update_user'
    | 'admin_create_store'
    | 'admin_update_store'
    | 'admin_create_cup'
    | 'admin_broadcast_notification'
    | 'admin_create_challenge'
    | 'admin_update_settings'
    | 'system_cron'
    | 'system_error';

/**
 * Tạo audit log entry
 */
export async function createAuditLog(params: {
    actorId?: string;
    actorType: AuditLog['actorType'];
    action: AuditAction | string;
    resourceType: string;
    resourceId?: string;
    oldValue?: Record<string, any>;
    newValue?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
}): Promise<void> {
    try {
        const {
            actorId,
            actorType,
            action,
            resourceType,
            resourceId,
            oldValue,
            newValue,
            ipAddress,
            userAgent,
            metadata,
        } = params;

        await getAdmin()
            .from('audit_logs')
            .insert({
                actor_id: actorId,
                actor_type: actorType,
                action,
                resource_type: resourceType,
                resource_id: resourceId,
                old_value: oldValue,
                new_value: newValue,
                ip_address: ipAddress,
                user_agent: userAgent,
                metadata,
            });

    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw - audit logging should not break main flow
    }
}

/**
 * Lấy audit logs (admin only)
 */
export async function getAuditLogs(options?: {
    actorId?: string;
    actorType?: AuditLog['actorType'];
    action?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}): Promise<{ logs: AuditLog[]; total: number }> {
    let query = getAdmin()
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

    if (options?.actorId) {
        query = query.eq('actor_id', options.actorId);
    }
    if (options?.actorType) {
        query = query.eq('actor_type', options.actorType);
    }
    if (options?.action) {
        query = query.eq('action', options.action);
    }
    if (options?.resourceType) {
        query = query.eq('resource_type', options.resourceType);
    }
    if (options?.resourceId) {
        query = query.eq('resource_id', options.resourceId);
    }
    if (options?.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
    }
    if (options?.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
        logs: (data || []).map(mapAuditLogFromDb),
        total: count || 0,
    };
}

/**
 * Lấy user activity log
 */
export async function getUserActivityLog(
    userId: string,
    limit: number = 20
): Promise<AuditLog[]> {
    const { data, error } = await getAdmin()
        .from('audit_logs')
        .select('*')
        .eq('actor_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return (data || []).map(mapAuditLogFromDb);
}

/**
 * Lấy resource history
 */
export async function getResourceHistory(
    resourceType: string,
    resourceId: string
): Promise<AuditLog[]> {
    const { data, error } = await getAdmin()
        .from('audit_logs')
        .select('*')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapAuditLogFromDb);
}

// Mapping helper
function mapAuditLogFromDb(row: any): AuditLog {
    return {
        logId: row.log_id,
        actorId: row.actor_id,
        actorType: row.actor_type as AuditLog['actorType'],
        action: row.action,
        resourceType: row.resource_type,
        resourceId: row.resource_id,
        oldValue: row.old_value,
        newValue: row.new_value,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        metadata: row.metadata,
        createdAt: new Date(row.created_at),
    };
}
