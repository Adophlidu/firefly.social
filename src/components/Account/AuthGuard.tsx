'use client';
import { Trans } from '@lingui/react/macro';
import { useEffect } from 'react';

import { enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { removeAllAccounts } from '@/services/account.js';

export function AuthGuard() {
    useEffect(() => {
        const abortController = new AbortController();
        document.addEventListener(
            'firefly:logout',
            () => {
                enqueueWarningMessage(
                    <Trans>
                        Account disabled due to potential risk. Contact us on{' '}
                        <a href="https://t.me/fireflyapp/48" className="underline" target="_blank">
                            Telegram
                        </a>{' '}
                        to restore access.
                    </Trans>,
                );
                removeAllAccounts();
            },
            { signal: abortController.signal },
        );
        return () => abortController.abort();
    }, []);
    return null;
}
