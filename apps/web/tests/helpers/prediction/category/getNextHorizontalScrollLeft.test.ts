import { describe, expect, it } from 'vitest';

import { getNextHorizontalScrollLeft } from '@/helpers/prediction/category/getNextHorizontalScrollLeft.js';

describe('getNextHorizontalScrollLeft', () => {
    const metrics = {
        scrollLeft: 100,
        clientWidth: 400,
        scrollWidth: 1000,
    };

    it('scrolls right by 75% of viewport width', () => {
        expect(getNextHorizontalScrollLeft(metrics, 'right')).toBe(400);
    });

    it('scrolls left by 75% of viewport width', () => {
        expect(getNextHorizontalScrollLeft(metrics, 'left')).toBe(0);
    });

    it('clamps right scroll at max scroll position', () => {
        expect(
            getNextHorizontalScrollLeft(
                {
                    scrollLeft: 550,
                    clientWidth: 400,
                    scrollWidth: 1000,
                },
                'right',
            ),
        ).toBe(600);
    });

    it('returns 0 when content fits without scrolling', () => {
        expect(
            getNextHorizontalScrollLeft(
                {
                    scrollLeft: 0,
                    clientWidth: 500,
                    scrollWidth: 500,
                },
                'right',
            ),
        ).toBe(0);
    });
});
