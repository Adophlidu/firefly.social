'use client';

import { Swap } from '@/app/(normal)/@sidebar/token/[exchange]/[[...slug]]/Swap.js';
import type { TokenPageProps } from '@/app/(normal)/token/[exchange]/[[...slug]]/types.js';
import { Overview } from '@/components/TokenProfile/Overview.js';
import { useTokenPageParams } from '@/hooks/useTokenPageParams.js';

export default function TokenSidebarPage(props: TokenPageProps) {
    const { tokenAddress, tokenId, updatedChainId, token } = useTokenPageParams(props);

    return (
        <div className="flex flex-col pb-6">
            <Swap token={token} chainId={updatedChainId} address={tokenAddress} />
            <Overview coinId={tokenId} chainId={updatedChainId} address={tokenAddress} />
        </div>
    );
}
