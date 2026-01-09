'use client';

import { memo } from 'react';

import { PostBodyContent, type PostBodyContentProps } from '@/components/Posts/PostBodyContent.js';
import { PostBodyDecryption } from '@/components/Posts/PostBodyDecryption.js';
import { PostBodyModeration } from '@/components/Posts/PostBodyModeration.js';

export const PostBody = memo(function PostBody({ ref, ...props }: PostBodyContentProps) {
    const { post } = props;

    if (post.isModerated) return <PostBodyModeration {...props} post={post} ref={ref} />;
    if (post.isEncrypted) return <PostBodyDecryption {...props} post={post} ref={ref} />;
    return <PostBodyContent {...props} post={post} ref={ref} />;
});
