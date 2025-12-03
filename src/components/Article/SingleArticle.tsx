import { classNames } from '@dimensiondev/utils';
import { useQuery } from '@tanstack/react-query';
import { first, isUndefined } from 'lodash-es';
import { memo, useCallback } from 'react';
import { useMount } from 'react-use';
import urlcat from 'urlcat';

import { ActivityCellArticleAction } from '@/components/ActivityCell/Article/ActivityCellArticleAction.js';
import { ArticleBody } from '@/components/Article/ArticleBody.js';
import { SingleArticleHeader } from '@/components/Article/SingleArticleHeader.js';
import { FeedFollowSource } from '@/components/FeedFollowSource.js';
import { CollapsedContent } from '@/components/Posts/CollapsedContent.js';
import { queryClient } from '@/configs/queryClient.js';
import { Source } from '@/constants/enum.js';
import { FIREFLY_WORKER_HOST } from '@/constants/index.js';
import { useRouter } from '@/esm/navigation.js';
import { extractFirstImageFromHtml } from '@/helpers/extractFirstImageFromHtml.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getArticleUrl } from '@/helpers/getArticleUrl.js';
import { useFireflyIdentity } from '@/hooks/useFireflyIdentity.js';
import { captureArticleClickEvent } from '@/providers/telemetry/captureClickEvent.js';
import { type Article, ArticlePlatform } from '@/providers/types/Article.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import { type LinkDigested, PayloadType } from '@/types/og.js';
import type { ResponseJson } from '@/types/utility.js';

export interface SingleArticleProps {
    article: Article;
    listKey?: string;
    index?: number;
    isBookmark?: boolean;
}

export const SingleArticle = memo<SingleArticleProps>(function SingleArticleProps({
    article,
    listKey,
    index,
    isBookmark,
}) {
    const router = useRouter();
    const setScrollIndex = useGlobalState.use.setScrollIndex();
    const identity = useFireflyIdentity(Source.Wallet, article.author.id);

    const cover = useQuery({
        queryKey: ['article', 'cover', article.id],
        queryFn: async () => {
            if (article.coverUrl) return article.coverUrl;
            if (article.platform === ArticlePlatform.Mirror && article.origin) {
                const payload = await fetchJson<ResponseJson<LinkDigested>>(
                    urlcat(FIREFLY_WORKER_HOST, '/oembed', {
                        link: article.origin,
                    }),
                );
                if (payload.success && payload.data.payload?.type === PayloadType.Mirror) {
                    return payload.data.payload.cover;
                }
            }
            if (article.platform === ArticlePlatform.Matters && article.htmlContent) {
                return extractFirstImageFromHtml(article.htmlContent);
            }
            return null;
        },
    });

    useMount(() => {
        if (!article.id) return;
        queryClient.setQueryData(['article-detail', article.id], article);
    });

    const isMuted = article.author.isMuted;

    const handleClick = useCallback(() => {
        if (isMuted) return;
        const selection = window.getSelection();
        if (selection && selection.toString().length !== 0) return;
        if (listKey && !isUndefined(index)) setScrollIndex(listKey, index);

        captureArticleClickEvent(article.platform, identity.id);

        router.push(getArticleUrl(article));
        return;
    }, [article, index, isMuted, listKey, router, setScrollIndex, identity.id]);

    const handleLinkClick = useCallback(() => {
        if (listKey && !isUndefined(index)) setScrollIndex(listKey, index);
    }, [listKey, index, setScrollIndex]);

    return (
        <article
            className={classNames(
                'border-b border-line bg-bottom px-3 py-2 hover:bg-bg max-md:px-4 max-md:py-3 md:px-4 md:py-3',
                {
                    'cursor-pointer': !isMuted,
                },
            )}
            onClick={handleClick}
        >
            {!isBookmark ? <FeedFollowSource source={first(article.followingSources)} /> : null}
            <SingleArticleHeader article={article} isBookmark={isBookmark} onClickLink={handleLinkClick} />
            {isMuted ? (
                <CollapsedContent className="mt-2 pl-[52px]" authorMuted isQuote={false} />
            ) : (
                <div className="-mt-2 pl-[52px]">
                    {!isBookmark ? <ActivityCellArticleAction type={article.type} platform={article.platform} /> : null}
                    <ArticleBody onClick={handleClick} cover={cover?.data ?? undefined} article={article} />
                </div>
            )}
        </article>
    );
});
