'use client';

import { PageRoute } from '@dimensiondev/enums';
import { bom } from '@dimensiondev/utils';
import { useEffect } from 'react';

import { openCreateFireflyAccountGuideModal } from '@/controllers/openCreateFireflyAccountGuideModal.js';
import { usePathname } from '@/esm/navigation.js';
import { isPathnameForceRedirect } from '@/helpers/isPathnameForceRedirect.js';
import { useCheckFireflyAccount } from '@/hooks/useCheckFireflyAccount.js';
import { useCurrentProfiles } from '@/hooks/useCurrentProfile.js';
import { useWatchAccountChange } from '@/hooks/useWatchAccountChange.js';
import { useThirdPartyProfileStore } from '@/store/useProfileStore/useThirdPartyProfileStore.js';

export function FireflyAccountChecker() {
    const { hasFireflyAccount, isLoading } = useCheckFireflyAccount();
    const profiles = useCurrentProfiles();
    const { accounts } = useThirdPartyProfileStore();
    const pathname = usePathname();
    const { isForbiddenError } = useWatchAccountChange();

    const isForceRedirect = isPathnameForceRedirect(pathname);
    const hasLoggedIn = profiles.length > 0 || accounts.length > 0;
    useEffect(() => {
        if (!bom?.location) return;
        if (hasFireflyAccount || isLoading) return;
        if (!isForceRedirect) return;
        if (isForbiddenError) return;
        if (hasLoggedIn) {
            openCreateFireflyAccountGuideModal();
            return;
        }
        bom.location.href = PageRoute.Signup;
    }, [pathname, hasFireflyAccount, isLoading, isForceRedirect, hasLoggedIn, isForbiddenError]);

    return null;
}
