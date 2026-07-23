import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const workspaceRoot = fileURLToPath(new URL('../../../../', import.meta.url));

function sourceFiles(directory: string): string[] {
    return readdirSync(directory).flatMap((entry) => {
        const path = join(directory, entry);
        if (statSync(path).isDirectory()) return sourceFiles(path);
        return /\.[cm]?[jt]sx?$/.test(path) ? [path] : [];
    });
}

function perpsFeatureSource(app: 'web' | 'wallet') {
    const paths = sourceFiles(join(workspaceRoot, `apps/${app}/src`)).filter((path) =>
        /(?:\/Perps\/|\/perps(?:[./]))/i.test(path),
    );
    return paths.map((path) => readFileSync(path, 'utf8')).join('\n');
}

describe('Perpetuals i18n isolation boundary', () => {
    it.each(['web', 'wallet'] as const)('uses the %s app Lingui context for visible Perps copy', (app) => {
        const source = perpsFeatureSource(app);

        expect(source).toMatch(/@lingui\/(?:core|react)\/macro/); // ASSERTION (frozen)
        expect(source).not.toMatch(/from ['"]@lingui\/core['"]/); // ASSERTION (frozen) — no global singleton import
        expect(source).not.toMatch(/\bi18n\.(?:activate|load|loadAndActivate)\s*\(/); // ASSERTION (frozen)
    });

    it.each(['web', 'wallet'] as const)('does not import or initialize an rn-ui Lingui singleton in %s', (app) => {
        const source = perpsFeatureSource(app);

        expect(source).not.toMatch(/@dimensiondev\/rn-ui[^'"]*(?:i18n|lingui|locale)/i); // ASSERTION (frozen)
        expect(source).not.toMatch(/setup.*(?:RNUI|RnUi).*i18n/i); // ASSERTION (frozen)
    });
});
