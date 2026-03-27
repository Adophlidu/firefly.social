import { compose } from '@dimensiondev/utils';
import { cookies } from 'next/headers.js';

import { DeleteCookieScript, MaskDelegateCookieName } from '@/app/api/mask/delegate-x-token/shared.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';

export const runtime = 'edge';

export const GET = compose(withRequestErrorHandler(), async () => {
    (await cookies()).set(MaskDelegateCookieName, 'true', {
        path: '/api/auth/callback/twitter',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });
    return new Response(
        `<!doctype html><a id=a href="#">Not sure why you're seeing this? Click this and close this page.</a><script>a.onclick=()=>{${DeleteCookieScript};window.close()}</script>`,
        {
            headers: {
                'Content-Type': 'text/html, charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        },
    );
});
