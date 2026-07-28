import { ChannelTabType, SocialProfileCategory, WalletProfileCategory } from '@dimensiondev/enums';
import type { MiddlewareFn } from '@dimensiondev/ssr';
import urlcat from 'urlcat';

import { isFollowCategory } from '@/helpers/isFollowCategory.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { isProfilePageSource, isSocialSource } from '@/helpers/isSource.js';
import { parseClubUrl } from '@/helpers/parseClubUrl.js';
import { parseOldDiscoverUrl } from '@/helpers/parseDiscoverUrl.js';
import { parseOldEngagementUrl } from '@/helpers/parseEngagementUrl.js';
import { parseOldBookmarkUrl } from '@/helpers/parseOldBookmarkUrl.js';
import { parseOldCommunityUrl } from '@/helpers/parseOldCommunityUrl.js';
import { parseOldExploreUrl } from '@/helpers/parseOldExploreUrl.js';
import { parseOldFollowingUrl } from '@/helpers/parseOldFollowingUrl.js';
import { parseOldNotification } from '@/helpers/parseOldNotification.js';
import { parseOldSettingsUrl } from '@/helpers/parseOldSettingsUrl.js';
import { parseOldSwapUrl } from '@/helpers/parseOldSwapUrl.js';
import { parseOldPostUrl } from '@/helpers/parsePostUrl.js';
import { parseOldProfileUrl, parseProfileUrl } from '@/helpers/parseProfileUrl.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { resolveBookmarkUrl } from '@/helpers/resolveBookmarkUrl.js';
import { resolveChannelUrl } from '@/helpers/resolveChannelUrl.js';
import { resolveDiscoverUrl } from '@/helpers/resolveDiscoverUrl.js';
import { resolveEngagementUrl } from '@/helpers/resolveEngagementUrl.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { resolveFollowingUrl } from '@/helpers/resolveFollowingUrl.js';
import { resolveNotificationUrl } from '@/helpers/resolveNotificationUrl.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { resolveProfileSourceInURL, resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { resolveTxPageUrl } from '@/helpers/resolveTxPageUrl.js';

function redirect(pathname: string, request: Request, status = 307): Response {
    return Response.redirect(new URL(pathname, request.url), status);
}

export const legacyRedirects: MiddlewareFn = (request, { next }) => {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === '/' && request.method === 'GET') {
        return redirect('/following/posts', request);
    }

    if (isRoutePathname(pathname, '/polymarket/profile/:address/:type', true)) {
        const [, , , address, type] = pathname.split('/');
        const destination = new URL(`/polymarket/profile/${address}`, request.url);
        destination.searchParams.set('tab', type);
        return Response.redirect(destination, 307);
    }

    const oldDiscover = parseOldDiscoverUrl(url);
    if (oldDiscover) {
        const destination = new URL(
            oldDiscover.exploreType
                ? resolveExploreUrl(oldDiscover.exploreType)
                : resolveDiscoverUrl(oldDiscover.source),
            request.url,
        );
        return Response.redirect(destination, 307);
    }

    const oldNotification = parseOldNotification(url);
    if (oldNotification) {
        return redirect(resolveNotificationUrl(oldNotification.source), request);
    }

    const oldFollowing = parseOldFollowingUrl(url);
    if (oldFollowing) {
        return redirect(resolveFollowingUrl(oldFollowing.source), request);
    }

    const oldBookmark = parseOldBookmarkUrl(url);
    if (oldBookmark) {
        return redirect(resolveBookmarkUrl(oldBookmark.source), request);
    }

    const oldProfile = parseOldProfileUrl(url);
    if (oldProfile) {
        return redirect(
            getProfileUrl(
                { source: oldProfile.source, profileId: oldProfile.id, handle: oldProfile.id },
                oldProfile.category,
            ),
            request,
        );
    }

    const oldSwap = parseOldSwapUrl(url);
    if (oldSwap) {
        return redirect(resolveTxPageUrl(oldSwap.hash, Number(oldSwap.chainId)), request);
    }

    const oldExplore = parseOldExploreUrl(url);
    if (oldExplore) {
        return redirect(resolveExploreUrl(oldExplore.type, oldExplore.source), request);
    }

    const oldEngagement = parseOldEngagementUrl(url);
    if (oldEngagement) {
        return redirect(
            resolveEngagementUrl(oldEngagement.id, oldEngagement.source, oldEngagement.engagement),
            request,
        );
    }

    const oldPost = parseOldPostUrl(url);
    if (oldPost) {
        return redirect(resolvePostUrl(oldPost.source, oldPost.id), request);
    }

    const oldSettings = parseOldSettingsUrl(url);
    if (oldSettings) {
        return redirect(oldSettings.pathname, request);
    }

    const oldCommunity = parseOldCommunityUrl(url);
    if (oldCommunity) {
        return redirect(resolveChannelUrl(oldCommunity.id, oldCommunity.source, oldCommunity.type), request);
    }

    return next();
};

