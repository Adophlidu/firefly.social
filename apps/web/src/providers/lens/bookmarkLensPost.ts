import { bookmarkPost } from '@lens-protocol/client/actions';

import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';

export async function bookmarkLensPost(postId: string): Promise<boolean> {
    await ensureLensResult(
        bookmarkPost(lensSessionClientHolder.sessionClient, {
            post: postId,
        }),
    );
    return true;
}
