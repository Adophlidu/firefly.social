'use client';

import { Trans } from '@lingui/react/macro';

import NotFound from '@/components/NotFound.js';
import { SearchType } from '@/constants/enum.js';
import { useParams } from '@/esm/navigation.js';

export default function NotFoundToken() {
    const params = useParams<{ symbol: string }>();
    const symbol = decodeURIComponent(params.symbol);

    return (
        <NotFound
            text={<Trans>Token ${symbol} could not be found.</Trans>}
            search={{ text: <Trans>Search ${symbol}</Trans>, searchText: `$${symbol}`, searchType: SearchType.Posts }}
        />
    );
}
