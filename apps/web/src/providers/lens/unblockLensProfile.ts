import { runInSafeAsync } from '@dimensiondev/utils';
import { unmuteAccount } from '@lens-protocol/client/actions';

import { FireflyPlatform } from '@/constants/enum.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { unblockProfileFor } from '@/providers/firefly/farcaster-account/unblockProfileFor.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';

export async function unblockLensProfile(profileId: string) {
    await ensureLensResult(
        unmuteAccount(lensSessionClientHolder.sessionClient, {
            account: safeEvmAddress(profileId),
        }),
    );
    await runInSafeAsync(() => unblockProfileFor(FireflyPlatform.Lens, profileId));
    return true;
}
