'use client';

import { classNames } from '@dimensiondev/utils';
import { useQuery } from '@tanstack/react-query';

import { ThreadBody, type ThreadBodyProps } from '@/components/Posts/ThreadBody.js';
import type { SocialSource } from '@/constants/enum.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';

export interface ThreadBodyWithQuery extends Omit<ThreadBodyProps, 'post'> {
    postId: string;
    source: SocialSource;
}

function ThreadBodyLoading({ isLast = false }: { isLast?: boolean }) {
    return (
        <div className="flex w-full animate-pulse flex-col">
            <div className="flex w-full flex-row items-start">
                <div className="size-10 rounded-full bg-gray-200 dark:border-gray-700" />
                <div className="ml-4 mt-2 h-3 w-[120px] rounded bg-gray-200 dark:border-gray-700" />
            </div>
            <div className="flex w-full">
                <div
                    className={classNames('ml-5 mr-8 border-[0.8px]', {
                        'border-transparent bg-transparent dark:border-transparent dark:bg-none': isLast,
                        'border-gray-300 bg-gray-300 dark:border-gray-700 dark:bg-gray-700': !isLast,
                    })}
                />
                <div className="flex w-full flex-col space-y-3 pb-5">
                    <div className="h-2 w-full rounded bg-gray-200 dark:border-gray-700" />
                    <div className="h-2 w-2/3 rounded bg-gray-200 dark:border-gray-700" />
                </div>
            </div>
        </div>
    );
}

export function ThreadBodyWithQuery({ postId, source, ...rest }: ThreadBodyWithQuery) {
    const { data: post, isLoading } = useQuery({
        queryKey: [source, 'post-detail', postId],
        queryFn: async () => {
            const provider = resolveSocialMediaProvider(source);
            return provider.getPostById(postId);
        },
        retry: 1,
    });
    if (isLoading) {
        return <ThreadBodyLoading isLast={rest.isLast} />;
    }
    if (!post) return null;
    return <ThreadBody post={post} {...rest} />;
}
