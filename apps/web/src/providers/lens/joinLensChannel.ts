import { joinGroup as joinLensGroup } from '@lens-protocol/client/actions';

import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { handleOperationWithLensChain } from '@/providers/lens/handleOperationWithLensChain.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import { type Channel } from '@/providers/types/SocialMedia.js';

export async function joinLensChannel(channel: Channel): Promise<boolean> {
    const result = await ensureLensResult(
        joinLensGroup(lensSessionClientHolder.sessionClient, {
            group: safeEvmAddress(channel.id),
        }),
    );
    await handleOperationWithLensChain(result);
    return true;
}
