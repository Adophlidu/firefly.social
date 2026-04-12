import { EMPTY_LIST } from '@dimensiondev/constants';
import { memo, useMemo } from 'react';

import { PostMarkup } from '@/components/Markup/PostMarkup.js';
import { Attachments } from '@/components/Posts/Attachment.js';
import { PostLinks } from '@/components/Posts/PostLinks.js';
import { removeAtEnd } from '@/helpers/removeAtEnd.js';
import { resolveOembedUrl } from '@/helpers/resolveOembedUrl.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface NotificationPostBodyProps {
    post: Post;
}

export const NotificationPostBody = memo<NotificationPostBodyProps>(function NotificationPostBody({ post }) {
    const oembedUrl = resolveOembedUrl(post);
    const postContent = useMemo(() => {
        const base = post.metadata.content?.truncatedContent || post.metadata.content?.content || '';
        if (oembedUrl) {
            return removeAtEnd(base, oembedUrl).trimEnd();
        }
        return base;
    }, [post.metadata.content?.truncatedContent, post.metadata.content?.content, oembedUrl]);
    const attachments = post.metadata.content?.attachments ?? EMPTY_LIST;

    return (
        <>
            <PostMarkup post={post} canShowMore={false} content={postContent} />
            <Attachments post={post} attachments={attachments} />
            <PostLinks post={post} />
        </>
    );
});
