import { Avatar } from '@/components/Avatar.js';
import { ConditionalLink } from '@/components/ConditionalLink.js';
import { Time } from '@/components/Semantic/Time.js';
import { TimestampFormatter } from '@/components/TimeStampFormatter.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { getArticleAuthorTarget, getArticleAuthorUrl } from '@/helpers/getArticleAuthorUrl.js';
import { resolveArticlePlatformIcon } from '@/helpers/resolveArticlePlatformIcon.js';
import { useEnsName } from '@/hooks/useEnsName.js';
import { type Article } from '@/providers/types/Article.js';

interface Props {
    article: Article;
}

export function ArticleAuthor({ article }: Props) {
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

    const authorName = article.author.handle || ens || formatAddressEthereum(article.author.id, 4);

    return (
        <div className="flex items-center gap-2">
            <ConditionalLink href={authorUrl} className="z-1" target={target}>
                {avatar}
            </ConditionalLink>

            <ConditionalLink
                href={authorUrl}
                className="block truncate text-medium leading-5 text-secondary"
                target={target}
            >
                {authorName}
            </ConditionalLink>

            <Time dateTime={article.timestamp} className="whitespace-nowrap text-xs leading-4 text-secondary">
                <TimestampFormatter time={article.timestamp} />
            </Time>

            {Icon ? <Icon width={15} height={15} /> : null}
        </div>
    );
}
