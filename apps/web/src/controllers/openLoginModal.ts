import { SessionType, STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { bom } from '@dimensiondev/utils';

import { dispatchModalEvent, openAndWaitForCloseModalEvent } from '@/controllers/dispatchModalEvent.js';
import { openCreateFireflyAccountGuideModal } from '@/controllers/openCreateFireflyAccountGuideModal.js';
import { getCurrentAvailableSources } from '@/helpers/getCurrentAvailableSources.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { isPathnameForceRedirect } from '@/helpers/isPathnameForceRedirect.js';
import type { LoginModalCloseProps, LoginModalOpenProps } from '@/modals/LoginModal/refs.js';
import { usePreferencesState } from '@/store/usePreferenceStore.js';

export function openLoginModal(props: LoginModalOpenProps | void) {
    dispatchModalEvent('login-modal', 'open', props);
}

export function closeLoginModal() {
    dispatchModalEvent('login-modal', 'close', undefined);
}

export function openAndWaitForCloseLoginModal(props?: LoginModalOpenProps) {
    return openAndWaitForCloseModalEvent('login-modal', props) as Promise<LoginModalCloseProps>;
}

export function openLoginModalWithGuard(props: LoginModalOpenProps | void, forceOpen = false) {
    if (envs.external.NEXT_PUBLIC_FORCE_SIGNUP !== STATUS.Enabled) {
        openLoginModal(props);
        return;
    }

    const pathname = bom?.location?.pathname;
    const { preferences } = usePreferencesState.getState();
    const sources = getCurrentAvailableSources();

    const accountId = getSessionFromStorage(SessionType.Firefly)?.profileId;
    const hasChecked = preferences.FIREFLY_ACCOUNT_CHECKED_MAP[accountId || ''];

    if (hasChecked || sources.length || !pathname || isPathnameForceRedirect(pathname) || forceOpen) {
        openLoginModal(props);
        return;
    }

    openCreateFireflyAccountGuideModal();
}
