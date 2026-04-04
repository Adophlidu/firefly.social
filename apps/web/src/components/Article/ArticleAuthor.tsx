import { classNames } from '@dimensiondev/utils';
import { type HTMLProps } from 'react';

import { Avatar } from '@/components/Avatar.js';
import { ConditionalLink } from '@/components/ConditionalLink.js';
import { Time } from '@/components/Semantic/Time.js';
import { TimestampFormatter } from '@/components/TimeStampFormatter.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { getArticleAuthorTarget, getArticleAuthorUrl } from '@/helpers/getArticleAuthorUrl.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { resolveArticlePlatformIcon } from '@/helpers/resolveArticlePlatformIcon.js';
import { useEnsName } from '@/hooks/useEnsName.js';
import { type Article } from '@/providers/types/Article.js';

interface Props extends HTMLProps<HTMLDivElement> {
    article: Article;
}

export function ArticleAuthor({ article, ...props }: Props) {
    const { data: ens } = useEnsName(article.author.id, !article.author.handle);
    const Icon = resolveArticlePlatformIcon(article.platform);

    const authorUrl = getArticleAuthorUrl(article);
    const target = getArticleAuthorTarget(article);

    const avatar = (
        <Avatar
            className="size-[15px]"
            src={article.author.avatar}
            size={15}
            alt={article.author.handle || article.author.id}
        />
    );

    const authorName =
        article.author.handle && !isValidAddressEthereum(article.author.handle)
            ? article.author.handle
            : ens || formatAddressEthereum(article.author.id, 4);
    return (
        <div {...props} className={classNames('flex items-center gap-2', props.className)}>
            <ConditionalLink href={authorUrl} className="z-1" target={target}>
                {avatar}
            </ConditionalLink>

            <ConditionalLink
                href={authorUrl}
                className="text-medium text-secondary block truncate leading-5"
                target={target}
            >
                {authorName}
            </ConditionalLink>

            <Time dateTime={article.timestamp} className="text-secondary whitespace-nowrap text-xs leading-4">
                <TimestampFormatter time={article.timestamp} />
            </Time>

            {Icon ? <Icon className="shrink-0" width={15} height={15} /> : null}
        </div>
    );
}
