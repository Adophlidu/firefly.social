'use client';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { PageRoute } from '@/constants/enum.js';
import { redirect, RedirectType, usePathname } from '@/esm/navigation.js';
import { useCheckFireflyAccount } from '@/hooks/useCheckFireflyAccount.js';
import { useCurrentProfiles } from '@/hooks/useCurrentProfile.js';
import { CreateFireflyAccountGuideModalRef } from '@/modals/controls.js';
import { useThirdPartyStateStore } from '@/store/useProfileStore.js';

export function FireflyAccountChecker() {
    const { hasFireflyAccount, isLoading } = useCheckFireflyAccount();
    const profiles = useCurrentProfiles();
    const { accounts } = useThirdPartyStateStore();
    const pathname = usePathname();

    if (pathname === PageRoute.Signup) return null;

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-primaryBottom">
                <LoadingIcon />
            </div>
        );
    }

    if (hasFireflyAccount) return null;

    if (!profiles.length && !accounts.length) {
        CreateFireflyAccountGuideModalRef.open();
        return null;
    }

    redirect(PageRoute.Signup, RedirectType.replace);
}
