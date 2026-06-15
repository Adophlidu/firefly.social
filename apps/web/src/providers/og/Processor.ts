import { parseUrl } from '@dimensiondev/utils';
import { oembedWorker } from '@dimensiondev/workers-client';

import { MIRROR_HOSTNAME_REGEXP } from '@/constants/regexp.js';
import { getMirrorPayload } from '@/providers/og/readers/payload.js';
import type { LinkDigested, OpenGraph } from '@/types/og.js';
import type { ResponseJson } from '@/types/utility.js';

class Processor {
    digestDocumentUrl = async (documentUrl: string, signal?: AbortSignal): Promise<LinkDigested | null> => {
        const url = parseUrl(documentUrl);
        if (!url) return null;

        const res = await oembedWorker.oembed.$get({ query: { link: url.toString() } }, { init: { signal } });
        const response = (await res.json()) as ResponseJson<{ og: OpenGraph }>;
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
