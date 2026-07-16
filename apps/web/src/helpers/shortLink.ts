import urlcat from 'urlcat';

import { FetchError } from '@/constants/error.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { Response } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

const SHORTLINK_CODE_PATTERN = /^[0-9A-Za-z]{12}$/;

export interface ShortLinkRecord {
    url: string;
}

/**
 * Resolves a Shortlink code via the backend (`GET /v1/shortlinks`, public —
 * no session required). The format guard runs before the network call so
 * junk paths never reach the backend.
 */
export async function getShortLink(code: string): Promise<ShortLinkRecord | null> {
    if (!SHORTLINK_CODE_PATTERN.test(code)) return null;

    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/shortlinks', { code });
    try {
        const response = await fetchJson<Response<ShortLinkRecord>>(url);
        return resolveFireflyResponseData(response);
    } catch (error) {
        if (error instanceof FetchError && error.status === 404) return null;
        throw error;
    }
}