export const profileRoutes: MiddlewareFn = (request, { next }) => {
    const { pathname } = new URL(request.url);

    // Redirect old /bets URLs to /prediction
    if (pathname.includes('/bets') && !pathname.includes('/prediction')) {
        return redirect(pathname.replace('/bets', '/prediction'), request, 301);
    }

    const parsedProfileUrl = parseProfileUrl(pathname);

    if (parsedProfileUrl?.category && isFollowCategory(parsedProfileUrl.category)) {
        return next(
            new Request(
                urlcat(`/profile/:source/:id/relation/:category`, {
                    ...parsedProfileUrl,
                    source: resolveProfileSourceInURL(parsedProfileUrl.source),
                }),
                request,
            ),
        );
    }

    if (
        parsedProfileUrl?.category &&
        parsedProfileUrl.category === SocialProfileCategory.Feed &&
        isProfilePageSource(parsedProfileUrl.source) &&
        !new URL(request.url).searchParams.has('_internal')
    ) {
        return redirect(
            urlcat(`/profile/:source/:id`, {
                source: resolveProfileSourceInURL(parsedProfileUrl.source),
                id: parsedProfileUrl.id,
            }),
            request,
            302,
        );
    }

    if (
        !parsedProfileUrl?.category &&
        !!parsedProfileUrl?.source &&
        !!parsedProfileUrl.id &&
        isProfilePageSource(parsedProfileUrl.source)
    ) {
        const destination = new URL(
            urlcat(`/profile/:source/:id/:category`, {
                source: resolveProfileSourceInURL(parsedProfileUrl.source),
                id: parsedProfileUrl.id,
                category: isSocialSource(parsedProfileUrl.source)
                    ? SocialProfileCategory.Feed
                    : WalletProfileCategory.Transactions,
            }),
            request.url,
        );
        destination.searchParams.set('_internal', 'true');
        return next(new Request(destination, request));
    }

    if (pathname.startsWith('/profile/lens/')) {
        const pathArray = pathname.split('/');
        const handle = pathArray[3];
        if (handle.endsWith('.lens')) {
            pathArray[3] = handle.replace('.lens', '');
            return redirect(pathArray.join('/'), request);
        }
    }

    return next();
};

export const clubRoutes: MiddlewareFn = (request, { next }) => {
    const url = new URL(request.url);
    const parsedClubUrl = parseClubUrl(url);

    if (parsedClubUrl?.type && parsedClubUrl.type === ChannelTabType.Posts && !url.searchParams.has('_internal')) {
        return redirect(
            urlcat(`/club/:source/:id`, {
                source: resolveSourceInUrl(parsedClubUrl.source),
                id: parsedClubUrl.id,
            }),
            request,
            302,
        );
    }

    if (!parsedClubUrl?.type && !!parsedClubUrl?.source && !!parsedClubUrl.id) {
        const destination = new URL(
            urlcat(`/club/:source/:id/:type`, {
                source: resolveSourceInUrl(parsedClubUrl.source),
                id: parsedClubUrl.id,
                type: ChannelTabType.Posts,
            }),
            request.url,
        );
        destination.searchParams.set('_internal', 'true');
        return next(new Request(destination, request));
    }

    return next();
};
