import { type ReactNode } from 'react';

import { Link } from '@/components/Link.js';
import { getPostImageUrl } from '@/helpers/getPostImageUrl.js';
import { stopPropagation } from '@/helpers/stopEvent.js';
import { useIsPostDetailPage } from '@/hooks/post/useIsPostDetailPage.js';
import { PreviewMediaModalRef } from '@/modals/PreviewMediaModal/refs.js';
import { type Post } from '@/providers/types/SocialMedia.js';

interface WithPreviewLinkProps {
    post: Post;
    index: number;
    disablePreview?: boolean;
    children: ReactNode;
    useModal?: boolean;
    prefetch?: boolean;
}

export function WithPreviewLink({
    disablePreview = false,
    children,
    post,
    index,
    useModal = false,
    prefetch = false,
}: WithPreviewLinkProps) {
    const isPostPage = useIsPostDetailPage();

    const openPreviewModal = () => {
        PreviewMediaModalRef.open({
            post,
            index,
            source: post.source,
        });
    };

    return !disablePreview && !useModal ? (
        <Link
            prefetch={prefetch}
            href={getPostImageUrl(post, index, isPostPage)}
            scroll={false}
            onClick={stopPropagation}
        >
            {children}
        </Link>
    ) : (
        <span
            onClick={(event) => {
                event.stopPropagation();
                if (disablePreview) return;
                openPreviewModal();
            }}
        >
            {children}
        </span>
    );
}
