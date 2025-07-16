import type { NextRequest } from 'next/server.js';

import { KeyType } from '@/constants/enum.js';
import { createErrorResponseJSON, createSuccessResponseJSON } from '@/helpers/createResponseJSON.js';
import { getGatewayErrorMessage } from '@/helpers/getGatewayErrorMessage.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { OpenGraphProcessor } from '@/providers/og/Processor.js';

const digestLinkRedis = memoizeWithRedis(OpenGraphProcessor.digestDocumentUrl, {
    key: KeyType.DigestOpenGraphLink,
    resolver: (link) => link,
});

export async function DELETE(request: NextRequest) {
    const link = request.nextUrl.searchParams.get('link');
    if (!link) return createErrorResponseJSON('Missing link', { status: 400 });

    await digestLinkRedis.cache.delete(link);
    return createSuccessResponseJSON(null);
}

/* cspell:ignore takocdn */
const patterns = [
    /opensea\.io\/assets\/(0x[\dA-Fa-f]{40})\/(\d+)/,
    /opensea\.io\/assets\/(\w+)\/(0x[\dA-Fa-f]{40})\/(\d+)/,
    /rarible\.com\/token\/(0x[\dA-Fa-f]{40}):(\d+)/,
    /zora\.co\/collections\/(0x[\dA-Fa-f]{40})\/\d+$/,
    /\/\/takocdn\.xyz\//,
    /\/\/lens\.xyz\//,
    /\.?firefly\.social\//,
    /\/\/(www\.)?youtube\.com\//,
];
export async function GET(request: NextRequest) {
    const link = request.nextUrl.searchParams.get('link');
    if (!link) return createErrorResponseJSON('Missing link', { status: 400 });

    if (patterns.some((x) => x.test(decodeURIComponent(link)))) {
        // For the time being, we do not support OG information capture for OpenSea links.
        return createErrorResponseJSON(`Unsupported link = ${link}`, { status: 400 });
    }

    try {
        const linkDigested = await digestLinkRedis(decodeURIComponent(link), request.signal);
        if (!linkDigested)
            return createErrorResponseJSON(`Unable to digest oembed link = ${link}`, {
                status: 502,
            });
        return createSuccessResponseJSON(linkDigested);
    } catch (error) {
        return createErrorResponseJSON(getGatewayErrorMessage(error), {
            status: 502,
        });
    }
}
