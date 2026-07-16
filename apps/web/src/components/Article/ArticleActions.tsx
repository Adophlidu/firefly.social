'use client';

import { ArticlePlatform, Source } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import { isValidAddressEthereum } from '@dimensiondev/web3/utils';
import { useQuery } from '@tanstack/react-query';
import { memo, useCallback } from 'react';
import urlcat from 'urlcat';

import { Bookmark } from '@/components/Actions/Bookmark.js';
import { LikeButton } from '@/components/Actions/LikeButton.js';
import { ShareAction } from '@/components/Actions/ShareAction.js';
import { Tips } from '@/components/Tips/index.js';
import { getArticleUrl } from '@/helpers/getArticleUrl.js';
import { useEnsName } from '@/hooks/useEnsName.js';
import { useFireflyIdentity } from '@/hooks/useFireflyIdentity.js';
import { useShareUrl } from '@/hooks/useShareUrl.js';
import { useShortShareUrl } from '@/hooks/useShortShareUrl.js';
import { useToggleArticleBookmark } from '@/hooks/useToggleArticleBookmark.js';
import { getArticleById } from '@/providers/firefly/article/getArticleById.js';
import { captureArticleShareClickEvent } from '@/providers/telemetry/captureClickEvent.js';
import type { Article } from '@/providers/types/Article.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

interface ArticleActionsProps {
    article: Article;
    queryDetail?: boolean;
}

export const ArticleActions = memo<ArticleActionsProps>(function ArticleActions({
    article: oldArticle,
    queryDetail = false,
}) {
    const { currentProfileSession } = useFireflyProfileStore();
    const { mutate: onBookmarkChange, isPending: bookmarkMutationLoading } = useToggleArticleBookmark();
    const isMattersArticle = oldArticle.platform === ArticlePlatform.Matters;
    const address = isMattersArticle ? oldArticle.author.info.ethAddress : oldArticle.author.id;
    const isAddress = isValidAddressEthereum(address);
    const identity = useFireflyIdentity(Source.Wallet, address);
    const { data: ens } = useEnsName(address);
    const baseUrl = urlcat(SITE_URL, getArticleUrl(oldArticle));
    const longUrl = useShareUrl(baseUrl);
    const { url, isPending, register } = useShortShareUrl(longUrl);

    const isLogin = !!currentProfileSession?.profileId;
    const { data, isLoading } = useQuery({
        queryKey: ['article-detail', oldArticle.id],
        enabled: queryDetail && isLogin,
        queryFn: () => getArticleById(oldArticle.id),
    });

    const article = data || oldArticle;

    const handleBookmark = useCallback(() => {
        onBookmarkChange(article);
    }, [onBookmarkChange, article]);

    return (
        <div className="flex items-center justify-end text-second">
            <div className="flex items-center">
                <LikeButton type={Source.Article} data={article} />
                <Bookmark
                    loading={isLoading || bookmarkMutationLoading}
                    hiddenCount
                    hasBookmarked={article.hasBookmarked}
                    onClick={handleBookmark}
                />
                {isAddress ? (
                    <Tips identity={identity} handle={article.author.handle || ens} onClick={close} pureWallet />
                ) : null}
                {url ? (
                    <ShareAction
                        link={url}
                        cellType="article"
                        isPending={isPending}
                        onClick={() => {
                            captureArticleShareClickEvent(article.id, identity.id);
                            register();
                        }}
                    />
                ) : null}
            </div>
        </div>
    );
});
