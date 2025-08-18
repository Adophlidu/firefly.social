import { ProjectTrendingList } from '@/components/ProjectTrendingList.js';
import { TrumpTruthSocialPosts } from '@/components/TrumpTruthSocial/TrumpTruthSocialPosts.js';
import { ExploreType, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { notFound, redirect, RedirectType } from '@/esm/navigation/server.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ explore: ExploreType }> {}

export default async function Page(props: Props) {
    const { explore } = await props.params;

    if (explore === ExploreType.Projects) return <ProjectTrendingList />;
    if (explore === ExploreType.TruthSocial) {
        if (env.external.NEXT_PUBLIC_TRUTH_SOCIAL === STATUS.Enabled) {
            return <TrumpTruthSocialPosts />;
        }

        notFound();
    }

    redirect(resolveExploreUrl(explore), RedirectType.replace);
}
