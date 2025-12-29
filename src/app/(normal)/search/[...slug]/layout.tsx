import { createLookupTableResolver } from '@dimensiondev/utils';
import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { last } from 'lodash-es';

import { ClubTypeTab } from '@/components/Search/CommunityTypeTab.js';
import { SearchSources } from '@/components/Search/SearchSources.js';
import { SearchTabs } from '@/components/Search/SearchTabs.js';
import { ClubType, SearchType, SourceInURL } from '@/constants/enum.js';
import { notFound, redirect } from '@/esm/navigation/server.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isValidEnumValue } from '@/helpers/isValidEnumValue.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import type { NextPageProps } from '@/types/utility.js';

const resolveSearchTypeTitle = createLookupTableResolver<SearchType, MessageDescriptor>(
    {
        [SearchType.Profiles]: msg`Search user`,
        [SearchType.Posts]: msg`Search post`,
        [SearchType.Channels]: msg`Search channel`,
        [SearchType.NFTs]: msg`Search nft`,
        [SearchType.Bets]: msg`Search predictions`,
        [SearchType.Tokens]: msg`Search token`,
        [SearchType.Clubs]: msg`Search clubs`,
    },
    msg`Search`,
);

const ENABLED_SINGLE_SEARCH_TYPES = [SearchType.Profiles, SearchType.NFTs, SearchType.Tokens, SearchType.Bets];
const ENABLED_DOUBLE_SEARCH_TYPES = [SearchType.Profiles, SearchType.Posts];
const ENABLED_SOURCES = [SourceInURL.Farcaster, SourceInURL.Lens, SourceInURL.Twitter, SourceInURL.Bsky, SourceInURL.X];

function checkSlug(slug: string[]) {
    if (slug.length === 1) {
        return ENABLED_SINGLE_SEARCH_TYPES.includes(slug[0] as SearchType);
    }

    if (slug.length === 2 && slug[0] === SearchType.Clubs) {
        return isValidEnumValue(slug[1], ClubType);
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
        return createSiteMetadata('/search', {
            title: await createPageTitleSSR(msg`Search`),
        });
    }

    return createSiteMetadata(`/search/${slug.join('/')}`, {
        title: await createPageTitleSSR(resolveSearchTypeTitle(last(slug) as SearchType)),
    });
}

export default async function Layout(props: Props) {
    const params = await props.params;
    const searchParams = await props.searchParams;

    if (params.slug[1] === SearchType.Channels) {
        redirect(resolveSearchUrl(searchParams.q, SearchType.Clubs));
    }

    if (!checkSlug(params.slug)) notFound();

    return (
        <div>
            <SearchTabs />
            <ClubTypeTab className="sticky top-[98px] z-20 bg-primaryBottom md:!top-[103px]" />
            <SearchSources className="sticky top-[98px] z-20 bg-primaryBottom md:!top-[103px]" />
            {props.children}
        </div>
    );
}
