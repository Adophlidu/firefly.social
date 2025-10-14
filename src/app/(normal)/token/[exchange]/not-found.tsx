'use client';

import { Trans } from '@lingui/react/macro';

import NotFound from '@/components/NotFound.js';
import { SearchType } from '@/constants/enum.js';
import { useParams } from '@/esm/navigation.js';

export default function NotFoundToken() {
    const params = useParams<{ exchange: string; slug?: string[] }>();
    const isCex = params.exchange === 'cex';
    const slug = params.slug || [];
    const symbol = decodeURIComponent(isCex ? slug[0] : slug[1]);

    return (
        <NotFound
            text={<Trans>Token ${symbol} could not be found.</Trans>}
            search={{ text: <Trans>Search ${symbol}</Trans>, searchText: `$${symbol}`, searchType: SearchType.Posts }}
        />
    );
}
