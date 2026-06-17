import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

/** A single FIFA live stream source. */
export interface FifaLiveStreamItem {
    name: string;
    title: string;
    url: string;
}

/**
 * FIFA World Cup live stream sources (shared across all FIFA games).
 *
 * The payload also carries legacy flat `key -> url` pairs alongside `items`;
 * `items` is the source of truth and provides display titles.
 */
export interface FifaLiveStreams {
    items?: FifaLiveStreamItem[];
}

/** FIFA World Cup live stream sources, normalized to an `items` list. */
export async function getFifaLiveStreams(): Promise<FifaLiveStreamItem[]> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/setting/ffwc/live-streams');
    const response = await fetchJson<Response<FifaLiveStreams | null>>(url);
    const data = resolveFireflyResponseData(response);
    return data?.items?.filter((item) => typeof item?.url === 'string' && !!item.url.trim()) ?? [];
}
