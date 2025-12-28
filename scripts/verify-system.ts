#!/usr/bin/env ts-node
/**
 * System Verification Script
 * Kiểm tra toàn bộ hệ thống trước khi deploy
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps } from 'firebase/app';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const results: CheckResult[] = [];

function addResult(name: string, status: 'pass' | 'fail' | 'warning', message: string) {
  results.push({ name, status, message });
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${message}`);
}

// 1. Check Firebase Configuration
function checkFirebase() {
  console.log('\n📱 Checking Firebase Configuration...');
  
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];

  const missing: string[] = [];
  const config: any = {};

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value === 'undefined') {
      missing.push(varName);
    } else {
      config[varName.replace('NEXT_PUBLIC_FIREBASE_', '').toLowerCase()] = value;
    }
  }

  if (missing.length > 0) {
    addResult('Firebase Config', 'fail', `Missing: ${missing.join(', ')}`);
    return false;
  }

  // Try to initialize Firebase
  try {
    if (getApps().length === 0) {
      initializeApp(config);
    }
    addResult('Firebase Config', 'pass', 'All variables set and initialized');
    return true;
  } catch (error: any) {
    addResult('Firebase Config', 'fail', `Initialization error: ${error.message}`);
    return false;
  }
}

// 2. Check Supabase Configuration
function checkSupabase() {
  console.log('\n🗄️  Checking Supabase Configuration...');
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    addResult('Supabase Config', 'fail', 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return false;
  }

  if (!serviceKey) {
    addResult('Supabase Config', 'warning', 'SUPABASE_SERVICE_ROLE_KEY not set (RLS policies will apply)');
  }

  // Try to create client
  try {
    const supabase = createClient(url, anonKey);
    addResult('Supabase Config', 'pass', 'Client created successfully');
    
    // Test connection
    return supabase;
  } catch (error: any) {
    addResult('Supabase Config', 'fail', `Client creation error: ${error.message}`);
    return null;
  }
}

// 3. Check Supabase Database Schema
async function checkSupabaseSchema(supabase: any) {
  console.log('\n📊 Checking Supabase Database Schema...');
  
  if (!supabase) {
    addResult('Supabase Schema', 'fail', 'Cannot check - Supabase client not available');
    return false;
  }

  const requiredTables = ['users', 'cups', 'stores', 'transactions', 'admins', 'notifications', 'stories'];
  const missing: string[] = [];

  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error && error.code === '42P01') { // Table doesn't exist
        missing.push(table);
      } else if (error && error.code !== 'PGRST116') { // PGRST116 = no rows, which is OK
        addResult(`Table: ${table}`, 'warning', `Error: ${error.message}`);
      } else {
        addResult(`Table: ${table}`, 'pass', 'Exists');
      }
    } catch (error: any) {
      addResult(`Table: ${table}`, 'warning', `Check failed: ${error.message}`);
    }
  }

  if (missing.length > 0) {
    addResult('Supabase Schema', 'fail', `Missing tables: ${missing.join(', ')}`);
    addResult('Supabase Schema', 'warning', 'Run supabase/setup_complete.sql in Supabase SQL Editor');
    return false;
  }

  addResult('Supabase Schema', 'pass', 'All required tables exist');
  return true;
}

// 4. Check App Configuration
function checkAppConfig() {
  console.log('\n⚙️  Checking App Configuration...');
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const depositAmount = process.env.NEXT_PUBLIC_DEPOSIT_AMOUNT;
  const borrowDuration = process.env.NEXT_PUBLIC_BORROW_DURATION_HOURS;

  if (!appUrl) {
    addResult('App Config', 'warning', 'NEXT_PUBLIC_APP_URL not set');
  } else {
    addResult('App Config', 'pass', `App URL: ${appUrl}`);
  }

  if (!depositAmount) {
    addResult('App Config', 'warning', 'NEXT_PUBLIC_DEPOSIT_AMOUNT not set');
  } else {
    addResult('App Config', 'pass', `Deposit: ${depositAmount} VND`);
  }

  if (!borrowDuration) {
    addResult('App Config', 'warning', 'NEXT_PUBLIC_BORROW_DURATION_HOURS not set');
  } else {
    addResult('App Config', 'pass', `Borrow duration: ${borrowDuration} hours`);
  }

  return true;
}

// 5. Check Admin Credentials
function checkAdminCredentials() {
  console.log('\n🔐 Checking Admin Credentials...');
  
  const adminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY;
  const adminPassword = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  if (!adminKey || !adminPassword) {
    addResult('Admin Credentials', 'warning', 'Admin credentials not set (admin features may not work)');
    return false;
  }

  addResult('Admin Credentials', 'pass', 'Admin credentials configured');
  return true;
}

// 6. Check Optional Services
function checkOptionalServices() {
  console.log('\n🔧 Checking Optional Services...');
  
  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!googleMapsKey) {
    addResult('Google Maps', 'warning', 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set (map features will not work)');
  } else {
    addResult('Google Maps', 'pass', 'API key configured');
  }

  if (!resendKey) {
    addResult('Resend Email', 'warning', 'RESEND_API_KEY not set (emails will not send)');
  } else {
    addResult('Resend Email', 'pass', 'API key configured');
  }

  if (!geminiKey) {
    addResult('Gemini AI', 'warning', 'GEMINI_API_KEY not set (chat AI will not work)');
  } else {
    addResult('Gemini AI', 'pass', 'API key configured');
  }

  return true;
}

// Main verification
async function main() {
  console.log('🔍 CupSipSmart System Verification\n');
  console.log('=' .repeat(50));

  // Run all checks
  const firebaseOk = checkFirebase();
  const supabase = checkSupabase();
  await checkSupabaseSchema(supabase);
  checkAppConfig();
  checkAdminCredentials();
  checkOptionalServices();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📋 Summary:');
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);

  if (failed > 0) {
    console.log('\n❌ System verification FAILED. Please fix the errors above.');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('\n⚠️  System verification passed with warnings. Review warnings above.');
    process.exit(0);
  } else {
    console.log('\n✅ System verification PASSED. Ready to deploy!');
    process.exit(0);
  }
}

// Cuối file scripts/verify-system.ts
import { fileURLToPath } from 'url';

const isMain = process.argv[1] === fileURLToPath(import.meta.url) || 
               process.argv[1]?.endsWith('verify-system.ts');

if (isMain) {
  main().catch((error) => {
    console.error('❌ Verification script error:', error);
    process.exit(1);
  });
}