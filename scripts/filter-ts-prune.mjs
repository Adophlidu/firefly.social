#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

const inputFile = process.argv[2] || 'ts-prune.log';
const outputFile = process.argv[3] || 'ts-prune-filtered.log';

// Read the input file
const content = readFileSync(inputFile, 'utf-8');
const lines = content.split('\n').filter((line) => line.trim());

/**
 * Check if a file path matches any whitelist rule
 * @param {string} filePath - The file path (e.g., "src/middleware.ts")
 * @returns {boolean} - True if the path should be whitelisted
 */
function isWhitelisted(filePath) {
    const [pathnameIndicator, exports] = filePath.split(' : ');
    const [pathname, line] = pathnameIndicator.split(':');

    // Specific file paths
    const whitelistedFiles = [
        '.storybook/main.ts',
        '.next/types/routes.d.ts',
        'src/constants/mentions.ts',
        'src/helpers/attemptUntil.ts',
        'src/helpers/fetchJson.ts',
        'src/libs/parseHtmlNative.ts',
        'src/libs/LoggerNative.ts',
        'src/helpers/q.ts',
        'src/proxy.ts',
        'src/types/ethereum.ts',
    ];
    if (whitelistedFiles.includes(pathname)) return true;

    // Paths containing dist/
    if (pathname.includes('/dist/') || pathname.startsWith('dist/')) return true;

    // Files ending with specific patterns
    if (pathname.endsWith('stories.tsx')) return true;
    if (pathname.endsWith('metadata.ts')) return true;
    if (pathname.endsWith('robots.ts')) return true;
    if (pathname.endsWith('default.tsx')) return true;
    if (pathname.endsWith('layout.tsx')) return true;
    if (pathname.endsWith('route.ts') || pathname.endsWith('route.tsx')) return true;
    if (pathname.endsWith('not-found.tsx')) return true;
    if (pathname.endsWith('error.tsx')) return true;
    if (pathname.endsWith('page.tsx')) return true;
    if (pathname.endsWith('loading.tsx')) return true;
    if (pathname.endsWith('messages.ts')) return true;

    return false;
}

// Filter lines based on whitelist rules
const filteredLines = lines.filter((line) => {
    // Skip lines ending with "(used in module)"
    if (line.includes('(used in module)')) {
        return false; // Don't include in filtered output (it's whitelisted)
    }

    // Extract file path from line (format: "filepath:line - exportName")
    const match = line.match(/^([^:]+):/);
    if (!match) {
        // If we can't parse the line, include it in filtered output (to be safe)
        return true;
    }

    const filePath = match[1];

    // If file is whitelisted, don't include in filtered output
    if (isWhitelisted(filePath)) {
        return false;
    }

    // Otherwise, include in filtered output (it's a violation)
    return true;
});

// Write filtered output
writeFileSync(outputFile, filteredLines.join('\n') + (filteredLines.length > 0 ? '\n' : ''));

// Log the result (workflow will check the file and exit)
if (filteredLines.length > 0) {
    console.error(`Found ${filteredLines.length} unused exports after filtering`);
} else {
    console.log('No unused exports found (after filtering)');
}
