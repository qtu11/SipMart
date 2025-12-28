/**
 * Script to check code consistency across the project
 * Checks for:
 * - Consistent imports
 * - Consistent naming conventions
 * - Consistent error handling
 */

import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
  name: string;
  passed: boolean;
  issues: string[];
}

const checks: CheckResult[] = [];

// Check 1: Firebase Admin SDK usage in API routes
function checkAdminSDKUsage() {
  const apiDir = path.join(process.cwd(), 'app', 'api', 'admin');
  const issues: string[] = [];

  function checkFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if using client SDK in admin routes
    if (content.includes("from 'firebase/firestore'") && 
        content.includes("from '@/lib/firebase/config'")) {
      issues.push(`${filePath}: Using client SDK instead of Admin SDK`);
    }
    
    // Check if admin SDK is imported
    if (content.includes('/api/admin/') && 
        !content.includes('admin-cups') && 
        !content.includes('admin-stores') &&
        !content.includes('admin-config') &&
        (content.includes('createCup') || content.includes('getCup') || content.includes('addCupsToStore'))) {
      issues.push(`${filePath}: Should use Admin SDK functions`);
    }
  }

  function walkDir(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        checkFile(filePath);
      }
    }
  }

  walkDir(apiDir);

  checks.push({
    name: 'Firebase Admin SDK Usage',
    passed: issues.length === 0,
    issues,
  });
}

// Check 2: Consistent error handling
function checkErrorHandling() {
  const apiDir = path.join(process.cwd(), 'app', 'api');
  const issues: string[] = [];

  function checkFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for try-catch blocks
    if (content.includes('export async function') && !content.includes('catch')) {
      issues.push(`${filePath}: Missing error handling`);
    }
  }

  function walkDir(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file === 'route.ts') {
        checkFile(filePath);
      }
    }
  }

  walkDir(apiDir);

  checks.push({
    name: 'Error Handling',
    passed: issues.length === 0,
    issues,
  });
}

// Check 3: Environment variables
function checkEnvVars() {
  const issues: string[] = [];
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_ADMIN_KEY',
    'NEXT_PUBLIC_ADMIN_PASSWORD',
  ];

  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    issues.push('.env.local file not found');
  } else {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const varName of requiredVars) {
      if (!envContent.includes(varName)) {
        issues.push(`Missing environment variable: ${varName}`);
      }
    }
  }

  checks.push({
    name: 'Environment Variables',
    passed: issues.length === 0,
    issues,
  });
}

// Run all checks
console.log('🔍 Running code consistency checks...\n');

checkAdminSDKUsage();
checkErrorHandling();
checkEnvVars();

// Print results
let allPassed = true;
for (const check of checks) {
  if (check.passed) {
    console.log(`✅ ${check.name}`);
  } else {
    console.log(`❌ ${check.name}`);
    allPassed = false;
    for (const issue of check.issues) {
      console.log(`   - ${issue}`);
    }
  }
}

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ All checks passed!');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please review the issues above.');
  process.exit(1);
}

