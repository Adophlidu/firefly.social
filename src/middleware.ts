import { NextRequest, NextResponse, userAgent } from 'next/server.js';
import urlcat from 'urlcat';

import { ChannelTabType, SocialProfileCategory, SourceInURL, WalletProfileCategory } from '@/constants/enum.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isFollowCategory } from '@/helpers/isFollowCategory.js';
import { isProfilePageSource, isSocialSource } from '@/helpers/isSource.js';
import { parseClubUrl } from '@/helpers/parseClubUrl.js';
import { parseOldDiscoverUrl } from '@/helpers/parseDiscoverUrl.js';
import { parseOldEngagementUrl } from '@/helpers/parseEngagementUrl.js';
import { parseOldBookmarkUrl } from '@/helpers/parseOldBookmarkUrl.js';
import { parseOldCommunityUrl } from '@/helpers/parseOldCommunityUrl.js';
import { parseOldExploreUrl } from '@/helpers/parseOldExploreUrl.js';
import { parseOldFollowingUrl } from '@/helpers/parseOldFollowingUrl.js';
import { parseOldNftUrl } from '@/helpers/parseOldNftUrl.js';
import { parseOldNotification } from '@/helpers/parseOldNotification.js';
import { parseOldSettingsUrl } from '@/helpers/parseOldSettingsUrl.js';
import { parseOldSwapUrl } from '@/helpers/parseOldSwapUrl.js';
import { parseOldPostUrl } from '@/helpers/parsePostUrl.js';
import { parseOldProfileUrl, parseProfileUrl } from '@/helpers/parseProfileUrl.js';
import { resolveBookmarkUrl } from '@/helpers/resolveBookmarkUrl.js';
import { resolveChannelUrl } from '@/helpers/resolveChannelUrl.js';
import { resolveDiscoverUrl } from '@/helpers/resolveDiscoverUrl.js';
import { resolveEngagementUrl } from '@/helpers/resolveEngagementUrl.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { resolveFollowingUrl } from '@/helpers/resolveFollowingUrl.js';
import { resolveNFTUrl } from '@/helpers/resolveNFTUrl.js';
import { resolveNotificationUrl } from '@/helpers/resolveNotificationUrl.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { resolveProfileSourceInURL, resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { resolveTxPageUrl } from '@/helpers/resolveTxPageUrl.js';

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    request.headers.set('X-URL', request.url);

    const parsedOldDiscoverUrl = parseOldDiscoverUrl(request.nextUrl);
    if (parsedOldDiscoverUrl) {
        const destination = request.nextUrl.clone();
        destination.pathname = parsedOldDiscoverUrl.exploreType
            ? resolveExploreUrl(parsedOldDiscoverUrl.exploreType)
            : resolveDiscoverUrl(parsedOldDiscoverUrl.source);
        destination.searchParams.delete('source');
        destination.searchParams.delete('discover');
        return NextResponse.redirect(destination);
    }

    const parsedOldNotificationUrl = parseOldNotification(request.nextUrl);
    if (parsedOldNotificationUrl) {
        const destination = request.nextUrl.clone();
        destination.pathname = resolveNotificationUrl(parsedOldNotificationUrl.source);
        destination.searchParams.delete('source');
        return NextResponse.redirect(destination);
    }

    const parsedOldFollowingUrl = parseOldFollowingUrl(request.nextUrl);
    if (parsedOldFollowingUrl) {
        const destination = request.nextUrl.clone();
        destination.pathname = resolveFollowingUrl(parsedOldFollowingUrl.source);
        destination.searchParams.delete('source');
        return NextResponse.redirect(destination);
    }

    const parsedOldBookmarkUrl = parseOldBookmarkUrl(request.nextUrl);
    if (parsedOldBookmarkUrl) {
        const destination = request.nextUrl.clone();
        destination.pathname = resolveBookmarkUrl(parsedOldBookmarkUrl.source);
        destination.searchParams.delete('source');

        return NextResponse.redirect(destination);
    }

    const parsedOldProfileUrl = parseOldProfileUrl(request.nextUrl);
    if (parsedOldProfileUrl) {
        const destination = request.nextUrl.clone();

        destination.pathname = getProfileUrl(
            { source: parsedOldProfileUrl.source, profileId: parsedOldProfileUrl.id, handle: parsedOldProfileUrl.id },
            parsedOldProfileUrl.category,
        );

        destination.searchParams.delete('profile_tab');
        destination.searchParams.delete('wallet_tab');
        destination.searchParams.delete('source');
        return NextResponse.redirect(destination);
    }

    const parsedOldSwapUrl = parseOldSwapUrl(request.nextUrl);
    if (parsedOldSwapUrl) {
        const destination = request.nextUrl.clone();
        destination.pathname = resolveTxPageUrl(parsedOldSwapUrl.hash, Number(parsedOldSwapUrl.chainId));
        return NextResponse.redirect(destination);
    }

    const parsedProfileUrl = parseProfileUrl(pathname);
    if (parsedProfileUrl?.category && isFollowCategory(parsedProfileUrl.category)) {
        const destination = new URL(
            urlcat(`/profile/:source/:id/relation/:category`, {
                ...parsedProfileUrl,
                source: resolveProfileSourceInURL(parsedProfileUrl.source),
            }),
            request.url,
        );
        return NextResponse.rewrite(destination, {
            request,
        });
    }

    /**
     * /profile/lens/123/feed -> /profile/lens/123
     * Not redirect if searchParams has _internal
     */
    if (
        parsedProfileUrl?.category &&
        parsedProfileUrl.category === SocialProfileCategory.Feed &&
        isProfilePageSource(parsedProfileUrl.source) &&
        !request.nextUrl.searchParams.has('_internal')
    ) {
        const destination = new URL(
            urlcat(`/profile/:source/:id`, {
                source: resolveProfileSourceInURL(parsedProfileUrl.source),
                id: parsedProfileUrl.id,
            }),
            request.url,
        );
        return NextResponse.redirect(destination, {
            status: 302,
        });
    }

    /**
     * /profile/lens/123 -> /profile/lens/123/feed
     * Rewrite and set `_internal` to true
     */
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
        return NextResponse.rewrite(destination, {
            request,
        });
    }

    const parsedOldExploreUrl = parseOldExploreUrl(request.nextUrl);
    if (parsedOldExploreUrl) {
        const destination = request.nextUrl.clone();
        destination.pathname = resolveExploreUrl(parsedOldExploreUrl.type, parsedOldExploreUrl.source);
        return NextResponse.redirect(destination);
    }
    /**
     * /profile/far -> /profile/farcaster
     * /profile/twitter -> /profile/x
     */
    if (pathname.startsWith('/profile/far/') || pathname.startsWith('/profile/twitter/')) {
        const pathArray = pathname.split('/');
        const sourceInUrl = pathArray[2];
        const destination = request.nextUrl.clone();
        pathArray[2] = sourceInUrl === SourceInURL.FarcasterV2 ? SourceInURL.Farcaster : SourceInURL.X;
        destination.pathname = pathArray.join('/');
        return NextResponse.redirect(destination);
    }

    const parsedOldEngagementUrl = parseOldEngagementUrl(request.nextUrl);
    if (parsedOldEngagementUrl) {
        const destination = request.nextUrl.clone();
        destination.pathname = resolveEngagementUrl(
            parsedOldEngagementUrl.id,
            parsedOldEngagementUrl.source,
            parsedOldEngagementUrl.engagement,
        );
        destination.searchParams.delete('source');
        return NextResponse.redirect(destination);
    }

    const parsedOldPostUrl = parseOldPostUrl(request.nextUrl);
    if (parsedOldPostUrl) {
        const destination = request.nextUrl.clone();
        destination.pathname = resolvePostUrl(parsedOldPostUrl.source, parsedOldPostUrl.id);
        destination.searchParams.delete('source');
        return NextResponse.redirect(destination);
    }

    const parsedOldNftUrl = parseOldNftUrl(request.nextUrl);
    if (parsedOldNftUrl) {
        const destination = request.nextUrl.clone();
        destination.pathname = resolveNFTUrl(parsedOldNftUrl.chainId, parsedOldNftUrl.address, parsedOldNftUrl.tokenId);
        destination.searchParams.delete('chainId');
        return NextResponse.redirect(destination);
    }

    const parsedOldSettingsUrl = parseOldSettingsUrl(request.nextUrl);
    if (parsedOldSettingsUrl) {
        const destination = request.nextUrl.clone();
        destination.pathname = parsedOldSettingsUrl.pathname;
        return NextResponse.redirect(destination);
    }

    const isPost = pathname.startsWith('/post') && !pathname.includes('/photos');
    if (isPost) {
        const { isBot } = userAgent(request);

        request.headers.set('X-IS-BOT', isBot ? 'true' : 'false');

        return NextResponse.next({
            request,
        });
    }

    const parsedOldCommunityUrl = parseOldCommunityUrl(request.nextUrl);
    if (parsedOldCommunityUrl) {
        const destination = request.nextUrl.clone();
        destination.pathname = resolveChannelUrl(
            parsedOldCommunityUrl.id,
            parsedOldCommunityUrl.source,
            parsedOldCommunityUrl.type,
        );
        return NextResponse.redirect(destination);
    }

    const parsedClubUrl = parseClubUrl(request.nextUrl);

    /**
     * /club/lens/123/posts -> /club/lens/123
     * Not redirect if searchParams has _internal
     */
    if (
        parsedClubUrl?.type &&
        parsedClubUrl.type === ChannelTabType.Posts &&
        !request.nextUrl.searchParams.has('_internal')
    ) {
        const destination = new URL(
            urlcat(`/club/:source/:id`, {
                source: resolveSourceInUrl(parsedClubUrl.source),
                id: parsedClubUrl.id,
            }),
            request.url,
        );
        return NextResponse.redirect(destination, {
            status: 302,
        });
    }

    /**
     * /club/lens/123 -> /club/lens/123/posts
     * Rewrite and set `_internal` to true
     */
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
        return NextResponse.rewrite(destination, {
            request,
        });
    }

    if (pathname.startsWith('/profile/lens/')) {
        const pathArray = pathname.split('/');
        const handle = pathArray[3];
        if (handle.endsWith('.lens')) {
            const destination = request.nextUrl.clone();
            pathArray[3] = handle.replace('.lens', '');
            destination.pathname = pathArray.join('/');
            return NextResponse.redirect(destination);
        }
    }

    if (pathname.startsWith('/token/')) {
        if (request.nextUrl.searchParams.size > 0) {
            request.headers.set('X-SEARCH-PARAMS', request.nextUrl.searchParams.toString());
            return NextResponse.next({ request });
        }
    }

    return NextResponse.next({
        request,
    });
}

export const config = {
    matcher: [
        '/((?!_next/static|js|sw.js|site.webmanifest|_next/image|api|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js)$).*)',
    ],
};
