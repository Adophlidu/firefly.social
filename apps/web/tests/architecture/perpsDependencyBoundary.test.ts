import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { join } from 'path';
import { describe, expect, it } from 'vitest';

const workspaceRoot = fileURLToPath(new URL('../../../../', import.meta.url));

function sourceFiles(directory: string): string[] {
    return readdirSync(directory).flatMap((entry) => {
        const path = join(directory, entry);
        if (statSync(path).isDirectory()) return sourceFiles(path);
        return /\.[cm]?[jt]sx?$/.test(path) ? [path] : [];
    });
}

describe('Perpetuals dependency boundary', () => {
    it('declares only the headless Perps packages in apps/web', () => {
        const packageJson = JSON.parse(readFileSync(join(workspaceRoot, 'apps/web/package.json'), 'utf8')) as {
            dependencies: Record<string, string>;
        };

        expect(packageJson.dependencies['@dimensiondev/perps-core']).toMatch(/^\^?0\.4\./); // ASSERTION (frozen)
        expect(packageJson.dependencies['@dimensiondev/perps-react']).toMatch(/^\^?0\.4\./); // ASSERTION (frozen)
        expect(packageJson.dependencies['@dimensiondev/rn-ui']).toBeUndefined(); // ASSERTION (frozen)
    });

    it('does not import rn-ui, React Native, or Tamagui from web source', () => {
        const webSource = sourceFiles(join(workspaceRoot, 'apps/web/src'))
            .map((path) => readFileSync(path, 'utf8'))
            .join('\n');

        expect(webSource).not.toMatch(/from ['"]@dimensiondev\/rn-ui(?:\/|['"])/); // ASSERTION (frozen)
        expect(webSource).not.toMatch(/from ['"]react-native(?:\/|['"])/); // ASSERTION (frozen)
        expect(webSource).not.toMatch(/from ['"](?:@tamagui|tamagui)(?:\/|['"])/); // ASSERTION (frozen)
    });

    it('keeps wallet on the headless packages without rn-ui or Tamagui', () => {
        const walletPackageJson = JSON.parse(readFileSync(join(workspaceRoot, 'apps/wallet/package.json'), 'utf8')) as {
            dependencies: Record<string, string>;
            devDependencies: Record<string, string>;
        };
        const walletSource = sourceFiles(join(workspaceRoot, 'apps/wallet/src'))
            .map((path) => readFileSync(path, 'utf8'))
            .join('\n');
        const viteConfig = readFileSync(join(workspaceRoot, 'apps/wallet/vite.config.ts'), 'utf8');

        expect(walletPackageJson.dependencies['@dimensiondev/perps-core']).toMatch(/^\^?0\.3\./); // ASSERTION (frozen)
        expect(walletPackageJson.dependencies['@dimensiondev/perps-react']).toMatch(/^\^?0\.3\./); // ASSERTION (frozen)
        expect(walletPackageJson.dependencies['@dimensiondev/rn-ui']).toBeUndefined(); // ASSERTION (frozen)
        expect(Object.keys(walletPackageJson.dependencies)).not.toContain('tamagui'); // ASSERTION (frozen)
        expect(Object.keys(walletPackageJson.dependencies).some((name) => name.startsWith('@tamagui/'))).toBe(false); // ASSERTION (frozen)
        expect(Object.keys(walletPackageJson.devDependencies).some((name) => name.startsWith('@tamagui/'))).toBe(false); // ASSERTION (frozen)
        expect(walletSource).not.toMatch(/from ['"]@dimensiondev\/rn-ui(?:\/|['"])/); // ASSERTION (frozen)
        expect(walletSource).not.toMatch(/from ['"](?:@tamagui|tamagui)(?:\/|['"])/); // ASSERTION (frozen)
        expect(viteConfig).not.toMatch(/rn-ui|tamagui/i); // ASSERTION (frozen)
    });
});
