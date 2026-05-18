import { FarcasterSignType, Source } from '@dimensiondev/enums';

import { FarcasterInvalidSignerKey } from '@/constants/error.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';

export function checkFarcasterInvalidSignerKey(error: unknown) {
    if (error instanceof FarcasterInvalidSignerKey) {
        openLoginModal({
            source: Source.Farcaster,
            options: {
                expectedSignType: FarcasterSignType.GrantPermission,
            },
        });
    }
}
