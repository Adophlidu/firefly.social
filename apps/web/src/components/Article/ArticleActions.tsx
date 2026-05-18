'use client';

import { Source } from '@dimensiondev/enums';
import { NetworkType } from '@dimensiondev/web3/enums';
import { isValidAddressEthereum } from '@dimensiondev/web3/utils';
import { useQuery } from '@tanstack/react-query';
import { memo, useCallback } from 'react';
import urlcat from 'urlcat';
import { useConnection } from 'wagmi';

import { Bookmark } from '@/components/Actions/Bookmark.js';
import { LikeButton } from '@/components/Actions/LikeButton.js';
import { ShareAction } from '@/components/Actions/ShareAction.js';
import { ArticleCollect } from '@/components/Article/ArticleCollect.js';
import { Tips } from '@/components/Tips/index.js';
import { getArticleUrl } from '@/helpers/getArticleUrl.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { useEnsName } from '@/hooks/useEnsName.js';
import { useFireflyIdentity } from '@/hooks/useFireflyIdentity.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useShareUrl } from '@/hooks/useShareUrl.js';
import { useToggleArticleBookmark } from '@/hooks/useToggleArticleBookmark.js';
import { CollectArticleModalRef } from '@/modals/CollectArticleModal/refs.js';
import { DraggablePopoverRef } from '@/modals/DraggablePopover/refs.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/refs.js';
import { getArticleById } from '@/providers/firefly/article/getArticleById.js';
import { captureArticleShareClickEvent } from '@/providers/telemetry/captureClickEvent.js';
import { type Article, ArticlePlatform } from '@/providers/types/Article.js';
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
    const account = useConnection();
    const { mutate: onBookmarkChange, isPending: bookmarkMutationLoading } = useToggleArticleBookmark();
    const isMattersArticle = oldArticle.platform === ArticlePlatform.Matters;
    const address = isMattersArticle ? oldArticle.author.info.ethAddress : oldArticle.author.id;
    const isAddress = isValidAddressEthereum(address);
    const identity = useFireflyIdentity(Source.Wallet, address);
    const { data: ens } = useEnsName(address);
    const isMedium = useIsMedium();
    const baseUrl = urlcat(location.origin, getArticleUrl(oldArticle));
    const url = useShareUrl(baseUrl);

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

    const onCollect = () => {
        if (!isLogin) {
            openLoginModal();
            return;
        }
        if (!account.isConnected) {
            WalletConnectModalRef.open({ networkType: NetworkType.Ethereum });
            return;
        }
        if (isMedium) {
            CollectArticleModalRef.open({
                article,
            });
        } else {
            DraggablePopoverRef.open({
                content: <ArticleCollect article={article} />,
            });
        }
    };

    return (
        <div className="text-second flex items-center justify-end">
            <div className="flex items-center">
                <LikeButton type={Source.Article} data={article} />
                {/* TODO: Collect feature temporarily hidden, may be needed later
                <ClickableArea
                    className={classNames('flex w-min items-center hover:text-secondarySuccess md:space-x-2')}
                >
                    {!(article.platform === ArticlePlatform.Paragraph && !article.origin) &&
                    article.platform !== ArticlePlatform.Limo &&
                    !isMattersArticle ? (
                        <Tooltip content={<Trans>Collect</Trans>} placement="top">
                            <motion.button
                                onClick={onCollect}
                                className="inline-flex size-7 items-center justify-center rounded-full hover:bg-secondarySuccess/[.20]"
                                whileTap={{ scale: 0.9 }}
                            >
                                <CollectIcon width={17} height={16} className="text-second" />
                            </motion.button>
                        </Tooltip>
                    ) : null}
                </ClickableArea>
                */}
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
                    <ShareAction link={url} onClick={() => captureArticleShareClickEvent(article.id, identity.id)} />
                ) : null}
            </div>
        </div>
    );
});
