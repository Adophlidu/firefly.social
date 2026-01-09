'use client';

import { classNames } from '@dimensiondev/utils';
import { motion } from 'framer-motion';
import { memo } from 'react';

import { PostBody } from '@/components/Posts/PostBody.js';
import { PostHeader } from '@/components/Posts/PostHeader.js';
import { useRouter } from '@/esm/navigation.js';
import { getPostUrl } from '@/helpers/getPostUrl.js';
import { openWindow } from '@/helpers/openWindow.js';
import { type Post } from '@/providers/types/SocialMedia.js';

interface QuoteProps {
    post: Post;
    className?: string;
    isInCompose?: boolean;
}

export const Quote = memo<QuoteProps>(function Quote({ post, className = '', isInCompose }) {
    const router = useRouter();
    return (
        <motion.article
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={classNames('mt-3 cursor-pointer rounded-2xl border border-secondaryLine p-3', className)}
            onClick={(event) => {
                event.stopPropagation();

                const selection = window.getSelection();
                if (selection && selection.toString().length !== 0) return;
                if (post.isTruthSocial) {
                    openWindow(post.permalink);
                    return;
                }

                router.push(getPostUrl(post));
            }}
        >
            <PostHeader post={post} isQuote />
            <PostBody
                isInCompose={isInCompose}
                post={post}
                isQuote
                disablePadding={post.isHidden || post.isEncrypted}
            />
        </motion.article>
    );
});
