'use client';

import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { type ReactNode } from 'react';

import PostedIcon from '@/assets/posted.svg';
import RevisedIcon from '@/assets/revised.svg';
import { ActivityCellAction } from '@/components/ActivityCell/ActivityCellAction.js';
import { ActivityCellActionTag } from '@/components/ActivityCell/ActivityCellActionTag.js';
import { ArticlePlatform, ArticleType } from '@/providers/types/Article.js';

interface Props {
    type: ArticleType;
    platform: ArticlePlatform;
}

function ArticlePlatformName({ platform }: { platform: ArticlePlatform }) {
    switch (platform) {
        case ArticlePlatform.Limo:
            return 'Limo';
        case ArticlePlatform.Mirror:
            return 'Paragraph';
        case ArticlePlatform.Paragraph:
            return 'Paragraph';
        case ArticlePlatform.Matters:
            return 'Matters';
        default:
            safeUnreachable(platform);
            return null;
    }
}

export function ActivityCellArticleAction({ type, platform }: Props) {
    let action: ReactNode = null;
    switch (type) {
        case ArticleType.Revise:
            action = (
                <Trans>
                    <ActivityCellActionTag icon={<RevisedIcon />}>Revised</ActivityCellActionTag>
                    <span>
                        an article on <ArticlePlatformName platform={platform} />
                    </span>
                </Trans>
            );
            break;
        case ArticleType.Post:
            action = (
                <Trans>
                    <ActivityCellActionTag icon={<PostedIcon />}>Posted</ActivityCellActionTag>
                    <span>
                        an article on <ArticlePlatformName platform={platform} />
                    </span>
                </Trans>
            );
            break;
        default:
            safeUnreachable(type);
            return null;
    }

    return <ActivityCellAction>{action}</ActivityCellAction>;
}
