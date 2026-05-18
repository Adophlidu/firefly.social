import { Source } from '@dimensiondev/enums';
import type { FireflyPost } from '@dimensiondev/workers-shared/types/firefly.js';

import { resolvePostUrl } from '@/metadata/src/post/resolvePostUrl.js';

export function getPostPathname(post: FireflyPost) {
    const id = post.source === Source.Lens && post.slug ? post.slug : post.postId;

    return resolvePostUrl(post.source, id);
}
