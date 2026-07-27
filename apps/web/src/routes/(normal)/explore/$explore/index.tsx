import { ExploreType } from '@dimensiondev/enums';
import { type LoaderContext, notFound, redirect, useLoaderData } from '@dimensiondev/ssr';
import { first } from 'lodash-es';
import urlcat from 'urlcat';

import { ProjectTrendingList } from '@/components/ProjectTrendingList.js';
import { TrumpTruthSocialPosts } from '@/components/TrumpTruthSocial/TrumpTruthSocialPosts.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import { getEventSlugList } from '@/providers/firefly/prediction/getEventSlugList.js';

export const config = { cache: { sMaxAge: 60 } };

interface ExploreLoaderData {
    explore: ExploreType;
}

export async function loader({ params, url }: LoaderContext): Promise<ExploreLoaderData> {
    const explore = params.explore as ExploreType;

    if (explore === ExploreType.Prediction) {
        // Do NOT seed the shared queryClient singleton here: this branch redirects away, so
        // the write never reaches the destination page and only leaks state across requests.
        const slugList = await getEventSlugList();
        const slug = first(slugList);
        if (!slug) notFound();
        redirect(urlcat('/explore/:explore/:source', { explore, source: slug.slug }), 307);
    }
    if (explore !== ExploreType.Projects && explore !== ExploreType.TruthSocial) {
        const target = resolveExploreUrl(explore);
        // Unknown explore type whose resolution is a self-loop (e.g. `truthsocial`
        // vs the enum's `truth-social`): fail instead of redirecting forever.
        if (target === url.pathname) notFound();
        redirect(target, 307);
    }
    return { explore };
}

export default function ExploreIndexPage() {
    const { explore } = useLoaderData<ExploreLoaderData>();
    if (explore === ExploreType.Projects) return <ProjectTrendingList />;
    return <TrumpTruthSocialPosts />;
}
