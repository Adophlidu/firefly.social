import { muteAccount } from '@lens-protocol/client/actions';

import { FireflyPlatform } from '@/constants/enum.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { blockProfileFor } from '@/providers/firefly/farcaster-account/blockProfileFor.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';

export async function blockLensProfile(profileId: string) {
    await ensureLensResult(muteAccount(lensSessionClientHolder.sessionClient, { account: safeEvmAddress(profileId) }));
    await runInSafeAsync(() => blockProfileFor(FireflyPlatform.Lens, profileId));
    return true;
}
