import { PageRoute } from '@dimensiondev/enums';
import { bom, delay } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { useEffect, useRef } from 'react';

import { EVENT_FIREFLY_SESSION_EXPIRED, EVENT_FORBIDDEN } from '@/constants/event.js';
import { listenCustomEvent } from '@/helpers/dispatchCustomEvents.js';
import { enqueueForbiddenMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
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
            EVENT_FIREFLY_SESSION_EXPIRED,
            async (e) => {
                const { account, removeFromStore = true, source } = e.detail;
                if (!removeFromStore) return;
                if (account) {
                    await removeAccountByProfileId(account.profile.profileSource, account.profile.profileId);
                } else if (source) {
                    await removeCurrentAccount(source);
                }

                const message = account
                    ? t`This account has expired, please log in again.`
                    : source
                      ? t`Your ${resolveSourceName(source)} login token has expired. Please sign in again.`
                      : undefined;
                if (message) {
                    enqueueWarningMessage(message);
                }
            },
            { signal: abortController.signal },
        );

        return () => abortController.abort();
    }, []);

    return { isForbiddenError: isForbiddenErrorRef.current };
}
