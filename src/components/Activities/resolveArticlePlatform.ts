import { ActivitiesPlatform } from '@/constants/enum.js';
import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';
import { ArticlePlatform } from '@/providers/types/Article.js';

export const resolveArticlePlatform = createLookupTableResolver<ActivitiesPlatform, ArticlePlatform | undefined>(
    {
        [ActivitiesPlatform.Mirror]: ArticlePlatform.Mirror,
        [ActivitiesPlatform.Paragraph]: ArticlePlatform.Paragraph,
        [ActivitiesPlatform.Limo]: ArticlePlatform.Limo,
        [ActivitiesPlatform.Snapshot]: undefined,
    },
    undefined,
);
