'use client';

import { getChainName } from '@dimensiondev/web3/chains';

import { ChainIcon } from '@/components/ChainIcon.js';

interface ChainInfoProps {
    chainId: number;
}

export function ChainInfo({ chainId }: ChainInfoProps) {
    return (
        <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-main">{getChainName(chainId)}</span>
            <ChainIcon chainId={chainId} />
        </div>
    );
}
