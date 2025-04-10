import type { SessionClient } from '@lens-protocol/client';
import { enableSignless } from '@lens-protocol/client/actions';

import { ensureLensResult } from '@/helpers/ensureLensResult.js';
import { handleOperationWithLensChain } from '@/helpers/handleOperationWithLensChain.js';

export async function enableSignlessForManaged(sessionClient: SessionClient) {
    const result = await ensureLensResult(enableSignless(sessionClient));
    const txHash = await handleOperationWithLensChain(result, true, sessionClient);
    return txHash;
}
