import { first } from 'lodash-es';

import { KeyType } from '@/constants/enum.js';
import { MAX_POST_SIZE_PER_THREAD } from '@/constants/static.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { getCommentsByPostId } from '@/providers/lens/getCommentsByPostId.js';
import { getLensPostById } from '@/providers/lens/getLensPostById.js';
import { type Post } from '@/providers/types/SocialMedia.js';

async function fetchThreadComments(postId: string, author: Post['author'], maxDepth: number): Promise<Post[]> {
    if (maxDepth === 0) return [];

    const comments = await getCommentsByPostId(postId, undefined, false);
    const firstComment = first(comments.data);

    if (firstComment && isSameProfile(firstComment.author, author)) {
        const rest = await fetchThreadComments(firstComment.postId, author, maxDepth - 1);
        return [firstComment, ...rest];
    }

    return [];
}

async function fetchLensThreadByPostId(postId: string, post?: Post): Promise<Post[]> {
    const currentPost = post ?? (await getLensPostById(postId));
    const rootPost = currentPost.root ?? currentPost.commentOn ?? currentPost;
    const threadComments = await fetchThreadComments(rootPost.postId, rootPost.author, MAX_POST_SIZE_PER_THREAD - 1);

    return [rootPost, ...threadComments];
}

export const getLensThreadByPostId = memoizeWithRedis(fetchLensThreadByPostId, {
    key: KeyType.GetLensThreadByPostId,
    resolver: (postId) => postId,
});
