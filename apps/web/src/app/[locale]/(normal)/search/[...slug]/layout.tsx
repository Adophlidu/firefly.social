import type { LayoutProps } from '@dimensiondev/types';
import { createLookupTableResolver, isValidEnumValue } from '@dimensiondev/utils';
import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { last } from 'lodash-es';

import { ClubType, SearchType, SourceInURL } from '@/constants/enum.js';
import { notFound, redirect } from '@/esm/navigation/server.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';

const resolveSearchTypeTitle = createLookupTableResolver<SearchType, MessageDescriptor>(
    {
        [SearchType.Profiles]: msg`Search user`,
        [SearchType.Posts]: msg`Search post`,
        [SearchType.Channels]: msg`Search channel`,
        [SearchType.Prediction]: msg`Search predictions`,
        [SearchType.Tokens]: msg`Search token`,
        [SearchType.Clubs]: msg`Search clubs`,
    },
    msg`Search`,
);

const ENABLED_SINGLE_SEARCH_TYPES = [SearchType.Profiles, SearchType.Tokens, SearchType.Prediction];
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

type Props = LayoutProps<{ slug: string[] }>;

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
    // TODO: according to Next.js doc
    // https://nextjs.org/docs/app/api-reference/file-conventions/layout#query-params
    // A Layout cannot access searchParams, so code here should be a no-op.
    const searchParams = await (props as any).searchParams;

    if (params.slug[1] === SearchType.Channels) {
        redirect(resolveSearchUrl(searchParams.q, SearchType.Clubs));
    }

    if (!checkSlug(params.slug)) notFound();

    return <div>{props.children}</div>;
}
