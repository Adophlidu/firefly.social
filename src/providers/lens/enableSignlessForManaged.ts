import type { SessionClient } from '@lens-protocol/client';
import { enableSignless } from '@lens-protocol/client/actions';

import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { handleOperationWithLensChain } from '@/providers/lens/handleOperationWithLensChain.js';

export async function enableSignlessForManaged(sessionClient: SessionClient) {
    const result = await ensureLensResult(enableSignless(sessionClient));
    const txHash = await handleOperationWithLensChain(result, true, sessionClient);
    return txHash;
}
