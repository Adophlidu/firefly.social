import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const globalsCss = readFileSync(fileURLToPath(new URL('../../src/globals.css', import.meta.url)), 'utf8');

describe('wallet theme class contract', () => {
    it('uses explicit theme classes instead of an independent media-query theme', () => {
        expect(globalsCss).not.toContain('@media (prefers-color-scheme: dark)');
        expect(globalsCss).toContain('.light {');
        expect(globalsCss).toContain('.dark {');
    });
});
