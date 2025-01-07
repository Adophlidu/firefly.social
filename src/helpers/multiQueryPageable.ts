import { createIndicator, createPageable, type Pageable, type PageIndicator } from '@/helpers/pageable.js';
import { parseJSON } from '@/helpers/parseJSON.js';

export async function multiQueryPageable<K extends string, Item>(
    sources: K[],
    query: (source: K, indicatorId?: string) => Promise<Pageable<Item, PageIndicator>>,
    indicator?: PageIndicator,
): Promise<Pageable<Item, PageIndicator>> {
    type Indicator = Record<K, string>;
    const indicators = indicator ? (parseJSON(indicator.id) as Indicator | null) : null;
    const responses = await Promise.all(
        sources.map(async (source) => {
            const indicatorId = indicators?.[source];
            const pageable = await query(source, indicatorId).catch(() => createPageable([], createIndicator()));
            return {
                source,
                pageable,
            };
        }),
    );
    return responses.reduce(
        (acc, { source, pageable }) => {
            acc.data = [...acc.data, ...pageable.data];
            acc.total = (pageable.total ?? 0) + (acc.total ?? 0);
            if (!acc.nextIndicator) acc.nextIndicator = createIndicator();
            acc.nextIndicator.id = JSON.stringify({
                ...((parseJSON(acc.nextIndicator.id) ?? {}) as Indicator),
                [source]: pageable.nextIndicator?.id,
            } satisfies Indicator);
            return acc;
        },
        createPageable<Item>([], createIndicator(undefined)),
    );
}
