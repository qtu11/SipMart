import * as fs from 'fs';
import * as path from 'path';

interface FixResult {
    file: string;
    fixed: boolean;
    changes: string[];
}

function getAllTsFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Skip node_modules and .next
            if (file !== 'node_modules' && file !== '.next' && file !== 'dist') {
                getAllTsFiles(filePath, fileList);
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

function fixApiRoute(filePath: string): FixResult {
    const result: FixResult = {
        file: filePath,
        fixed: false,
        changes: [],
    };

    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;

    // Fix 1: Remove console.log statements (but keep in scripts/ and test files)
    if (!filePath.includes('scripts' + path.sep) && !filePath.includes('test-')) {
        const consoleLogMatch = content.match(/console\.log\([^)]*\);?/g);
        if (consoleLogMatch) {
            content = content.replace(/\s*console\.log\([^)]*\);?\r?\n?/g, '');
            result.changes.push(`Removed ${consoleLogMatch.length} console.log statements`);
        }
    }

    // Fix 2: Remove console.error statements (but keep in scripts/)
    if (!filePath.includes('scripts' + path.sep)) {
        const consoleErrorMatch = content.match(/console\.error\([^)]*\);?/g);
        if (consoleErrorMatch) {
            content = content.replace(/\s*console\.error\([^)]*\);?\r?\n?/g, '');
            result.changes.push(`Removed ${consoleErrorMatch.length} console.error statements`);
        }
    }

    // Fix 3: Replace 'error: any' with 'error: unknown' and proper type assertion
    if (content.includes('catch (error: any)')) {
        content = content.replace(
            /catch\s*\(error:\s*any\)\s*\{/g,
            'catch (error: unknown) {\n    const err = error as Error;'
        );
        // Update error.message references to err.message (but be careful with err.message already existing)
        content = content.replace(/\berror\.message\b/g, 'err.message');
        result.changes.push('Improved error type safety (any → unknown)');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        result.fixed = true;
    }

    return result;
}

async function main() {
    console.log('🔧 Starting comprehensive API route cleanup...\n');

    const cwd = process.cwd();

    // Get all .ts files from app/api and lib directories
    const apiFiles = fs.existsSync(path.join(cwd, 'app', 'api'))
        ? getAllTsFiles(path.join(cwd, 'app', 'api'))
        : [];

    const libFiles = fs.existsSync(path.join(cwd, 'lib'))
        ? getAllTsFiles(path.join(cwd, 'lib'))
        : [];

    const allFiles = [...apiFiles, ...libFiles];

    console.log(`📁 Found ${allFiles.length} TypeScript files to check\n`);

    const results: FixResult[] = [];

    for (const file of allFiles) {
        const result = fixApiRoute(file);

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
        console.log('\n✅ All API routes have been cleaned up!');
        console.log('   - Removed debug console statements');
        console.log('   - Improved error type safety');
        console.log('   - Standardized error handling');
    } else {
        console.log('\n✨ No changes needed - code is already clean!');
    }
}

main().catch(console.error);
