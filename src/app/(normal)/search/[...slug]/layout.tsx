import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { getEnumAsArray } from '@masknet/kit';
import { last } from 'lodash-es';

import { CommunityTypeTab } from '@/components/Search/CommunityTypeTab.js';
import { SearchSources } from '@/components/Search/SearchSources.js';
import { SearchTabs } from '@/components/Search/SearchTabs.js';
import { CommunityType, SearchType, SourceInURL } from '@/constants/enum.js';
import { notFound, redirect } from '@/esm/navigation/server.js';
import { createLookupTableResolver } from '@/helpers/createLookupTableResolver.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import type { NextPageProps } from '@/types/index.js';

const resolveSearchTypeTitle = createLookupTableResolver<SearchType, MessageDescriptor>(
    {
        [SearchType.Profiles]: msg`Search user`,
        [SearchType.Posts]: msg`Search post`,
        [SearchType.Channels]: msg`Search channel`,
        [SearchType.NFTs]: msg`Search nft`,
        [SearchType.Tokens]: msg`Search token`,
        [SearchType.Communities]: msg`Search community`,
    },
    msg`Search`,
);

const ENABLED_SINGLE_SEARCH_TYPES = [SearchType.Profiles, SearchType.NFTs, SearchType.Tokens];
const ENABLED_DOUBLE_SEARCH_TYPES = [SearchType.Profiles, SearchType.Posts];
const ENABLED_SOURCES = [SourceInURL.Farcaster, SourceInURL.Lens, SourceInURL.Twitter, SourceInURL.Bsky];

function checkSlug(slug: string[]) {
    if (slug.length === 1) {
        return ENABLED_SINGLE_SEARCH_TYPES.includes(slug[0] as SearchType);
    }

    if (slug.length === 2 && slug[0] === SearchType.Communities) {
        return getEnumAsArray(CommunityType).some(({ value }) => value === slug[1]);
    }

    if (slug.length === 2) {
        return (
            ENABLED_SOURCES.includes(slug[0] as SourceInURL) &&
            ENABLED_DOUBLE_SEARCH_TYPES.includes(slug[1] as SearchType)
        );
    }

    return false;
}

interface Props
    extends NextPageProps<
        { slug: string[] },
        {
            q: string;
        }
    > {}

export async function generateMetadata(props: Props) {
    const { slug } = await props.params;

    if (!checkSlug(slug)) {
        return createSiteMetadata({
            title: await createPageTitleSSR(msg`Search`),
        });
    }

    return createSiteMetadata({
        title: await createPageTitleSSR(resolveSearchTypeTitle(last(slug) as SearchType)),
    });
}

export default async function Layout(props: Props) {
    const params = await props.params;
    const searchParams = await props.searchParams;

    if (params.slug[1] === SearchType.Channels) {
        redirect(resolveSearchUrl(searchParams.q, SearchType.Communities));
    }

    if (!checkSlug(params.slug)) notFound();

    return (
        <div>
            <SearchTabs />
            <CommunityTypeTab />
            <SearchSources />
            {props.children}
        </div>
    );
}
