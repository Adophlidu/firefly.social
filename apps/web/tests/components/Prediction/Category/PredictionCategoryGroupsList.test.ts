import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('PredictionCategoryGroupsList', () => {
    it('opens the advance market from the rightmost probability button', () => {
        const source = readFileSync(
            resolve(process.cwd(), 'src/components/Prediction/Category/PredictionCategoryGroupsList.tsx'),
            'utf8',
        );

        expect(source).toContain('openPredictionPage');
        expect(source).toContain('advance_market_slug');
        expect(source).toContain('outcome: 0');
        expect(source).not.toContain('useAsyncFn');
        expect(source).not.toContain('loading=');
    });
});
