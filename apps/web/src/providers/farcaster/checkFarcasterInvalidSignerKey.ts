import { FarcasterSignType, Source } from '@dimensiondev/enums';

import { FarcasterInvalidSignerKey } from '@/constants/error.js';
import { openLoginModalWithGuard } from '@/helpers/openLoginModal.js';

export function checkFarcasterInvalidSignerKey(error: unknown) {
    if (error instanceof FarcasterInvalidSignerKey) {
        openLoginModalWithGuard({
            source: Source.Farcaster,
            options: {
                expectedSignType: FarcasterSignType.GrantPermission,
            },
        });
    }
}
