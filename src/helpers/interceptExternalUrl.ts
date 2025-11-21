import { parseUrl, safeUnreachable } from '@dimensiondev/utils';

import { ExternalSiteDomain, Source } from '@/constants/enum.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { matchDomainSuffix } from '@/helpers/matchDomainSuffix.js';
import { openWindow } from '@/helpers/openWindow.js';
import { LoginModalRef } from '@/modals/LoginModal/index.js';
import { FarcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import { getArticleIdFromUrl } from '@/services/getArticleIdFromUrl.js';
import { useFarcasterProfileStore } from '@/store/useProfileStore/useFarcasterProfileStore.js';

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
            const embeds = parsedURL.searchParams.getAll('embeds[]');
            const text = parsedURL.searchParams.get('text');
            const channelKey = parsedURL.searchParams.get('channelKey');
            const parentCastHash = parsedURL.searchParams.get('parentCastHash');
            const isLoginFarcaster = !!useFarcasterProfileStore.getState().currentProfile;

            if (!isLoginFarcaster) {
                LoginModalRef.open({
                    source: Source.Farcaster,
                });
                return true;
            }

            const channel = channelKey ? await FarcasterSocialMediaProvider.getChannelById(channelKey) : undefined;
            const parentPost = parentCastHash
                ? await FarcasterSocialMediaProvider.getPostById(parentCastHash)
                : undefined;

            // dynamic import to avoid circular dependency
            const { ComposeModalRef } = await import('@/modals/ComposeModal.js');

            ComposeModalRef.open({
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
            return formatFarcasterUrl(parsedURL);
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
