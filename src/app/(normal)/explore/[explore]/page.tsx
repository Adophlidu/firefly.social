import { ProjectTrendingList } from '@/components/ProjectTrendingList.js';
import { TrumpTruthSocialPosts } from '@/components/TrumpTruthSocial/TrumpTruthSocialPosts.js';
import { ExploreType } from '@/constants/enum.js';
import { redirect, RedirectType } from '@/esm/navigation/server.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ explore: ExploreType }> {}

export default async function Page(props: Props) {
    const { explore } = await props.params;

    if (explore === ExploreType.Projects) return <ProjectTrendingList />;
    if (explore === ExploreType.TruthSocial) return <TrumpTruthSocialPosts />;

    redirect(resolveExploreUrl(explore), RedirectType.replace);
}
