'use client';

import { Trans } from '@lingui/react/macro';
import type { PropsWithChildren } from 'react';

import { Link } from '@/components/Activity/Link.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { FIREFLY_APP_APP_STORE_URL, FIREFLY_APP_GOOGLE_PLAY_URL, FIREFLY_TELEGRAM_URL } from '@/constants/index.js';
import { useMounted } from '@/hooks/useMounted.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';

export function ActivityMobileOnly({ children, disabled = false }: PropsWithChildren<{ disabled?: boolean }>) {
    const isMounted = useMounted();
    if (!isMounted) {
        return (
            <div className="flex w-full items-center justify-center py-6">
                <LoadingIcon />
            </div>
        );
    }
    if (disabled || fireflyBridgeProvider.supported) return children;
    return (
        <div className="flex w-full flex-col px-6">
            <h4 className="mb-6 text-base font-semibold leading-normal text-highlight">
                <Trans>*This event is only available on the mobile app. Download Firefly now!</Trans>
            </h4>
            <div className="flex w-full gap-2">
                <Link
                    href={FIREFLY_APP_APP_STORE_URL}
                    target="_blank"
                    className="leading-11 flex h-11 flex-1 items-center justify-center rounded-lg border border-current text-base font-bold uppercase"
                >
                    <Trans>App Store</Trans>
                </Link>
                <Link
                    href={FIREFLY_APP_GOOGLE_PLAY_URL}
                    target="_blank"
                    className="leading-11 flex h-11 flex-1 items-center justify-center rounded-lg border border-current text-base font-bold uppercase"
                >
                    <Trans>Google Play</Trans>
                </Link>
            </div>
            <p className="my-4 w-full text-center text-[10px]">
                <Trans>
                    All rights reserved by Firefly. For any inquiries, please{' '}
                    <Link href={FIREFLY_TELEGRAM_URL} target="_blank" className="inline text-highlight">
                        contact us.
                    </Link>
                </Trans>
            </p>
        </div>
    );
}
