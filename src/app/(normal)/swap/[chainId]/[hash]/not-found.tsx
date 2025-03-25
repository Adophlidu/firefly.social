'use client';

import { Trans } from '@lingui/react/macro';
import { useParams } from 'next/navigation.js';

import NotFound from '@/components/NotFound.js';
import { SearchType } from '@/constants/enum.js';

export default function NotFoundToken() {
    const params = useParams<{ hash: string }>();
    const hash = decodeURIComponent(params.hash);

    return (
        <NotFound
            text={<Trans>Transaction {hash} could not be found.</Trans>}
            // search={{ text: <Trans>Search ${symbol}</Trans>, searchText: `$${symbol}`, searchType: SearchType.Tokens }}
        />
    );
}
