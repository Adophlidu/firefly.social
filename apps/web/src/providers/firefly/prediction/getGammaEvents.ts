import type { Locale } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { PolymarketEventListData, Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export const GAMMA_EVENTS_PAGE_SIZE = 20;

export interface GetGammaEventsOptions {
    /** Filter by a single tag slug. Mutually exclusive with {@link tag_id}. */
    tag_slug?: string;
    /**
     * Intersect tags server-side. Crypto period/sub-tabs pass the period/feature tag plus the
     * `crypto` tag; with {@link tag_match} `= 'all'` the gamma `/events` endpoint ANDs them (verified
     * live). Emitted as repeated `tag_id` keys — urlcat mangles arrays into `tag_id[0]=…`, which the
     * gamma filter does not AND.
     */
    tag_id?: number[];
    /** AND/OR mode for {@link tag_id}. Defaults to `'all'` (AND); `'any'`/absent is OR upstream. */
    tag_match?: string;
    limit?: number;
    offset?: number;
    /** Defaults to `true` (open markets only). */
    active?: boolean;
    /** Defaults to `false` (excludes resolved markets). */
    closed?: boolean;
    archived?: boolean;
    order?: string;
    ascending?: boolean;
    /**
     * Exclude tag(s) — emitted as repeated `exclude_tag_id` keys. Sports passes a single ID string;
     * the crypto tabs pass a `number[]` (e.g. Pre-Market excludes `ipos`, Quick Buy excludes `etf`).
     */
    exclude_tag_id?: number | number[] | string;
    locale?: Locale;
    /**
     * Hide events whose endDate already passed (ISO date-time) — filters zombie recurring markets
     * (e.g. daily ETF flows) that gamma leaves flagged `active` long after their window.
     */
    end_date_min?: string;
}

/**
 * Build the gamma `/events` query with URLSearchParams so array params (`tag_id`, `exclude_tag_id`)
 * are emitted as repeated keys. urlcat mangles arrays into `param[0]=…`, which gamma ignores for tag
 * intersection/exclusion — so every call goes through this builder.
 */
function buildGammaEventsQuery(options: {
    tag_slug?: string;
    tag_id?: number[];
    tag_match?: string;
    limit: number;
    offset: number;
    active: boolean;
    closed: boolean;
    archived: boolean;
    order: string;
    ascending: boolean;
    exclude_tag_id?: number | number[] | string;
    end_date_min?: string;
    locale?: Locale;
}): string {
    const search = new URLSearchParams();
    search.set('limit', String(options.limit));
    search.set('offset', String(options.offset));
    search.set('active', String(options.active));
    search.set('closed', String(options.closed));
    search.set('archived', String(options.archived));
    search.set('order', options.order);
    search.set('ascending', String(options.ascending));
    if (options.end_date_min) search.set('end_date_min', options.end_date_min);
    if (options.locale) search.set('locale', String(options.locale));

    // Tag filter: intersect tag_id[] under tag_match, OR a single tag_slug. (Repeated tag_slug is OR
    // and the big crypto set swamps the period — verified — so tag_id + tag_match is the only way to
    // intersect two tags.)
    if (options.tag_id && options.tag_id.length > 0) {
        for (const id of options.tag_id) search.append('tag_id', String(id));

        search.set('tag_match', options.tag_match ?? 'all');
    } else if (options.tag_slug) {
        search.set('tag_slug', options.tag_slug);
    }

    const excludeIds =
        options.exclude_tag_id === undefined
            ? []
            : Array.isArray(options.exclude_tag_id)
              ? options.exclude_tag_id
              : [options.exclude_tag_id];
    for (const id of excludeIds) search.append('exclude_tag_id', String(id));

    return search.toString();
}

export async function getGammaEvents({
    tag_slug,
    tag_id,
    tag_match,
    limit = GAMMA_EVENTS_PAGE_SIZE,
    offset = 0,
    active = true,
    closed = false,
    archived = false,
    order = 'volume',
    ascending = false,
    exclude_tag_id,
    end_date_min,
    locale,
}: GetGammaEventsOptions): Promise<PolymarketEventListData[]> {
    const url = `${urlcat(settings.FIREFLY_ROOT_URL, '/v1/polymarket/gamma/events')}?${buildGammaEventsQuery({
        tag_slug,
        tag_id,
        tag_match,
        limit,
        offset,
        active,
        closed,
        archived,
        order,
        ascending,
        exclude_tag_id,
        end_date_min,
        locale,
    })}`;
    const response = await fetchJson<Response<PolymarketEventListData[]>>(url, {
        method: 'GET',
    });
    const data = resolveFireflyResponseData(response);

    return Array.isArray(data) ? data : [];
}
