import { cookies } from 'next/headers.js';

import { MaskDelegateCookieName } from '@/app/api/mask/delegate-x-token/shared.js';

export async function GET() {
    (await cookies()).set(MaskDelegateCookieName, 'true', {
        path: '/api/auth/callback/twitter',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });
    return new Response(
        `<!doctype html><a id=a href="#">Not sure why you're seeing this? Click this and close this page.</a><script>a.onclick=()=>{document.cookie='X-REQUEST_TOKEN-MASK-DELEGATE=0; path=/api/auth/callback/twitter; expires='+new Date(0).toUTCString();window.close()}</script>`,
        {
            headers: {
                'Content-Type': 'text/html, charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        },
    );
}
