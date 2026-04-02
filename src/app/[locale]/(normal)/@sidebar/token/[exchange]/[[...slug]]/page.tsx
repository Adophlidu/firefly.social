'use client';

import { type TokenPageProps } from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/types.js';
import { Overview } from '@/components/TokenProfile/Overview.js';
import { useTokenPageParams } from '@/hooks/useTokenPageParams.js';

export default function TokenSidebarPage(props: TokenPageProps) {
    const { tokenAddress, tokenId, updatedChainId } = useTokenPageParams(props);

    return (
        <div className="flex flex-col pb-6">
            <Overview coinId={tokenId} chainId={updatedChainId} address={tokenAddress} className="mt-3" />
        </div>
    );
}
