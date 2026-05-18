'use client';

import { PageRoute } from '@dimensiondev/enums';
import { bom } from '@dimensiondev/utils';
import { useEffect } from 'react';
import { useTimeoutFn } from 'react-use';

import { usePathname } from '@/esm/navigation.js';
import { isPathnameForceRedirect } from '@/helpers/isPathnameForceRedirect.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useCheckFireflyAccount } from '@/hooks/useCheckFireflyAccount.js';
import { useCurrentProfiles } from '@/hooks/useCurrentProfile.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { useWatchAccountChange } from '@/hooks/useWatchAccountChange.js';
import { CreateFireflyAccountGuideModalRef } from '@/modals/CreateFireflyAccountGuideModal/refs.js';
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
    const { isForbiddenError } = useWatchAccountChange();

    useTimeoutFn(removeGlobalLoading, 4000);

    const isForceRedirect = isPathnameForceRedirect(pathname);
    const hasLoggedIn = profiles.length > 0 || accounts.length > 0;
    useEffect(() => {
        if (!bom?.location) return;
        if (hasFireflyAccount || isLoading) return;
        if (!isForceRedirect) return;
        if (isForbiddenError) return;
        if (hasLoggedIn) {
            CreateFireflyAccountGuideModalRef.open();
            return;
        }
        bom.location.href = PageRoute.Signup;
    }, [pathname, hasFireflyAccount, isLoading, isForceRedirect, hasLoggedIn, isForbiddenError]);

    const showLoading = (((!hasFireflyAccount && !hasLoggedIn) || isLoading) && isForceRedirect) || isSyncing;
    if (!showLoading || !isLoginFirefly) {
        removeGlobalLoading();
    }

    return null;
}
