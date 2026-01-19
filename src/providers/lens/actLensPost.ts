import { postId as toPostId } from '@lens-protocol/client';
import { executePostAction } from '@lens-protocol/client/actions';

import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { handleOperationWithLensChain } from '@/providers/lens/handleOperationWithLensChain.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';

export async function actLensPost(postId: string) {
    const result = await ensureLensResult(
        executePostAction(lensSessionClientHolder.sessionClient, {
            post: toPostId(postId),
            action: {
                simpleCollect: { selected: true },
            },
        }),
    );
    await handleOperationWithLensChain(result);
}
