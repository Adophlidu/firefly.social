import { bom, delay } from '@dimensiondev/utils';
import { useEffect, useRef } from 'react';

import { PageRoute } from '@/constants/enum.js';
import { EVENT_FORBIDDEN, EVENT_SOCIAL_ACCOUNT_EXPIRED } from '@/constants/event.js';
import { listenCustomEvent } from '@/helpers/dispatchCustomEvents.js';
import { enqueueForbiddenMessage } from '@/helpers/enqueueMessage.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { removeAccountByProfileId, removeAllAccounts, removeCurrentAccount } from '@/services/account.js';

export function useWatchAccountChange() {
    const isForbiddenErrorRef = useRef(false);

    useEffect(() => {
        const abortController = new AbortController();

        listenCustomEvent(
            EVENT_FORBIDDEN,
            async () => {
                if (!bom.location) return;
                if (!fireflySessionHolder.session) return;

                isForbiddenErrorRef.current = true;
                abortController.abort();
                enqueueForbiddenMessage();
                await removeAllAccounts();
                await delay(5000);

                bom.location.href = PageRoute.Signup;
            },
            { signal: abortController.signal },
        );

        listenCustomEvent(
            EVENT_SOCIAL_ACCOUNT_EXPIRED,
            async (e) => {
                const { account, removeFromStore, source } = e.detail;
                if (!removeFromStore) return;
                if (account) {
                    await removeAccountByProfileId(account.profile.profileSource, account.profile.profileId);
                } else if (source) {
                    await removeCurrentAccount(source);
                }
            },
            { signal: abortController.signal },
        );

        return () => abortController.abort();
    }, []);

    return { isForbiddenError: isForbiddenErrorRef.current };
}
