import type { LayoutProps } from '@dimensiondev/types';
import { first } from 'lodash-es';
import urlcat from 'urlcat';

import { ProjectTrendingList } from '@/components/ProjectTrendingList.js';
import { TrumpTruthSocialPosts } from '@/components/TrumpTruthSocial/TrumpTruthSocialPosts.js';
import { queryClient } from '@/configs/queryClient.js';
import { ExploreType } from '@/constants/enum.js';
import { notFound, redirect, RedirectType } from '@/esm/navigation/server.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { getEventSlugList } from '@/providers/firefly/prediction/getEventSlugList.js';

export const revalidate = 60;

interface Props extends LayoutProps<{ explore: ExploreType }> {}

export default async function Page(props: Props) {
    const { explore } = await props.params;

    if (explore === ExploreType.Projects) return <ProjectTrendingList />;
    if (explore === ExploreType.TruthSocial) return <TrumpTruthSocialPosts />;
    if (explore === ExploreType.Prediction) {
        const slugList = await getEventSlugList();
        queryClient.setQueryData(['bets', 'slugs-list'], slugList);
        const slug = first(slugList);
        if (!slug) return notFound();
        redirect(urlcat('/explore/:explore/:source', { explore, source: slug.slug }), RedirectType.replace);
    }
    redirect(resolveExploreUrl(explore), RedirectType.replace);
}
