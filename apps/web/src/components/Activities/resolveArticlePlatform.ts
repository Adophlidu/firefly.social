import { ActivitiesPlatform, ArticlePlatform } from '@dimensiondev/enums';
import { createLookupTableResolver } from '@dimensiondev/utils';

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
