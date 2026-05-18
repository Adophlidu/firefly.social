import { ExternalSiteDomain, Source } from '@dimensiondev/enums';
import { parseUrl, safeUnreachable } from '@dimensiondev/utils';

import { SORTED_SOCIAL_SOURCES } from '@/constants/computed.js';
import { getArticleIdFromUrl } from '@/helpers/getArticleIdFromUrl.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { getSiteTypeFromUrl } from '@/helpers/getSiteTypeFromUrl.js';
import { openWindow } from '@/helpers/openWindow.js';
import { logger } from '@/libs/Logger.js';
import { LoginModalRef } from '@/modals/LoginModal/refs.js';
import { getChannelById } from '@/providers/firefly/farcaster-hub/getChannelById.js';
import { getPostById } from '@/providers/firefly/farcaster-hub/getPostById.js';

async function interceptFarcasterUrl(u: URL) {
    switch (u.pathname) {
        case '/~/compose': {
            const embeds = u.searchParams.getAll('embeds[]');
            const text = u.searchParams.get('text');
            const channelKey = u.searchParams.get('channelKey');
            const parentCastHash = u.searchParams.get('parentCastHash');
            const isLoginFarcaster = !!getCurrentProfileFromStorage(Source.Farcaster);

            if (!isLoginFarcaster) {
                LoginModalRef.open({
                    source: Source.Farcaster,
                });
                return true;
            }

            const channel = channelKey ? await getChannelById(channelKey) : undefined;
            const parentPost = parentCastHash ? await getPostById(parentCastHash) : undefined;

            // dynamic import to avoid circular dependency
            const { openComposeModal } = await import('@/helpers/openComposeModal.js');

            openComposeModal({
                type: parentPost ? 'reply' : 'compose',
                chars: text ? [text] : undefined,
                source: [Source.Farcaster],
                channel,
                post: parentPost,
                embeds: embeds.length > 0 ? embeds : undefined,
                disabledSources: SORTED_SOCIAL_SOURCES.filter((source) => source !== Source.Farcaster),
            });
            return true;
        }
        case '/~/composer-action': {
            const actionUrl = parseUrl(u.searchParams.get('url') || '');
            const articleId = await getArticleIdFromUrl(actionUrl?.searchParams.get('url') || '');
            if (!articleId) return false;

            openWindow(`/article/${articleId}`);
            return true;
        }
        default:
            logger.warn(`[interceptFarcasterUrl] Unknown pathname: ${u.pathname}`);
            return false;
    }
}

export async function interceptExternalUrl(url: string) {
    const { siteType, parsedURL } = getSiteTypeFromUrl(url) ?? {};
    if (!siteType || !parsedURL) return false;

    switch (siteType) {
        case ExternalSiteDomain.Warpcast:
        case ExternalSiteDomain.Farcaster:
            return interceptFarcasterUrl(parsedURL);
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
