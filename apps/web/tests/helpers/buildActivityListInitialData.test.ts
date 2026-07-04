import { createIndicator, createPageable } from '@dimensiondev/utils';
import { describe, expect, it } from 'vitest';

import { buildActivityListInitialData } from '@/helpers/buildActivityListInitialData.js';
import type { ActivityListItem } from '@/providers/types/Firefly.js';

function createActivity(id: number): ActivityListItem {
    return {
        id,
        name: `event-${id}`,
        title: `Event ${id}`,
        sub_title: '',
        description: '',
        url: `/event/event-${id}`,
        banner_url: '',
        cover_url: '',
        icon_url: '',
        ext: '',
        start_time: '2026-01-01T00:00:00.000Z',
        end_time: '2026-12-31T00:00:00.000Z',
        status: 1,
        web_banner_url: null,
    };
}

describe('buildActivityListInitialData', () => {
    it('limits the first SSR activity page', () => {
        const page = createPageable(
            Array.from({ length: 25 }, (_, index) => createActivity(index)),
            createIndicator(),
            createIndicator(undefined, '10'),
        );
        const initial = buildActivityListInitialData(page);

        expect(initial?.pages).toHaveLength(1);
        expect(initial?.pageParams).toEqual(['']);
        expect(initial?.pages[0]?.data).toHaveLength(10);
        expect(initial?.pages[0]?.nextIndicator).toEqual(page.nextIndicator);
    });

    it('returns undefined for an empty page', () => {
        expect(buildActivityListInitialData(createPageable([], createIndicator()))).toBeUndefined();
    });
});
