#!/usr/bin/env node
/**
 * Pre-start environment validation script
 * Run this before starting the Next.js app to ensure all env vars are set
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.resolve(rootDir, '.env.local') });
dotenv.config({ path: path.resolve(rootDir, '.env') });

import { validateEnvironmentOrThrow } from '../lib/env-validation.ts';

try {
    console.log('🚀 Running pre-start environment validation...\n');
    validateEnvironmentOrThrow();
    console.log('✅ Environment validation passed! Starting application...\n');
    process.exit(0);
} catch (error) {
    console.error('\n❌ Environment validation failed!\n');
    console.error(error instanceof Error ? error.message : String(error));
    console.error('\n📖 See ENV_SECURITY_UPDATE.md for setup instructions.\n');
    process.exit(1);
}
