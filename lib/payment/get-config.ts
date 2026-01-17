import { getSupabaseAdmin } from '@/lib/supabase/server';

// Cache for payment config to reduce DB calls
const configCache: Map<string, { value: string; expiry: number }> = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute cache

export interface PaymentConfig {
    providerName: string;
    configKey: string;
    configValue: string;
    isActive: boolean;
}

/**
 * Get a single payment configuration value
 * Falls back to environment variable if not in database
 */
export async function getPaymentConfig(
    provider: string,
    key: string,
    fallbackEnvKey?: string
): Promise<string | null> {
    const cacheKey = `${provider}:${key}`;

    // Check cache first
    const cached = configCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
        return cached.value;
    }

    try {
        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
            .from('payment_settings')
            .select('config_value, is_active')
            .eq('provider_name', provider)
            .eq('config_key', key)
            .single();

        if (error || !data) {
            // Fallback to environment variable
            if (fallbackEnvKey) {
                return process.env[fallbackEnvKey] || null;
            }
            return null;
        }

        if (!data.is_active) {
            return null; // Provider is disabled
        }

        // Cache the result
        configCache.set(cacheKey, {
            value: data.config_value,
            expiry: Date.now() + CACHE_TTL,
        });

        return data.config_value;
    } catch (error) {
        console.error('Error fetching payment config:', error);
        // Fallback to environment variable
        if (fallbackEnvKey) {
            return process.env[fallbackEnvKey] || null;
        }
        return null;
    }
}

/**
 * Get all configs for a specific provider
 */
export async function getProviderConfigs(provider: string): Promise<PaymentConfig[]> {
    try {
        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
            .from('payment_settings')
            .select('provider_name, config_key, config_value, is_active')
            .eq('provider_name', provider);

        if (error || !data) {
            return [];
        }

        return data.map(row => ({
            providerName: row.provider_name,
            configKey: row.config_key,
            configValue: row.config_value,
            isActive: row.is_active,
        }));
    } catch (error) {
        console.error('Error fetching provider configs:', error);
        return [];
    }
}

/**
 * Check if a payment provider is active
 */
export async function isProviderActive(provider: string): Promise<boolean> {
    try {
        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
            .from('payment_settings')
            .select('is_active')
            .eq('provider_name', provider)
            .limit(1)
            .single();

        if (error || !data) {
            return false;
        }

        return data.is_active;
    } catch (error) {
        return false;
    }
}

/**
 * Clear the config cache (call after updates)
 */
export function clearConfigCache(): void {
    configCache.clear();
}

/**
 * Get VNPay configuration with fallbacks
 */
export async function getVNPayConfig() {
    const [tmnCode, hashSecret, url, returnUrl] = await Promise.all([
        getPaymentConfig('vnpay', 'VNP_TMNCODE', 'VNP_TMNCODE'),
        getPaymentConfig('vnpay', 'VNP_HASHSECRET', 'VNP_HASHSECRET'),
        getPaymentConfig('vnpay', 'VNP_URL', 'VNP_URL'),
        getPaymentConfig('vnpay', 'VNP_RETURNURL', 'VNP_RETURNURL'),
    ]);

    return {
        tmnCode: tmnCode || '',
        hashSecret: hashSecret || '',
        url: url || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        returnUrl: returnUrl || '/payment/vnpay_return',
    };
}

/**
 * Get Bank Transfer configuration
 */
export async function getBankConfig() {
    const [name, accountNumber, accountName, branch, bin] = await Promise.all([
        getPaymentConfig('bank', 'BANK_NAME'),
        getPaymentConfig('bank', 'BANK_ACCOUNT_NUMBER'),
        getPaymentConfig('bank', 'BANK_ACCOUNT_NAME'),
        getPaymentConfig('bank', 'BANK_BRANCH'),
        getPaymentConfig('bank', 'BANK_BIN'),
    ]);

    return {
        bankName: name || 'Vietcombank',
        accountNumber: accountNumber || '',
        accountName: accountName || '',
        branch: branch || '',
        bin: bin || '970436',
    };
}

/**
 * Generate VietQR URL for bank transfer
 */
export async function generateVietQRUrl(amount: number, description: string): Promise<string> {
    const config = await getBankConfig();

    if (!config.accountNumber) {
        throw new Error('Bank account not configured');
    }

    // VietQR format: https://img.vietqr.io/image/{BIN}-{ACCOUNT}-{TEMPLATE}.png?amount={AMOUNT}&addInfo={DESC}
    const template = 'compact2';
    const encodedDesc = encodeURIComponent(description);

    return `https://img.vietqr.io/image/${config.bin}-${config.accountNumber}-${template}.png?amount=${amount}&addInfo=${encodedDesc}&accountName=${encodeURIComponent(config.accountName)}`;
}
