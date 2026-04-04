import MattersIcon from '@dimensiondev/assets/matters.svg';
import ParagraphIcon from '@dimensiondev/assets/paragraph.svg';
import { createLookupTableResolver } from '@dimensiondev/utils';
import { type FunctionComponent, type SVGAttributes } from 'react';

import { LimoIcon } from '@/components/LimoIcon.js';
import { ArticlePlatform } from '@/providers/types/Article.js';

export const resolveArticlePlatformIcon = createLookupTableResolver<
    ArticlePlatform,
    FunctionComponent<SVGAttributes<SVGElement>> | null
>(
    {
        [ArticlePlatform.Mirror]: ParagraphIcon,
        [ArticlePlatform.Paragraph]: ParagraphIcon,
        [ArticlePlatform.Limo]: LimoIcon,
        [ArticlePlatform.Matters]: MattersIcon,
    },
    null,
);
