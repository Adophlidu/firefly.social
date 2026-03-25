'use client';

import { classNames } from '@dimensiondev/utils';
import { motion } from 'framer-motion';
import { isUndefined } from 'lodash-es';
import { memo } from 'react';

import { PostBody } from '@/components/Posts/PostBody.js';
import { PostHeader } from '@/components/Posts/PostHeader.js';
import { useRouter } from '@/esm/navigation.js';
import { getPostUrl } from '@/helpers/getPostUrl.js';
import { openWindow } from '@/helpers/openWindow.js';
import { type Post } from '@/providers/types/SocialMedia.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

interface QuoteProps {
    post: Post;
    className?: string;
    isInCompose?: boolean;
    listKey?: string;
    index?: number;
}

export const Quote = memo<QuoteProps>(function Quote({ post, className = '', isInCompose, listKey, index }) {
    const router = useRouter();
    const setScrollIndex = useGlobalState.use.setScrollIndex();
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

                if (listKey && !isUndefined(index)) setScrollIndex(listKey, index);
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
