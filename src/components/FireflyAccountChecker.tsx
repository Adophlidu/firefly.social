'use client';

import { useEffect } from 'react';

import { FireflyLoadingIndicator } from '@/components/FireflyLoadingIndicator.js';
import { PageRoute } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
import { bom } from '@/helpers/bom.js';
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

    useEffect(() => {
        if (!bom?.location) return;
        if (pathname === PageRoute.Signup) return;
        if (hasFireflyAccount || isLoading) return;
        if (!isForceRedirect) return;

        if (profiles.length || accounts.length) {
            CreateFireflyAccountGuideModalRef.open();
            return;
        }

        bom.location.href = PageRoute.Signup;
    }, [pathname, accounts.length, hasFireflyAccount, isLoading, profiles.length, isForceRedirect]);

    if (((!hasFireflyAccount || isLoading) && isForceRedirect) || isSyncing) {
        return (
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-primaryBottom">
                <FireflyLoadingIndicator />
            </div>
        );
    }

    return null;
}
