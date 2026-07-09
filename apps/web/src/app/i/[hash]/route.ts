import type { NextRequestContext } from '@dimensiondev/types';
import type { NextRequest } from 'next/server.js';
import { NextResponse } from 'next/server.js';

import { getShortLink } from '@/helpers/shortLink.js';

export const runtime = 'edge';

export async function GET(_request: NextRequest, context: NextRequestContext<{ hash: string }>) {
    const { hash } = await context.params;

    const record = await getShortLink(hash);
    // Bare 404 (no redirect, no page): dead links must not soft-404 for crawlers.
    if (!record) return new Response(null, { status: 404 });

    return NextResponse.redirect(record.url, { status: 307 });
}
