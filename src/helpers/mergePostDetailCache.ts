import { type Post } from '@/providers/types/SocialMedia.js';

/**
 * Merge a new post into the post-detail cache, preserving media attachments
 * and article data from the old cached version when the new data is missing
 * them.  The Twitter v2 API sometimes omits the `includes.media` array for
 * tweets whose media was already delivered in an earlier response, which
 * causes `tweetV2ToPost` to produce an empty attachments list.  Falling back
 * to the previously-cached values prevents images/videos from disappearing.
 */
export function mergePostDetailCache(newPost: Post, oldData: Post | undefined): Post {
    if (!oldData) return newPost;

    const oldContent = oldData.metadata?.content;
    const newContent = newPost.metadata?.content;
    const attachments = newContent?.attachments?.length ? newContent.attachments : oldContent?.attachments;
    const asset = attachments?.length ? attachments[0] : (newContent?.asset ?? oldContent?.asset);

    return {
        ...newPost,
        metadata: {
            ...newPost.metadata,
            article: newPost.metadata?.article ?? oldData.metadata?.article,
            content: newContent
                ? {
                      ...newContent,
                      attachments,
                      asset,
                  }
                : oldContent,
        },
    };
}
