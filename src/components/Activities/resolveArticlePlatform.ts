import { createLookupTableResolver } from '@dimensiondev/utils';

import { ActivitiesPlatform } from '@/constants/enum.js';
import { ArticlePlatform } from '@/providers/types/Article.js';

export const resolveArticlePlatform = createLookupTableResolver<ActivitiesPlatform, ArticlePlatform | undefined>(
    {
        [ActivitiesPlatform.Mirror]: ArticlePlatform.Mirror,
        [ActivitiesPlatform.Paragraph]: ArticlePlatform.Paragraph,
        [ActivitiesPlatform.Limo]: ArticlePlatform.Limo,
        [ActivitiesPlatform.Matters]: ArticlePlatform.Matters,
        [ActivitiesPlatform.Snapshot]: undefined,
    },
    undefined,
);
