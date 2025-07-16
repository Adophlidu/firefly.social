'use client';

import { useEffect } from 'react';
import { useTimeoutFn } from 'react-use';

import { PageRoute } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
import { bom } from '@/helpers/bom.js';
import { finishLoadFont, finishSignupCheck } from '@/helpers/finishGlobalLoading.js';
import { isPathnameForceRedirect } from '@/helpers/openLoginModal.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useCheckFireflyAccount } from '@/hooks/useCheckFireflyAccount.js';
import { useCurrentProfiles } from '@/hooks/useCurrentProfile.js';
import { CreateFireflyAccountGuideModalRef } from '@/modals/controls.js';
import { useThirdPartyStateStore } from '@/store/useProfileStore.js';

export function FireflyAccountChecker() {
    const isSyncing = useAsyncStatusAll();
    const { hasFireflyAccount, isLoading } = useCheckFireflyAccount();
    const profiles = useCurrentProfiles();
    const { accounts } = useThirdPartyStateStore();
    const pathname = usePathname();
    const isForceRedirect = isPathnameForceRedirect(pathname);
    const hasLoggedIn = profiles.length > 0 || accounts.length > 0;

    useTimeoutFn(() => {
        // Remove the global loading indicator after 3 seconds
        finishLoadFont();
        finishSignupCheck();
    }, 3000);

    useEffect(() => {
        if (!bom?.location) return;
        if (pathname === PageRoute.Signup) return;
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
        finishLoadFont();
        finishSignupCheck();
    }

    return null;
}
