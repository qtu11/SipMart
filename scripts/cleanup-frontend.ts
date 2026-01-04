import * as fs from 'fs';
import * as path from 'path';

interface FixResult {
    file: string;
    fixed: boolean;
    changes: string[];
}

function getAllFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Skip node_modules, .next, dist
            if (file !== 'node_modules' && file !== '.next' && file !== 'dist') {
                getAllFiles(filePath, fileList);
            }
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

function fixFrontendFile(filePath: string): FixResult {
    const result: FixResult = {
        file: filePath,
        fixed: false,
        changes: [],
    };

    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;

    // Fix 1: Remove console.log statements (except useful debug info in development)
    // Keep console.error for now in frontend as it's useful for user-facing errors
    const consoleLogMatches = content.match(/console\.log\([^)]*\);?/g);
    if (consoleLogMatches) {
        // Only remove console.log, keep console.error/warn for frontend
        content = content.replace(/\s*console\.log\([^)]*\);?\r?\n?/g, '');
        result.changes.push(`Removed ${consoleLogMatches.length} console.log statements`);
    }

    // Fix 2: Replace 'error: any' with proper error typing
    if (content.includes('catch (error: any)') || content.includes('catch (error)')) {
        content = content.replace(
            /catch\s*\((error(?:: any)?)\)\s*\{/g,
            'catch (error: unknown) {\n      const err = error as Error;'
        );
        // Update error references
        content = content.replace(/\berror\.message\b/g, 'err.message');
        content = content.replace(/\berror\.code\b/g, '(err as any).code');
        result.changes.push('Improved error type safety');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        result.fixed = true;
    }

    return result;
}

async function main() {
    console.log('🔧 Starting frontend cleanup (app/ directory)...\n');

    const cwd = process.cwd();
    const appDir = path.join(cwd, 'app');

    if (!fs.existsSync(appDir)) {
        console.log('❌ app/ directory not found');
        return;
    }

    const allFiles = getAllFiles(appDir);

    console.log(`📁 Found ${allFiles.length} React files to check\n`);

    const results: FixResult[] = [];

    for (const file of allFiles) {
        const result = fixFrontendFile(file);

        if (result.fixed) {
            const relativePath = path.relative(cwd, file);
            console.log(`✅ Fixed: ${relativePath}`);
            result.changes.forEach(change => console.log(`   - ${change}`));
        }

        results.push(result);
    }

    // Summary
    const fixedFiles = results.filter(r => r.fixed);
    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   Total files checked: ${results.length}`);
    console.log(`   Files modified: ${fixedFiles.length}`);
    console.log(`   Files unchanged: ${results.length - fixedFiles.length}`);

    if (fixedFiles.length > 0) {
        console.log('\n✅ Frontend cleanup completed!');
        console.log('   - Removed console.log statements');
        console.log('   - Improved error type safety');
        console.log('   - Kept console.error for user debugging');
    } else {
        console.log('\n✨ No changes needed - frontend code is clean!');
    }
}

main().catch(console.error);
