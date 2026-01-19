import { undoBookmarkPost } from '@lens-protocol/client/actions';

import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';

export async function unbookmarkLensPost(postId: string): Promise<boolean> {
    await ensureLensResult(
        undoBookmarkPost(lensSessionClientHolder.sessionClient, {
            post: postId,
        }),
    );
    return true;
}
