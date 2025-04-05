import { redirect, RedirectType } from 'next/navigation.js';

import { ProjectTrendingList } from '@/components/ProjectTrendingList.js';
import { ExploreType } from '@/constants/enum.js';
import { resolveExploreUrl } from '@/helpers/resolveExploreUrl.js';
import type { NextPageProps } from '@/types/index.js';

interface Props extends NextPageProps<{ explore: ExploreType }> {}

export default async function Page(props: Props) {
    const { explore } = await props.params;

    if (explore === ExploreType.Projects) return <ProjectTrendingList />;
    redirect(resolveExploreUrl(explore), RedirectType.replace);
}
