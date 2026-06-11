import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('PredictionCategoryPage', () => {
    it('uses a stable games query-state default while category context is loading', () => {
        const source = readFileSync(
            resolve(process.cwd(), 'src/components/Prediction/Category/PredictionCategoryPage.tsx'),
            'utf8',
        );

        expect(source).toContain('.withDefault(PREDICTION_CATEGORY_GAMES_TAB)');
        expect(source).not.toContain('.withDefault(defaultTab)');
    });
});
