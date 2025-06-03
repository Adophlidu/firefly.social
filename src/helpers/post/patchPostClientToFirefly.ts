import type { TweetV2 } from 'twitter-api-v2';

import type { Post } from '@/providers/types/SocialMedia.js';
import { getPostsState, getPostState } from '@/services/getPostState.js';

export async function patchPostClientToFirefly(post: Post) {
    const postState = await getPostState(post.postId);
    if (postState?.state && post.sendFrom) {
        post.sendFrom.displayName = 'Firefly';
        post.sendFrom.name = 'Firefly';
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
            post.sendFrom = {
                displayName: 'Firefly',
                name: 'Firefly',
            };
        } else {
            console.error(`No post state found for post ${post.id}`);
        }
    });
    return tweets;
}
