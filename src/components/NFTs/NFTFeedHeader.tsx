import { type Address } from 'viem';

import { ActivityCellHeader, type ActivityCellHeaderProps } from '@/components/ActivityCell/ActivityCellHeader.js';
import { ChainIcon } from '@/components/ChainIcon.js';
import { WalletBaseMoreAction } from '@/components/WalletBaseMoreAction.js';

interface NFTFeedHeaderProps extends Omit<ActivityCellHeaderProps, 'icon' | 'displayName'> {
    chainId: number;
    contractAddress: Address;
    tokenId: string;
    ens?: string;
}

export function NFTFeedHeader({ ens, chainId, ...props }: NFTFeedHeaderProps) {
    const { address, contractAddress, tokenId } = props;
    return (
        <ActivityCellHeader {...props} icon={<ChainIcon chainId={chainId} size={15} />} displayName={ens}>
            {address ? (
                <WalletBaseMoreAction
                    address={address}
                    contractAddress={contractAddress}
                    tokenId={tokenId}
                    chainId={chainId}
                    ens={ens}
                />
            ) : null}
        </ActivityCellHeader>
    );
}
