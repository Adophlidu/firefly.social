import { env } from '@dimensiondev/envs/wallet';
import { Trans } from '@lingui/react/macro';
import type { PropsWithChildren } from 'react';

import { Button } from '@/components/ui/button.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useIsPublicRoute } from '@/hooks/useIsPublicRoute.js';

export function LoginRequired({ children }: PropsWithChildren) {
    const isPublicRoute = useIsPublicRoute();
    const isLoginFirefly = useIsLoginFirefly();
    if (isPublicRoute) return children;
    if (!isLoginFirefly) {
        return (
            <div className="flex h-48 w-full flex-col items-center justify-center">
                <Button asChild>
                    <a href={env.external.NEXT_PUBLIC_SITE_URL} target="_blank" rel="noopener noreferrer">
                        <Trans>Login In Firefly</Trans>
                    </a>
                </Button>
            </div>
        );
    }
    return children;
}
