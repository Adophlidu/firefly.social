import { classNames } from '@dimensiondev/utils';

import { Markup } from '@/components/Markup/Markup.js';
import { type Post } from '@/providers/types/SocialMedia.js';

interface PostMarkupProps {
    post: Post;
    content: string;
    canShowMore: boolean;
}

export function PostMarkup({ post, content, canShowMore }: PostMarkupProps) {
    return (
        <Markup
            post={post}
            className={classNames(
                { 'line-clamp-5': canShowMore, 'single-post': canShowMore },
                'markup text-medium break-words',
            )}
        >
            {`${content}${post.incomplete ? ` #SYSTOGGLEMORE` : ''}`}
        </Markup>
    );
}
