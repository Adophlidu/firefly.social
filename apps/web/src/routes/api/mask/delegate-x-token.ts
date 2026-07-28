import type { ApiContext } from '@dimensiondev/ssr';
import { compose } from '@dimensiondev/utils';

import type { NextRequest } from '@/compat/next-server.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';

const MaskDelegateCookieName = 'X-REQUEST_TOKEN-MASK-DELEGATE';
const DeleteCookieScript = `document.cookie='X-REQUEST_TOKEN-MASK-DELEGATE=0; path=/api/auth/callback/twitter; expires='+new Date(0).toUTCString()`;

const getHandler = compose(withRequestErrorHandler(), async (_request: NextRequest) => {
    return new Response(
        `<!doctype html><a id=a href="#">Not sure why you're seeing this? Click this and close this page.</a><script>a.onclick=()=>{${DeleteCookieScript};window.close()}</script>`,
        {
            headers: {
                'Content-Type': 'text/html, charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                // mirrors `cookies().set(MaskDelegateCookieName, 'true', { path, expires })`
                'Set-Cookie': `${MaskDelegateCookieName}=true; path=/api/auth/callback/twitter; expires=${new Date(
                    Date.now() + 60 * 60 * 1000, // 1 hour
                ).toUTCString()}`,
            },
        },
    );
});

export function GET({ request }: ApiContext) {
    return getHandler(request as NextRequest);
}
