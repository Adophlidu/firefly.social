import { SessionClient, type TxHash } from '@lens-protocol/client';

import { ensureLensResult } from '@/helpers/ensureLensResult.js';

/**
 * Waits a transaction to complete (for lens only).
 * @param client A lens client instance
 * @param hash lens transaction hash
 * @returns
 */
export async function waitUntilComplete(client: SessionClient, hash: string | null) {
    if (!hash) throw new Error('The transaction hash is missing.');

    const resultHash = await ensureLensResult(client.waitForTransaction(hash as TxHash));
    return;
}
