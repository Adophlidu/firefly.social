import { ArticlePlatform } from '@dimensiondev/enums';
import { createLookupTableResolver } from '@dimensiondev/utils';

import { ActivitiesPlatform } from '@/constants/enum.js';

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
