import { type HTMLProps, memo, useCallback } from 'react';

import { Bookmark } from '@/components/Actions/Bookmark.js';
import { BookmarkMenuItem } from '@/components/Actions/BookmarkMenuItem.js';
import { BookmarkType } from '@/constants/enum.js';
import { resolveFireflyPlatformFromSocialSource } from '@/helpers/resolveFireflyPlatform.js';
import { useHasBookmarked } from '@/hooks/useHasBookmarked.js';
import { useToggleBookmark } from '@/hooks/useToggleBookmark.js';
import { type Post } from '@/providers/types/SocialMedia.js';

interface PostBookmarkProps extends HTMLProps<HTMLButtonElement> {
    post: Post;
    onlyIcon?: boolean;
    onClick?: () => void;
}

export const PostBookmark = memo(function PostBookmark({
    post,
    disabled,
    onlyIcon = true,
    onClick,
}: PostBookmarkProps) {
    const { postId, source, hasBookmarked } = post;

    const { data, isLoading } = useHasBookmarked(
        resolveFireflyPlatformFromSocialSource(source),
        postId,
        BookmarkType.Text,
        hasBookmarked !== undefined,
    );

    const mutation = useToggleBookmark(source);
    const onToggle = useCallback(() => {
        mutation.mutate({ ...post, hasBookmarked: post.hasBookmarked ?? data });
        onClick?.();
    }, [mutation, post, data, onClick]);

    if (onlyIcon) {
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

    return <BookmarkMenuItem hasBookmarked={hasBookmarked ?? data} onClick={onToggle} loading={isLoading} />;
});
