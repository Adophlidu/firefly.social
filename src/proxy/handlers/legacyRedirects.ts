import { NextRequest, NextResponse } from 'next/server.js';

import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
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
import { parseOldProfileUrl } from '@/helpers/parseProfileUrl.js';
import { resolveBookmarkUrl } from '@/helpers/resolveBookmarkUrl.js';
import { resolveChannelUrl } from '@/helpers/resolveChannelUrl.js';
import { resolveDiscoverUrl } from '@/helpers/resolveDiscoverUrl.js';
import { resolveEngagementUrl } from '@/helpers/resolveEngagementUrl.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { resolveFollowingUrl } from '@/helpers/resolveFollowingUrl.js';
import { resolveNFTUrl } from '@/helpers/resolveNFTUrl.js';
import { resolveNotificationUrl } from '@/helpers/resolveNotificationUrl.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { resolveTxPageUrl } from '@/helpers/resolveTxPageUrl.js';

export function handleLegacyRedirects(request: NextRequest, next: () => NextResponse | undefined) {
    const pathname = request.nextUrl.pathname;

    if (pathname === '/' && request.method === 'GET') {
        const destination = request.nextUrl.clone();
        destination.pathname = '/following/posts';
        return NextResponse.redirect(destination);
    }

    if (isRoutePathname(pathname, '/polymarket/profile/:address/:type', true)) {
        const destination = request.nextUrl.clone();
        const [, , , address, type] = pathname.split('/');
        destination.pathname = `/polymarket/profile/${address}`;
        destination.searchParams.set('tab', type);
        return NextResponse.redirect(destination);
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

    const parsedOldSwapUrl = parseOldSwapUrl(request.nextUrl);
    if (parsedOldSwapUrl) {
        const destination = request.nextUrl.clone();
        destination.pathname = resolveTxPageUrl(parsedOldSwapUrl.hash, Number(parsedOldSwapUrl.chainId));
        return NextResponse.redirect(destination);
    }

    const parsedOldExploreUrl = parseOldExploreUrl(request.nextUrl);
    if (parsedOldExploreUrl) {
        const destination = request.nextUrl.clone();
        destination.pathname = resolveExploreUrl(parsedOldExploreUrl.type, parsedOldExploreUrl.source);
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

    return next();
}
