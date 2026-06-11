import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('PredictionCategoryGamesList', () => {
    it('renders games without show-more truncation controls', () => {
        const source = readFileSync(
            resolve(process.cwd(), 'src/components/Prediction/Category/PredictionCategoryGamesList.tsx'),
            'utf8',
        );

        expect(source).not.toContain('INITIAL_VISIBLE');
        expect(source).not.toContain('expandedSections');
        expect(source).not.toContain('Show more');
        expect(source).not.toContain('Show less');
    });
});
