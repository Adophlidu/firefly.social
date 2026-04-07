import { Trans } from '@lingui/react/macro';
import { type PropsWithChildren } from 'react';

import { Button } from '@/components/ui/button.js';
import { env } from '@/constants/env.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';

export function LoginRequired({ children }: PropsWithChildren) {
    const isLoginFirefly = useIsLoginFirefly();
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
