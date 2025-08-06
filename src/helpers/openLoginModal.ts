import { PageRoute, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { bom } from '@/helpers/bom.js';
import { getCurrentAvailableSources } from '@/helpers/getCurrentAvailableSources.js';
import { CreateFireflyAccountGuideModalRef } from '@/modals/CreateFireflyAccountGuideModal/index.js';
import type { LoginModalOpenProps } from '@/modals/LoginModal/index.js';
import { LoginModalRef } from '@/modals/LoginModal/index.js';
import { usePreferencesState } from '@/store/usePreferenceStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

export function isPathnameForceRedirect(pathname: string): boolean {
    return [PageRoute.Home, PageRoute.FollowingPosts, PageRoute.DiscoverPosts].includes(pathname as PageRoute);
}

export function openLoginModal(props: LoginModalOpenProps | void) {
    if (env.external.NEXT_PUBLIC_FORCE_SIGNUP !== STATUS.Enabled) {
        LoginModalRef.open(props);
        return;
    }

    const pathname = bom?.location?.pathname;
    const { currentProfileSession } = useFireflyProfileStore.getState();
    const { preferences } = usePreferencesState.getState();
    const sources = getCurrentAvailableSources();

    const accountId = currentProfileSession?.profileId;
    const hasChecked = preferences.FIREFLY_ACCOUNT_CHECKED_MAP[accountId || ''];

    if (hasChecked || sources.length || !pathname || isPathnameForceRedirect(pathname)) {
        LoginModalRef.open(props);
        return;
    }

    CreateFireflyAccountGuideModalRef.open();
    return;
}
