import { type NextRequest, NextResponse } from 'next/server.js';
import urlcat from 'urlcat';

import { authOptions } from '@/app/api/auth/[...nextauth]/options.js';
import { DeleteCookieScript, MaskDelegateCookieName } from '@/app/api/mask/delegate-x-token/shared.js';
import { Auth } from '@/esm/Auth.js';
import type { NextRequestContext } from '@/types/utility.js';

const handler = Auth(authOptions);

export { handler as POST };

export async function GET(request: NextRequest, context: NextRequestContext<{}>) {
    if (request.nextUrl.pathname === '/api/auth/signin') {
        return NextResponse.redirect(
            new URL(
                urlcat('/auth/error', {
                    error: request.nextUrl.searchParams.get('error'),
                }),
                request.url,
            ),
        );
    }

    if (
        request.nextUrl.pathname === '/api/auth/callback/twitter' &&
        request.cookies.get(MaskDelegateCookieName)?.value
    ) {
        const res = new NextResponse(
            `<!doctype html><a id="c" href="#">It's now safe to turn off this page.</a><script>${DeleteCookieScript};c.onclose=()=>window.close()</script>`,
            {
                headers: {
                    'Content-Type': 'text/html, charset=utf-8',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                },
            },
        );
        res.cookies.delete({
            name: MaskDelegateCookieName,
            path: '/api/auth/callback/twitter',
        });
        return res;
    }

    return handler(request, context);
}
