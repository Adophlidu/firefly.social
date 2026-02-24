'use client';

import { classNames } from '@dimensiondev/utils';

import { Swap } from '@/app/(normal)/@sidebar/token/[exchange]/[[...slug]]/Swap.js';
import { type TokenPageProps } from '@/app/(normal)/token/[exchange]/[[...slug]]/types.js';
import { Overview } from '@/components/TokenProfile/Overview.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { useTokenPageParams } from '@/hooks/useTokenPageParams.js';

export default function TokenSidebarPage(props: TokenPageProps) {
    const { tokenAddress, tokenId, updatedChainId, token } = useTokenPageParams(props);
    const isLoggedIn = useIsLoginFirefly();

    return (
        <div className="flex flex-col pb-6">
            {isLoggedIn ? <Swap token={token} chainId={updatedChainId} address={tokenAddress} /> : null}
            <Overview
                coinId={tokenId}
                chainId={updatedChainId}
                address={tokenAddress}
                className={classNames(!isLoggedIn ? 'mt-3' : null)}
            />
        </div>
    );
}
