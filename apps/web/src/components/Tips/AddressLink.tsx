'use client';

import LinkIcon from '@dimensiondev/assets/link-square.svg';
import { Trans } from '@lingui/react/macro';
import { useMemo } from 'react';

import { Link } from '@/components/Link.js';
import { Tooltip } from '@/components/Tooltip.js';
import { type NetworkType } from '@/constants/enum.js';
import { resolveNetworkProvider } from '@/helpers/resolveTokenTransfer.js';

interface AddressLinkProps {
    address: string;
    chainId?: number;
    networkType: NetworkType;
    size?: number;
}

export function AddressLink({ address, chainId, networkType, size = 16 }: AddressLinkProps) {
    const addressLink = useMemo(() => {
        const network = resolveNetworkProvider(networkType);
        const targetChain = chainId ?? network.getChainId();
        if (!targetChain) return;
        return network.getAddressUrl(targetChain, address);
    }, [networkType, chainId, address]);

    if (!addressLink) return null;

    return (
        <Tooltip placement="top" content={<Trans>View on explorer</Trans>}>
            <Link href={addressLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                <LinkIcon width={size} height={size} />
            </Link>
        </Tooltip>
    );
}
