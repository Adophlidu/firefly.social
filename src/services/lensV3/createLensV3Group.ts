import type { Group, TxHash } from '@lens-protocol/client';
import { createGroup, fetchGroup } from '@lens-protocol/client/actions';
import { group, type GroupOptions } from '@lens-protocol/metadata';

import { ensureLensResult } from '@/helpers/ensureLensResult.js';
import { handleOperationWithLensChain } from '@/helpers/handleOperationWithLensChain.js';
import { GroveStorageProvider } from '@/providers/lens/Grove.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';

async function uploadGroupMetadata(options: GroupOptions) {
    const metadata = group(options);

    return GroveStorageProvider.uploadJson(metadata);
}

export async function createLensV3Group(options: GroupOptions): Promise<{
    txHash: TxHash;
    group: Group | null;
}> {
    const { uri } = await uploadGroupMetadata(options);

    const result = await ensureLensResult(
        createGroup(lensSessionHolder.sessionClient, {
            metadataUri: uri,
        }),
    );
    const txHash = await handleOperationWithLensChain(result);
    const newGroup = await ensureLensResult(fetchGroup(lensSessionHolder.sessionClient, { txHash }));

    return { txHash, group: newGroup };
}
