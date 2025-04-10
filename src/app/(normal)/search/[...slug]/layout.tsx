import { t } from '@lingui/core/macro';
import { last } from 'lodash-es';
import { notFound } from '@/esm/navigation.js';

import { SearchTabs } from '@/components/Search/SearchTabs.js';
import { SearchType, SourceInURL } from '@/constants/enum.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import type { NextPageProps } from '@/types/index.js';

const ENABLED_SINGLE_SEARCH_TYPES = [SearchType.Profiles, SearchType.NFTs, SearchType.Tokens];
const ENABLED_DOUBLE_SEARCH_TYPES = [SearchType.Profiles, SearchType.Posts, SearchType.Channels];
const ENABLED_SOURCES = [SourceInURL.Farcaster, SourceInURL.Lens, SourceInURL.Twitter, SourceInURL.Bsky];

function checkSlug(slug: string[]) {
    if (slug.length === 1) {
        return ENABLED_SINGLE_SEARCH_TYPES.includes(slug[0] as SearchType);
    }

    if (slug.length === 2) {
        return (
            ENABLED_SOURCES.includes(slug[0] as SourceInURL) &&
            ENABLED_DOUBLE_SEARCH_TYPES.includes(slug[1] as SearchType)
        );
    }

    return false;
}

interface Props extends NextPageProps<{ slug: string[] }> {}

export async function generateMetadata(props: Props) {
    const params = await props.params;
    const { slug } = params;

    if (!checkSlug(slug)) {
        return createSiteMetadata({
            title: await createPageTitleSSR(() => t`Search`),
        });
    }

    const searchTypeTitle = {
        [SearchType.Profiles]: () => t`Search user`,
        [SearchType.Posts]: () => t`Search post`,
        [SearchType.Channels]: () => t`Search channel`,
        [SearchType.NFTs]: () => t`Search nft`,
        [SearchType.Tokens]: () => t`Search token`,
    }[last(slug) as SearchType];

    return createSiteMetadata({
        title: await createPageTitleSSR(searchTypeTitle || (() => t`Search`)),
    });
}

export default async function SearchLayout(props: Props) {
    const params = await props.params;
    const { children } = props;

    if (!checkSlug(params.slug)) notFound();

    return (
        <div>
            <SearchTabs />
            {children}
        </div>
    );
}
