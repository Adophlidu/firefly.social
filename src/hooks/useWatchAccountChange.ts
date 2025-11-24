import { bom, delay } from '@dimensiondev/utils';
import { useEffect, useRef } from 'react';

import { PageRoute } from '@/constants/enum.js';
import { EVENT_FORBIDDEN, EVENT_SOCIAL_ACCOUNT_EXPIRED } from '@/constants/event.js';
import { listenCustomEvent } from '@/helpers/dispatchCustomEvents.js';
import { enqueueForbiddenMessage } from '@/helpers/enqueueMessage.js';
import { getProfileState } from '@/helpers/getProfileState.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { removeAllAccounts } from '@/services/account.js';
import { deleteMetricsByLocalPassword } from '@/services/deleteMetricsByLocalPassword.js';

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
                const { account, removeFromStore } = e.detail;
                if (removeFromStore) {
                    const state = getProfileState(account.profile.profileSource);
                    state.removeAccount(account);
                }
                await deleteMetricsByLocalPassword(account);
            },
            { signal: abortController.signal },
        );

        return () => abortController.abort();
    }, []);

    return { isForbiddenError: isForbiddenErrorRef.current };
}
