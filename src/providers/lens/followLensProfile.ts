import { follow } from '@lens-protocol/client/actions';

import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { handleOperationWithLensChain } from '@/providers/lens/handleOperationWithLensChain.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';

export async function followLensProfile(profileId: string): Promise<boolean> {
    const result = await ensureLensResult(
        follow(lensSessionClientHolder.sessionClient, { account: safeEvmAddress(profileId) }),
    );
    await handleOperationWithLensChain(result);
    return true;
}
