import { deletePost } from '@lens-protocol/client/actions';

import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { handleOperationWithLensChain } from '@/providers/lens/handleOperationWithLensChain.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';

export async function deleteLensPost(postId: string): Promise<boolean> {
    const result = await ensureLensResult(deletePost(lensSessionClientHolder.sessionClient, { post: postId }));
    await handleOperationWithLensChain(result);
    return true;
}
