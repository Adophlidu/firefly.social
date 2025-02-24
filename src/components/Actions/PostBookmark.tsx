import { useCallback } from 'react';

import { Bookmark } from '@/components/Actions/Bookmark.js';
import { BookmarkType } from '@/constants/enum.js';
import { resolveFireflyPlatformFromSocialSource } from '@/helpers/resolveFireflyPlatform.js';
import { useHasBookmarked } from '@/hooks/useHasBookmarked.js';
import { useToggleBookmark } from '@/hooks/useToggleBookmark.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface PostBookmarkProps {
    post: Post;
    disabled?: boolean;
}

export function PostBookmark({ post, disabled }: PostBookmarkProps) {
    const { postId, source, hasBookmarked } = post;

    const { data, isLoading } = useHasBookmarked(
        resolveFireflyPlatformFromSocialSource(source),
        postId,
        BookmarkType.Text,
        hasBookmarked !== undefined,
    );

    const mutation = useToggleBookmark(source);
    const onToggle = useCallback(() => {
        mutation.mutate(post);
    }, [mutation, post]);

    return (
        <Bookmark
            hasBookmarked={hasBookmarked ?? data}
            onClick={onToggle}
            count={post.stats?.bookmarks}
            disabled={disabled}
            loading={isLoading}
            hiddenCount
        />
    );
}
