'use client';

import { useEffect } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { PageRoute } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
import { bom } from '@/helpers/bom.js';
import { isPathnameForceRedirect } from '@/helpers/openLoginModal.js';
import { useCheckFireflyAccount } from '@/hooks/useCheckFireflyAccount.js';
import { useCurrentProfiles } from '@/hooks/useCurrentProfile.js';
import { CreateFireflyAccountGuideModalRef } from '@/modals/controls.js';
import { useThirdPartyStateStore } from '@/store/useProfileStore.js';

export function FireflyAccountChecker() {
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
    }, [pathname, accounts.length, hasFireflyAccount, isLoading, profiles.length]);

    if ((!hasFireflyAccount || isLoading) && isForceRedirect) {
        return (
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-primaryBottom">
                <LoadingIcon />
            </div>
        );
    }

    return null;
}
