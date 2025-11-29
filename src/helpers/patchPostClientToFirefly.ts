import type { TweetV2 } from 'twitter-api-v2';

import { getPostsState, getPostState } from '@/providers/firefly/endpoint/getPostState.js';
import type { Post } from '@/providers/types/SocialMedia.js';

function patchPostClient<T extends Pick<Post, 'sendFrom'>>(item: T) {
    item.sendFrom = {
        displayName: 'Firefly',
        name: 'Firefly',
    };
}

export async function patchPostClientToFirefly<T extends Post | undefined>(post: T): Promise<T> {
    if (!post || post.sendFrom) return post;
    const postState = await getPostState(post.postId);
    if (postState?.state) {
        patchPostClient(post);
    }
    return post;
}

export async function patchTweetsClientToFirefly(tweets: TweetV2[]) {
    if (!tweets.length) return tweets;
    const postIds = tweets.map((post) => post.id);
    const postStates = await getPostsState(postIds);
    if (!postStates?.length) return tweets;
    const map = new Map(
        postStates.filter((postState) => postState.state).map((postState) => [postState.post_id, postState.state]),
    );
    tweets.forEach((post) => {
        if (map.has(post.id)) {
            patchPostClient(post);
        }
    });
    return tweets;
}

export async function patchPostsClientToFirefly(posts: Post[]) {
    if (!posts.length) return posts;
    const postIds = posts.filter((post) => !post.sendFrom).map((post) => post.postId);
    if (!postIds.length) return posts;
    const postStates = await getPostsState(postIds);
    if (!postStates?.length) return posts;
    const map = new Map(
        postStates.filter((postState) => postState.state).map((postState) => [postState.post_id, postState.state]),
    );
    posts.forEach((post) => {
        if (map.has(post.postId)) {
            patchPostClient(post);
        }
    });
    return posts;
}
