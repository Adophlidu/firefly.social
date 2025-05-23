import { NextRequest, NextResponse, userAgent } from 'next/server.js';
import urlcat from 'urlcat';

import { SourceInURL } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/index.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isFollowCategory } from '@/helpers/isFollowCategory.js';
import { parseOldDiscoverUrl } from '@/helpers/parseDiscoverUrl.js';
import { parseOldEngagementUrl } from '@/helpers/parseEngagementUrl.js';
import { parseOldBookmarkUrl } from '@/helpers/parseOldBookmarkUrl.js';
import { parseOldFollowingUrl } from '@/helpers/parseOldFollowingUrl.js';
import { parseOldNftUrl } from '@/helpers/parseOldNftUrl.js';
import { parseOldNotification } from '@/helpers/parseOldNotification.js';
import { parseOldSettingsUrl } from '@/helpers/parseOldSettingsUrl.js';
import { parseOldPostUrl } from '@/helpers/parsePostUrl.js';
import { parseOldProfileUrl, parseProfileUrl } from '@/helpers/parseProfileUrl.js';
import { resolveBookmarkUrl } from '@/helpers/resolveBookmarkUrl.js';
import { resolveDiscoverUrl } from '@/helpers/resolveDiscoverUrl.js';
import { resolveEngagementUrl } from '@/helpers/resolveEngagementUrl.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { resolveFollowingUrl } from '@/helpers/resolveFollowingUrl.js';
import { resolveNFTUrl } from '@/helpers/resolveNFTUrl.js';
import { resolveNotificationUrl } from '@/helpers/resolveNotificationUrl.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { resolveProfileSourceInURL } from '@/helpers/resolveSourceInUrl.js';

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    request.headers.set('X-URL', request.url);

    if (request.nextUrl.host === 'cz.firefly.social' && pathname === '/') {
        return NextResponse.redirect(urlcat(SITE_URL, '/event/cz_welcome_back_airdrop'));
    }

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
