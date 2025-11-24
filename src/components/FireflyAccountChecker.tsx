'use client';

import { bom, delay } from '@dimensiondev/utils';
import { useEffect, useRef } from 'react';
import { useTimeoutFn } from 'react-use';

import { PageRoute } from '@/constants/enum.js';
import { FORBIDDEN_EVENT_NAME } from '@/constants/event.js';
import { usePathname } from '@/esm/navigation.js';
import { enqueueForbiddenMessage } from '@/helpers/enqueueMessage.js';
import { isPathnameForceRedirect } from '@/helpers/isPathnameForceRedirect.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useCheckFireflyAccount } from '@/hooks/useCheckFireflyAccount.js';
import { useCurrentProfiles } from '@/hooks/useCurrentProfile.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { CreateFireflyAccountGuideModalRef } from '@/modals/CreateFireflyAccountGuideModal/index.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import { removeAllAccounts } from '@/services/account.js';
import { useThirdPartyProfileStore } from '@/store/useProfileStore/useThirdPartyProfileStore.js';

function removeGlobalLoading() {
    const globalLoading = document.getElementById('global-loading');
    if (globalLoading) {
        globalLoading.style.display = 'none';
    }
}

export function FireflyAccountChecker() {
    const isSyncing = useAsyncStatusAll();
    const { hasFireflyAccount, isLoading } = useCheckFireflyAccount();
    const profiles = useCurrentProfiles();
    const isLoginFirefly = useIsLoginFirefly();
    const { accounts } = useThirdPartyProfileStore();
    const pathname = usePathname();
    const isForbiddenError = useRef(false);
    const isForceRedirect = isPathnameForceRedirect(pathname);
    const hasLoggedIn = profiles.length > 0 || accounts.length > 0;

    useTimeoutFn(removeGlobalLoading, 4000);

    useEffect(() => {
        if (!bom?.location) return;
        if (hasFireflyAccount || isLoading) return;
        if (!isForceRedirect) return;
        if (isForbiddenError.current) return;
        if (hasLoggedIn) {
            CreateFireflyAccountGuideModalRef.open();
            return;
        }
        bom.location.href = PageRoute.Signup;
    }, [pathname, hasFireflyAccount, isLoading, isForceRedirect, hasLoggedIn, isForbiddenError]);

    useEffect(() => {
        const abortController = new AbortController();
        const logout = async () => {
            if (!bom.location) return;
            if (!fireflySessionHolder.session) return;
            isForbiddenError.current = true;
            abortController.abort();
            enqueueForbiddenMessage();
            await removeAllAccounts();
            await delay(5000);
            bom.location.href = PageRoute.Signup;
        };
        document.addEventListener(FORBIDDEN_EVENT_NAME, logout, { signal: abortController.signal });
        return () => abortController.abort();
    }, []);

    const showLoading = (((!hasFireflyAccount && !hasLoggedIn) || isLoading) && isForceRedirect) || isSyncing;
    if (!showLoading || !isLoginFirefly) {
        removeGlobalLoading();
    }

    return null;
}
