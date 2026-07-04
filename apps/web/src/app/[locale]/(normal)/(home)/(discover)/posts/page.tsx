import { Source } from '@dimensiondev/enums';

import { getDiscoverPostsPageData } from '@/app/[locale]/(normal)/(home)/(discover)/posts/getDiscoverPostsPageData.js';
import { DiscoverPostList } from '@/components/Posts/DiscoverPostList.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export const metadata = createSiteMetadata('/posts');

export const revalidate = 60;

export default async function Posts() {
    // Anonymously prefetch the default (no-filter) discover feed so it ships in the initial
    // HTML (ISR-cached, crawlable) instead of being a client-only shell. The key must match
    // DiscoverPostList's when no source filter is selected: ['posts', Source.Posts, 'discover'].
    // Relationship fields (hasLiked, …) stay empty here; the client fills them in on mount.
    const initialFeedPage = await getDiscoverPostsPageData();

    return <DiscoverPostList source={Source.Posts} initialFeedPage={initialFeedPage} />;
}
