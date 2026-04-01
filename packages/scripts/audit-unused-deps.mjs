import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { findRepoRoot } from './repo-root.cjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = findRepoRoot(__dirname);

// Read package.json
const pkgJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));

// Get all dependencies
const allDeps = {
    ...(pkgJson.dependencies || {}),
    ...(pkgJson.devDependencies || {}),
};

// Dependencies that might be used in config files or build scripts
const configDeps = new Set([
    '@next/bundle-analyzer',
    '@statoscope/webpack-plugin',
    '@svgr/webpack',
    '@tailwindcss/forms',
    '@lingui/cli',
    '@lingui/conf',
    '@lingui/loader',
    '@lingui/swc-plugin',
    '@tolgee/cli',
    'autoprefixer',
    'postcss',
    'tailwindcss',
    'eslint',
    'eslint-config-next',
    'prettier',
    'prettier-plugin-tailwindcss',
    'vitest',
    '@testing-library/react',
    'storybook',
    '@storybook/addon-docs',
    '@storybook/nextjs-vite',
    '@storybook/react',
    'rollup',
    '@rollup/plugin-commonjs',
    '@rollup/plugin-node-resolve',
    'rollup-plugin-swc3',
    'rollup-plugin-terser',
    'vite',
    'vite-plugin-svgr',
    'svgo-loader',
    'cspell',
    'typescript',
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/parser',
    'eslint-plugin-import',
    'eslint-plugin-no-relative-import-paths',
    'eslint-plugin-react',
    'eslint-plugin-simple-import-sort',
    'eslint-plugin-storybook',
    'eslint-plugin-tailwindcss',
    'eslint-plugin-unicorn',
    'eslint-plugin-unused-imports',
    'buffer',
    'core-js-compat',
    'cross-fetch',
    '@types/node',
    '@types/react',
    '@types/react-dom',
]);

// Dependencies that might be used indirectly (peer deps, transitive deps)
const indirectDeps = new Set([
    'core-js', // polyfill, might be used via imports
    'thread-stream', // used by pino
]);

// Recursively get all files
function getAllFiles(dir, fileList = []) {
    const files = readdirSync(dir);

    for (const file of files) {
        const filePath = join(dir, file);
        const stat = statSync(filePath);

        if (stat.isDirectory()) {
            // Skip node_modules and other ignored directories
            if (!['node_modules', '.next', 'dist', '.git', '.vercel'].includes(file)) {
                getAllFiles(filePath, fileList);
            }
        } else {
            const ext = extname(file);
            if (['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css'].includes(ext)) {
                fileList.push(filePath);
            }
        }
    }

    return fileList;
}

// Check if a package is imported in file content
function checkFileForPackage(filePath, packageName) {
    try {
        const content = readFileSync(filePath, 'utf-8');

        // Escape special regex characters
        const escapedName = packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Search patterns - check for exact package name or subpath imports
        // e.g., "@heroicons/react" matches "@heroicons/react/24/solid"
        const patterns = [
            // Standard imports: from 'package' or from 'package/subpath'
            new RegExp(`from\\s+['"]${escapedName}(?:/|['"])`, 'g'),
            // Require statements
            new RegExp(`require\\(['"]${escapedName}(?:/|['"])`, 'g'),
            // Import statements
            new RegExp(`import\\s+.*['"]${escapedName}(?:/|['"])`, 'g'),
            // Dynamic imports
            new RegExp(`import\\(['"]${escapedName}(?:/|['"])`, 'g'),
            // Exact match in quotes (for config files)
            new RegExp(`['"]${escapedName}['"]`, 'g'),
        ];

        for (const pattern of patterns) {
            if (pattern.test(content)) {
                // Get line number
                const lines = content.split('\n');
                const lineNum = lines.findIndex((line) => pattern.test(line)) + 1;
                return { found: true, file: filePath, line: lineNum };
            }
        }

        return { found: false };
    } catch (error) {
        return { found: false, error: error.message };
    }
}

