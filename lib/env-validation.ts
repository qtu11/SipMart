/**
 * Environment Variable Validation
 * Run on application startup to ensure all required vars are set
 */

const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

const requiredServerOnlyVars = [
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD',
    'CRON_SECRET',
] as const;

const optionalEnvVars = [
    'GEMINI_API_KEY',
    'VNP_HASH_SECRET',
    'VNP_URL',
    'VNP_RETURN_URL',
    'NEXT_PUBLIC_VNP_TMN_CODE',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_DEPOSIT_AMOUNT',
    'NEXT_PUBLIC_BORROW_DURATION_HOURS',
] as const;

interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export function validateEnvironment(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required public vars
    for (const varName of requiredEnvVars) {
        if (!process.env[varName]) {
            errors.push(`❌ Missing required environment variable: ${varName}`);
        }
    }

    // Check required server-only vars
    for (const varName of requiredServerOnlyVars) {
        if (!process.env[varName]) {
            errors.push(`❌ Missing required server-only variable: ${varName}`);
        }
    }

    // Check for banned public vars (security issue)
    const bannedPublicVars = [
        'NEXT_PUBLIC_ADMIN_KEY',
        'NEXT_PUBLIC_ADMIN_PASSWORD',
        'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY',
    ];

    for (const varName of bannedPublicVars) {
        if (process.env[varName]) {
            errors.push(
                `🚨 SECURITY ISSUE: ${varName} should NOT have NEXT_PUBLIC_ prefix! ` +
                `Remove it immediately - this exposes secrets to the browser!`
            );
        }
    }

    // Check optional vars (warnings only)
    for (const varName of optionalEnvVars) {
        if (!process.env[varName]) {
            warnings.push(`⚠️ Optional environment variable not set: ${varName}`);
        }
    }

    // Validate CRON_SECRET strength
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        if (cronSecret.length < 32) {
            errors.push('❌ CRON_SECRET is too short (minimum 32 characters required)');
        }
        if (cronSecret === 'your-secret-key') {
            errors.push('🚨 CRITICAL: CRON_SECRET is using default value! Change it immediately!');
        }
    }

    // Validate ADMIN_PASSWORD strength
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword) {
        if (adminPassword.length < 12) {
            errors.push('❌ ADMIN_PASSWORD is too short (minimum 12 characters recommended)');
        }
        if (adminPassword === 'qtusdev' || adminPassword === 'admin123') {
            errors.push('🚨 CRITICAL: ADMIN_PASSWORD is using weak default! Change it immediately!');
        }
    }

    // Validate URLs
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
        errors.push('❌ NEXT_PUBLIC_SUPABASE_URL must start with https://');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Print validation results to console
 */
export function printValidationResults(result: ValidationResult): void {
    console.log('\n🔍 Environment Variable Validation\n');

    if (result.valid) {
        console.log('✅ All required environment variables are set correctly!\n');
    } else {
        console.error('❌ Environment validation FAILED\n');
        console.error('Errors:');
        result.errors.forEach((error) => console.error(`  ${error}`));
        console.error('');
    }

    if (result.warnings.length > 0) {
        console.warn('Warnings:');
        result.warnings.forEach((warning) => console.warn(`  ${warning}`));
        console.warn('');
    }

    if (!result.valid) {
        console.error('Please fix the errors above before starting the application.\n');
        console.error('See ENV_SECURITY_UPDATE.md for setup instructions.\n');
    }
}

/**
 * Validate and throw error if invalid (for production)
 */
export function validateEnvironmentOrThrow(): void {
    const result = validateEnvironment();
    printValidationResults(result);

    if (!result.valid) {
        throw new Error(
            'Environment validation failed. Please check the errors above and update your .env.local file.'
        );
    }
}

// Auto-validate on import in development
if (process.env.NODE_ENV === 'development') {
    const result = validateEnvironment();
    printValidationResults(result);

    if (!result.valid && process.env.SKIP_ENV_VALIDATION !== 'true') {
        console.error('💡 To skip validation temporarily, set SKIP_ENV_VALIDATION=true\n');
        process.exit(1);
    }
}
