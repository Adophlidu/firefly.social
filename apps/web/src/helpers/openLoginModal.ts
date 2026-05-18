import { SessionType, STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs';
import { bom } from '@dimensiondev/utils';

import { getCurrentAvailableSources } from '@/helpers/getCurrentAvailableSources.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { isPathnameForceRedirect } from '@/helpers/isPathnameForceRedirect.js';
import { CreateFireflyAccountGuideModalRef } from '@/modals/CreateFireflyAccountGuideModal/refs.js';
import { type LoginModalOpenProps, LoginModalRef } from '@/modals/LoginModal/refs.js';
import { usePreferencesState } from '@/store/usePreferenceStore.js';

export function openLoginModal(props: LoginModalOpenProps | void, forceOpen = false) {
    if (envs.external.NEXT_PUBLIC_FORCE_SIGNUP !== STATUS.Enabled) {
        LoginModalRef.open(props);
        return;
    }

    const pathname = bom?.location?.pathname;
    const { preferences } = usePreferencesState.getState();
    const sources = getCurrentAvailableSources();

    const accountId = getSessionFromStorage(SessionType.Firefly)?.profileId;
    const hasChecked = preferences.FIREFLY_ACCOUNT_CHECKED_MAP[accountId || ''];

    if (hasChecked || sources.length || !pathname || isPathnameForceRedirect(pathname) || forceOpen) {
        LoginModalRef.open(props);
        return;
    }

    CreateFireflyAccountGuideModalRef.open();
    return;
}
