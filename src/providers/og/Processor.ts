import { parseUrl } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { MIRROR_HOSTNAME_REGEXP } from '@/constants/regexp.js';
import { FIREFLY_WORKER_HOST } from '@/constants/static.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getMirrorPayload } from '@/providers/og/readers/payload.js';
import { type LinkDigested, type OpenGraph } from '@/types/og.js';
import type { ResponseJson } from '@/types/utility.js';

class Processor {
    digestDocumentUrl = async (documentUrl: string, signal?: AbortSignal): Promise<LinkDigested | null> => {
        const url = parseUrl(documentUrl);
        if (!url) return null;

        const response = await fetchJson<ResponseJson<{ og: OpenGraph }>>(
            urlcat(FIREFLY_WORKER_HOST, '/oembed', {
                link: url.toString(),
            }),
            {
                signal,
            },
        );
        if (!response.success) return null;

        const { og } = response.data;

        if (MIRROR_HOSTNAME_REGEXP.test(url.hostname)) {
            return {
                og,
                payload: getMirrorPayload(document),
            };
        }

        return {
            og,
        };
    };
}

export const OpenGraphProcessor = new Processor();
