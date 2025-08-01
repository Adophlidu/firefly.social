import { compact } from 'lodash-es';

import { ExternalSiteDomain, Source } from '@/constants/enum.js';
import { matchDomainSuffix } from '@/helpers/matchDomainSuffix.js';
import { openWindow } from '@/helpers/openWindow.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { ComposeModalRef } from '@/modals/controls.js';
import { getArticleIdFromUrl } from '@/services/getArticleIdFromUrl.js';

function parseSiteType(url: string) {
    return Object.values(ExternalSiteDomain).find((domain) => matchDomainSuffix(url, domain));
}

export function getUrlSiteType(url: string) {
    const siteType = parseSiteType(url);
    if (!siteType) return null;

    const parsedURL = parseUrl(url);
    if (!parsedURL) return null;

    return { siteType, parsedURL };
}

async function formatFarcasterUrl(parsedURL: URL) {
    switch (parsedURL.pathname) {
        case '/~/compose': {
            const embeds = parsedURL.searchParams.get('embeds[]');
            const text = parsedURL.searchParams.get('text');
            ComposeModalRef.open({
                type: 'compose',
                chars: [compact([text, embeds]).join('\n')],
                source: [Source.Farcaster],
            });
            return true;
        }
        case '/~/composer-action': {
            const actionUrl = parseUrl(parsedURL.searchParams.get('url') || '');
            const articleId = await getArticleIdFromUrl(actionUrl?.searchParams.get('url') || '');
            if (!articleId) return false;

            openWindow(`/article/${articleId}`);
            return true;
        }
        default:
            return false;
    }
}

export async function interceptExternalUrl(url: string) {
    const { siteType, parsedURL } = getUrlSiteType(url) ?? {};
    if (!siteType || !parsedURL) return false;

    switch (siteType) {
        case ExternalSiteDomain.Warpcast:
        case ExternalSiteDomain.Farcaster:
            return await formatFarcasterUrl(parsedURL);
        case ExternalSiteDomain.Twitter:
        case ExternalSiteDomain.X:
        case ExternalSiteDomain.Hey:
        case ExternalSiteDomain.Bsky:
            return false;
        default:
            safeUnreachable(siteType);
            return false;
    }
}
