import * as fs from 'fs';
import * as path from 'path';

function removeConsoleLogs(dir: string) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                removeConsoleLogs(filePath);
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
            let content = fs.readFileSync(filePath, 'utf8');
            // Remove console.log but keep console.error/warn if needed, or remove all as requested
            // Regex handles optional semicolon and multiline logs
            const originalLength = content.length;

            // Remove console.log(...)
            content = content.replace(/console\.log\s*\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\);?/g, '');

            // Remove console.debug(...)
            content = content.replace(/console\.debug\s*\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\);?/g, '');

            if (content.length !== originalLength) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Cleaned ${filePath}`); // This is our script log, allowed
            }
        }
    }
}

removeConsoleLogs('c:\\Users\\Public\\Lập trình\\CupSipSmart\\app');
removeConsoleLogs('c:\\Users\\Public\\Lập trình\\CupSipSmart\\lib');
removeConsoleLogs('c:\\Users\\Public\\Lập trình\\CupSipSmart\\components');
removeConsoleLogs('c:\\Users\\Public\\Lập trình\\CupSipSmart\\hooks');