// Check if a package is used in the codebase
function checkPackageUsage(packageName) {
    const searchDirs = [join(rootDir, 'src'), join(rootDir, 'packages', 'scripts')];

    const configFiles = [
        'next.config.ts',
        'tailwind.config.cjs',
        'postcss.config.cjs',
        'lingui.config.js',
        'vitest.config.ts',
        'eslint.config.mjs',
        'tsconfig.json',
        'tsconfig.eslint.json',
    ].map((f) => join(rootDir, f));

    const allFiles = [];
    for (const dir of searchDirs) {
        try {
            allFiles.push(...getAllFiles(dir));
        } catch (e) {
            // Directory might not exist
        }
    }
    allFiles.push(
        ...configFiles.filter((f) => {
            try {
                return statSync(f).isFile();
            } catch {
                return false;
            }
        }),
    );

    const matches = [];
    for (const file of allFiles) {
        const result = checkFileForPackage(file, packageName);
        if (result.found) {
            matches.push(`${file}:${result.line || '?'}`);
            if (matches.length >= 5) break; // Limit matches
        }
    }

    return { used: matches.length > 0, matches };
}

// Analyze dependencies
const results = {
    used: [],
    unused: [],
    configOnly: [],
    indirect: [],
    errors: [],
};

console.log('Analyzing dependencies...\n');
const total = Object.keys(allDeps).length;
let current = 0;

for (const [depName, version] of Object.entries(allDeps)) {
    current++;
    process.stdout.write(`\rProgress: ${current}/${total} (${depName})`);

    // Skip workspace dependencies
    if (version.startsWith('workspace:')) {
        continue;
    }

    // Skip if it's a config-only dependency
    if (configDeps.has(depName)) {
        results.configOnly.push({ name: depName, version });
        continue;
    }

    // Skip if it's an indirect dependency
    if (indirectDeps.has(depName)) {
        results.indirect.push({ name: depName, version });
        continue;
    }

    const usage = checkPackageUsage(depName);

    if (usage.used) {
        results.used.push({ name: depName, version, matches: usage.matches });
    } else {
        results.unused.push({ name: depName, version });
    }
}

console.log('\n');

// Generate report
const report = {
    summary: {
        total: Object.keys(allDeps).length,
        used: results.used.length,
        unused: results.unused.length,
        configOnly: results.configOnly.length,
        indirect: results.indirect.length,
        errors: results.errors.length,
    },
    unused: results.unused.sort((a, b) => a.name.localeCompare(b.name)),
    configOnly: results.configOnly.sort((a, b) => a.name.localeCompare(b.name)),
    indirect: results.indirect.sort((a, b) => a.name.localeCompare(b.name)),
    errors: results.errors,
};

// Write report
const reportPath = join(rootDir, 'unused-dependencies-report.json');
writeFileSync(reportPath, JSON.stringify(report, null, 2));

// Print summary
console.log('='.repeat(60));
console.log('DEPENDENCY AUDIT SUMMARY');
console.log('='.repeat(60));
console.log(`Total dependencies: ${report.summary.total}`);
console.log(`Used in code: ${report.summary.used}`);
console.log(`Unused: ${report.summary.unused}`);
console.log(`Config/build tools: ${report.summary.configOnly}`);
console.log(`Indirect/peer deps: ${report.summary.indirect}`);
console.log(`Errors: ${report.summary.errors}`);
console.log('\n' + '='.repeat(60));
console.log('UNUSED DEPENDENCIES:');
console.log('='.repeat(60));

if (report.unused.length === 0) {
    console.log('None found!');
} else {
    report.unused.forEach(({ name, version }) => {
        console.log(`  - ${name}@${version}`);
    });
}

console.log('\n' + '='.repeat(60));
console.log(`Full report saved to: ${reportPath}`);
console.log('='.repeat(60));
