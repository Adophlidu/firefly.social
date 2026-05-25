'use client';

import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';

import { ArticleActions } from '@/components/Article/ArticleActions.js';
import { ArticleAuthor } from '@/components/Article/ArticleAuthor.js';
import { NoSSR } from '@/components/NoSSR.js';
import type { Article } from '@/providers/types/Article.js';

interface ArticleHeaderProps {
    article: Article;
    className?: string;
}

export const ArticleHeader = memo<ArticleHeaderProps>(function ArticleHeader({ article, className }) {
    return (
        <div
            className={classNames(
                'flex min-w-0 items-center justify-between border-b border-secondaryLine pb-[10px]',
                className,
            )}
        >
            <ArticleAuthor className="min-w-0" article={article} />
            <NoSSR>
                <ArticleActions article={article} queryDetail />
            </NoSSR>
        </div>
    );
});
