import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { type PoapHoldersResponse } from '@/providers/types/NFTs.js';
import { settings } from '@/settings/index.js';

export async function getPoapHolders(eventId: string, indicator?: PageIndicator) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/nft/poap/holder', {
        eventId,
        limit: 20,
        offset: indicator?.id || undefined,
    });
    const response = await fetchJson<PoapHoldersResponse>(url);
    const nextOffset = response.data.tokens.length ? response.data.limit + response.data.offset : undefined;
    return createPageable(
        response.data.tokens,
        indicator,
        nextOffset ? createNextIndicator(indicator, nextOffset.toString()) : undefined,
    );
}
