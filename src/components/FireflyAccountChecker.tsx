'use client';
import { bom } from '@dimensiondev/utils';
import { useEffect } from 'react';
import { useTimeoutFn } from 'react-use';

import { PageRoute } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
import { isPathnameForceRedirect } from '@/helpers/openLoginModal.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useCheckFireflyAccount } from '@/hooks/useCheckFireflyAccount.js';
import { useCurrentProfiles } from '@/hooks/useCurrentProfile.js';
import { CreateFireflyAccountGuideModalRef } from '@/modals/CreateFireflyAccountGuideModal/index.js';
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
    const { accounts } = useThirdPartyProfileStore();
    const pathname = usePathname();
    const isForceRedirect = isPathnameForceRedirect(pathname);
    const hasLoggedIn = profiles.length > 0 || accounts.length > 0;

    useTimeoutFn(removeGlobalLoading, 4000);

    useEffect(() => {
        if (!bom?.location) return;
        if (hasFireflyAccount || isLoading) return;
        if (!isForceRedirect) return;

        if (hasLoggedIn) {
            CreateFireflyAccountGuideModalRef.open();
            return;
        }

        bom.location.href = PageRoute.Signup;
    }, [pathname, hasFireflyAccount, isLoading, isForceRedirect, hasLoggedIn]);

    const showLoading = (((!hasFireflyAccount && !hasLoggedIn) || isLoading) && isForceRedirect) || isSyncing;
    if (!showLoading) {
        removeGlobalLoading();
    }

    return null;
}
