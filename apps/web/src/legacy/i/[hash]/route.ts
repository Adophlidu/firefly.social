import type { NextRequestContext } from '@dimensiondev/types';
import type { NextRequest } from '@/compat/next-server.js';
import { NextResponse } from '@/compat/next-server.js';

import { getShortLink } from '@/helpers/shortLink.js';

export const runtime = 'edge';

export async function GET(_request: NextRequest, context: NextRequestContext<{ hash: string }>) {
    const { hash } = await context.params;

    const record = await getShortLink(hash);
    // Bare 404 (no redirect, no page): dead links must not soft-404 for crawlers.
    if (!record) return new Response(null, { status: 404 });

    // 301, not 307: short links are deterministic and permanent (same identity
    // always resolves to the same destination), so this genuinely is a permanent
    // redirect. 301 is also the most universally recognized redirect status across
    // link-unfurling bots (Twitterbot, Discordbot, Slackbot, facebookexternalhit,
    // WhatsApp, TelegramBot) — some older/minimal crawlers don't follow 307/308,
    // which were only added in RFC 7231/7238 (2014), well after 301/302 became
    // the de facto standard every HTTP client follows. This is the same pattern
    // t.co and bit.ly use: the destination page's own generateMetadata already
    // renders correct og:/twitter: tags server-side, so a plain redirect-follow
    // (no JS execution required) is sufficient for unfurling.
    return NextResponse.redirect(record.url, { status: 301 });
}
