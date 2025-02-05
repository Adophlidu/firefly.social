'use client';

import { isUndefined } from 'lodash-es';
import { type HTMLProps, memo } from 'react';

import { NakedMarkup } from '@/components/Markup/NakedMarkup.js';
import { PostHeader } from '@/components/Posts/PostHeader.js';
import { IS_APPLE, IS_SAFARI } from '@/constants/bowser.js';
import { Link } from '@/esm/Link.js';
import { classNames } from '@/helpers/classNames.js';
import { getPostUrl } from '@/helpers/getPostUrl.js';
import { type Post } from '@/providers/types/SocialMedia.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

export interface PostDigestProps extends HTMLProps<HTMLDivElement> {
    post: Post;
    listKey?: string;
    index?: number;
}
export const PostDigest = memo<PostDigestProps>(function PostDigest({ post, listKey, index, className }) {
    const postLink = getPostUrl(post);

    return (
        <Link
            className={classNames(
                'cursor-pointer border-b border-line bg-bottom px-3 py-2 hover:bg-bg md:px-4 md:py-3',
                className,
            )}
            href={postLink}
        >
            <PostHeader
                isComment={false}
                post={post}
                onClickProfileLink={() => {
                    if (listKey && !isUndefined(index)) useGlobalState.getState().setScrollIndex(listKey, index);
                }}
            />

            <NakedMarkup
                post={post}
                className={classNames(
                    'linkify line-clamp-4 w-full self-stretch break-words text-left text-medium opacity-75',
                    {
                        'max-h-[7.8rem]': IS_SAFARI && IS_APPLE,
                    },
                )}
            >
                {post.metadata.content?.content}
            </NakedMarkup>
        </Link>
    );
});
