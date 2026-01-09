import { memo } from 'react';

import { PostMarkup } from '@/components/Markup/PostMarkup.js';
import { Attachments } from '@/components/Posts/Attachment.js';
import { PostLinks } from '@/components/Posts/PostLinks.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { type Post } from '@/providers/types/SocialMedia.js';

interface NotificationPostBodyProps {
    post: Post;
}

export const NotificationPostBody = memo<NotificationPostBodyProps>(function NotificationPostBody({ post }) {
    const postContent = post.metadata.content?.truncatedContent || post.metadata.content?.content || '';
    const attachments = post.metadata.content?.attachments ?? EMPTY_LIST;

    return (
        <>
            <PostMarkup post={post} canShowMore={false} content={postContent} />
            <Attachments post={post} attachments={attachments} />
            <PostLinks post={post} />
        </>
    );
});
