'use client';

import type { TokenPageProps } from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/types.js';
import { TokenOverview } from '@/components/TokenProfile/TokenOverview/index.js';
import { useTokenPageParams } from '@/hooks/useTokenPageParams.js';

export default function TokenSidebarPage(props: TokenPageProps) {
    const { tokenAddress, tokenId, updatedChainId, isPending, isTokenPending } = useTokenPageParams(props);

    return (
        <div className="flex flex-col pb-6">
            <TokenOverview
                loading={isPending || isTokenPending}
                coinId={tokenId}
                chainId={updatedChainId}
                address={tokenAddress}
                className="mt-3"
            />
        </div>
    );
}
