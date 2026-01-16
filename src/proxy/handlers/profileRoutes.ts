import { type NextRequest, NextResponse } from 'next/server.js';
import urlcat from 'urlcat';

import { SocialProfileCategory, WalletProfileCategory } from '@/constants/enum.js';
import { isFollowCategory } from '@/helpers/isFollowCategory.js';
import { isProfilePageSource, isSocialSource } from '@/helpers/isSource.js';
import { parseProfileUrl } from '@/helpers/parseProfileUrl.js';
import { resolveProfileSourceInURL } from '@/helpers/resolveSourceInUrl.js';

export function handleProfileRoutes(request: NextRequest, next: () => NextResponse | undefined) {
    const pathname = request.nextUrl.pathname;

    // Redirect old /bets URLs to /prediction
    if (pathname.includes('/bets') && !pathname.includes('/prediction')) {
        const destination = request.nextUrl.clone();
        destination.pathname = pathname.replace('/bets', '/prediction');
        return NextResponse.redirect(destination, { status: 301 });
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
        return NextResponse.rewrite(destination, { request });
    }

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
        return NextResponse.redirect(destination, { status: 302 });
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
        return NextResponse.rewrite(destination, { request });
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

    return next();
}
