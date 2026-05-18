'use client';

import { SearchType } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';

import { NotFound } from '@/components/NotFound.js';
import { useParams } from '@/esm/navigation.js';

export default function NotFoundToken() {
    const params = useParams<{ exchange: string; slug?: string[] }>();
    const isCex = params.exchange === 'cex';
    const isDex = params.exchange === 'dex';
    const slug = params.slug || [];
    const symbol = decodeURIComponent(isCex || isDex ? slug[0] : params.exchange);

    return (
        <NotFound
            text={<Trans>Token ${symbol} could not be found.</Trans>}
            search={{ text: <Trans>Search ${symbol}</Trans>, searchText: `$${symbol}`, searchType: SearchType.Posts }}
        />
    );
}
