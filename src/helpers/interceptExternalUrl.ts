import { parseUrl, safeUnreachable } from '@dimensiondev/utils';

import { ExternalSiteDomain, Source } from '@/constants/enum.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { getSiteTypeFromUrl } from '@/helpers/getSiteTypeFromUrl.js';
import { openWindow } from '@/helpers/openWindow.js';
import { LoginModalRef } from '@/modals/LoginModal/index.js';
import { farcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import { getArticleIdFromUrl } from '@/services/getArticleIdFromUrl.js';
import { useFarcasterProfileStore } from '@/store/useProfileStore/useFarcasterProfileStore.js';

async function interceptFarcasterUrl(u: URL) {
    switch (u.pathname) {
        case '/~/compose': {
            const embeds = u.searchParams.getAll('embeds[]');
            const text = u.searchParams.get('text');
            const channelKey = u.searchParams.get('channelKey');
            const parentCastHash = u.searchParams.get('parentCastHash');
            const isLoginFarcaster = !!useFarcasterProfileStore.getState().currentProfile;

            if (!isLoginFarcaster) {
                LoginModalRef.open({
                    source: Source.Farcaster,
                });
                return true;
            }

            const channel = channelKey ? await farcasterSocialMediaProvider.getChannelById(channelKey) : undefined;
            const parentPost = parentCastHash
                ? await farcasterSocialMediaProvider.getPostById(parentCastHash)
                : undefined;

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
