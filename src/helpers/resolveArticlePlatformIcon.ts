import { createLookupTableResolver } from '@dimensiondev/utils';
import type { FunctionComponent, SVGAttributes } from 'react';

import MattersIcon from '@/assets/matters.svg';
import ParagraphIcon from '@/assets/paragraph.svg';
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
