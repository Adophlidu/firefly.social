import { Source } from '@dimensiondev/enums';
import { type LoaderContext, useLoaderData } from '@dimensiondev/ssr';

import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { Loading } from '@/components/Loading.js';
import { DiscoverPostList } from '@/components/Posts/DiscoverPostList.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { getDiscoverPostsPageData } from '@/legacy/[locale]/(normal)/(home)/(discover)/posts/getDiscoverPostsPageData.js';

/** Shown in the page area while this route's data is in flight (layouts keep rendering). */
export const loadingComponent = () => (
    <div className="flex min-h-[50vh] items-center justify-center">
        <Loading minHeight={200} />
    </div>
);

export const config = { cache: { sMaxAge: 60 } };

interface DiscoverPostsLoaderData {
    initialFeedPage: Awaited<ReturnType<typeof getDiscoverPostsPageData>>;
}

/**
 * Anonymously prefetch the default (no-filter) discover feed so it ships in
 * the initial HTML (crawlable) instead of being a client-only shell.
 * Relationship fields (hasLiked, …) stay empty here; the client fills them
 * in on mount.
 */
export async function loader(_context: LoaderContext): Promise<DiscoverPostsLoaderData> {
    const initialFeedPage = await getDiscoverPostsPageData();
    return { initialFeedPage };
}

export function head() {
    return fromNextMetadata(createSiteMetadata('/posts'));
}

export default function DiscoverPostsPage() {
    const { initialFeedPage } = useLoaderData<DiscoverPostsLoaderData>();
    return <DiscoverPostList source={Source.Posts} initialFeedPage={initialFeedPage} />;
}
