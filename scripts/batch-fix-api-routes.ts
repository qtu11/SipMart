#!/usr/bin/env node
/**
 * Automated script to batch fix all API routes
 * - Remove console.log/error statements
 * - Fix TypeScript 'any' types to 'unknown'
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const API_ROUTES_PATTERN = 'app/api/**/route.ts';

function fixApiRoute(filePath: string): { fixed: boolean; changes: string[] } {
    const content = readFileSync(filePath, 'utf-8');
    let newContent = content;
    const changes: string[] = [];

    // Fix 1: Replace catch (error: any) with catch (error: unknown)
    const anyTypeRegex = /catch\s*\(\s*error:\s*any\s*\)/g;
    if (anyTypeRegex.test(content)) {
        newContent = newContent.replace(anyTypeRegex, 'catch (error: unknown)');
        changes.push('Fixed TypeScript any type → unknown');
    }

    // Fix 2: Add type narrowing after catch if not present
    const catchBlockRegex = /catch\s*\(\s*error:\s*unknown\s*\)\s*\{[^}]*error\.message/g;
    if (catchBlockRegex.test(newContent) && !newContent.includes('const err = error as Error')) {
        newContent = newContent.replace(
            /catch\s*\(\s*error:\s*unknown\s*\)\s*\{/g,
            'catch (error: unknown) {\n    const err = error as Error;'
        );
        // Replace error.message with err.message
        newContent = newContent.replace(/error\.message/g, 'err.message');
        changes.push('Added type narrowing');
    }

    // Fix 3: Remove console.error statements
    const consoleErrorRegex = /\s*console\.error\([^)]*\);?\s*\n?/g;
    if (consoleErrorRegex.test(content)) {
        newContent = newContent.replace(consoleErrorRegex, '');
        changes.push('Removed console.error()');
    }

    // Fix 4: Remove console.log statements  
    const consoleLogRegex = /\s*console\.log\([^)]*\);?\s*\n?/g;
    if (consoleLogRegex.test(content)) {
        newContent = newContent.replace(consoleLogRegex, '');
        changes.push('Removed console.log()');
    }

    // Fix 5: Remove console.warn statements
    const consoleWarnRegex = /\s*console\.warn\([^)]*\);?\s*\n?/g;
    if (consoleWarnRegex.test(content)) {
        newContent = newContent.replace(consoleWarnRegex, '');
        changes.push('Removed console.warn()');
    }

    const fixed = content !== newContent;
    if (fixed) {
        writeFileSync(filePath, newContent, 'utf-8');
    }

    return { fixed, changes };
}

async function main() {
    console.log('🔍 Finding all API route files...');
    const files = await glob(API_ROUTES_PATTERN);

    console.log(`📝 Found ${files.length} API route files\n`);

    let fixedCount = 0;
    const results: Array<{ file: string; changes: string[] }> = [];

    for (const file of files) {
        const { fixed, changes } = fixApiRoute(file);
        if (fixed) {
            fixedCount++;
            results.push({ file, changes });
            console.log(`✅ ${file}`);
            changes.forEach(change => console.log(`   - ${change}`));
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total files scanned: ${files.length}`);
    console.log(`   Files fixed: ${fixedCount}`);
    console.log(`   No changes needed: ${files.length - fixedCount}`);

    if (results.length > 0) {
        console.log(`\n🎉 Successfully fixed ${fixedCount} files!`);
    } else {
        console.log(`\n✨ All files are already clean!`);
    }
}

main().catch(console.error);
