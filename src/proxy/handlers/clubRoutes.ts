import { type NextRequest, NextResponse } from 'next/server.js';
import urlcat from 'urlcat';

import { ChannelTabType } from '@/constants/enum.js';
import { parseClubUrl } from '@/helpers/parseClubUrl.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';

export function handleClubRoutes(request: NextRequest, next: () => NextResponse | undefined) {
    const parsedClubUrl = parseClubUrl(request.nextUrl);

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
        return NextResponse.redirect(destination, { status: 302 });
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
        return NextResponse.rewrite(destination, { request });
    }

    return next();
}
