'use client';

import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';

import { ArticleMoreAction } from '@/components/Actions/ArticleMore.js';
import { ActivityCellHeader } from '@/components/ActivityCell/ActivityCellHeader.js';
import { Avatar } from '@/components/Avatar.js';
import { Link } from '@/components/Link.js';
import { getArticleAuthorTarget, getArticleAuthorUrl } from '@/helpers/getArticleAuthorUrl.js';
import { getWalletProfileAvatar } from '@/helpers/getWalletProfileAvatar.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { resolveArticlePlatformIcon } from '@/helpers/resolveArticlePlatformIcon.js';
import { stopPropagation } from '@/helpers/stopEvent.js';
import { useEnsName } from '@/hooks/useEnsName.js';
import { type Article, ArticlePlatform } from '@/providers/types/Article.js';

interface SingleArticleHeaderProps {
    article: Article;
    className?: string;
    isBookmark?: boolean;
}

export const SingleArticleHeader = memo<SingleArticleHeaderProps>(function SingleArticleHeader({
    article,
    className,
    isBookmark,
}) {
    const authorUrl = getArticleAuthorUrl(article);
    const target = getArticleAuthorTarget(article);

    const Icon = !isBookmark ? resolveArticlePlatformIcon(article.platform) : null;
    const isMattersArticle = article.platform === ArticlePlatform.Matters;
    const address =
        isMattersArticle && isValidAddressEthereum(article.author.info.ethAddress)
            ? article.author.info.ethAddress
            : article.author.id;
    const { data: ens } = useEnsName(address, !article.author.handle);

    const avatarProps = {
        className: 'size-10',
        src: getWalletProfileAvatar(article.displayInfo) || article.author.avatar,
        size: 40,
        alt: article.author.handle || article.author.id,
    };

    return (
        <header className={classNames('flex w-full min-w-0 items-start gap-3', className)}>
            <Link href={authorUrl} className="z-1" onClick={stopPropagation} target={target}>
                <Avatar
                    className={avatarProps.className}
                    src={avatarProps.src}
                    size={avatarProps.size}
                    alt={avatarProps.alt}
                />
            </Link>

            <ActivityCellHeader
                className="w-full min-w-0"
                address={article.author.id}
                displayName={ens || article.author.handle}
                time={!isBookmark ? article.timestamp : undefined}
                icon={Icon ? <Icon className="shrink-0" width={15} height={15} /> : null}
                username={article.author.username}
                authorUrl={authorUrl}
                target={target}
            >
                {!isBookmark ? <ArticleMoreAction article={article} /> : null}
            </ActivityCellHeader>
        </header>
    );
});
