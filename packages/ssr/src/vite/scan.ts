import { readdir } from 'node:fs/promises';
import path from 'node:path';

const ROUTE_FILE_PATTERN = /\.(?:[cm]?[jt]sx?)$/;
const IGNORED_FILE_PATTERN = /\.(?:test|spec)\.[cm]?[jt]sx?$/;

/**
 * Recursively list route files under a routes directory, as POSIX paths
 * relative to it, sorted for deterministic output. Missing directories
 * yield an empty list; dotfiles and test files are skipped.
 */
export async function scanRoutesDirectory(directory: string): Promise<string[]> {
    const results: string[] = [];

    async function walk(current: string): Promise<void> {
        const entries = await readdir(current, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith('.')) continue;
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                await walk(fullPath);
            } else if (ROUTE_FILE_PATTERN.test(entry.name) && !IGNORED_FILE_PATTERN.test(entry.name)) {
                results.push(path.relative(directory, fullPath).split(path.sep).join('/'));
            }
        }
    }

    try {
        await walk(directory);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
        throw error;
    }

    return results.sort();
}
