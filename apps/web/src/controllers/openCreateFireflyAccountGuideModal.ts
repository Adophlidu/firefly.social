import { PageRoute } from '@dimensiondev/enums';

import { IS_MOBILE_DEVICE } from '@/constants/browser.js';
import { dispatchModalEvent } from '@/controllers/dispatchModalEvent.js';

export function openCreateFireflyAccountGuideModal() {
    if (IS_MOBILE_DEVICE) {
        location.href = PageRoute.Signup;
        return;
    }
    dispatchModalEvent('create-firefly-account-guide-modal', 'open', undefined);
}
