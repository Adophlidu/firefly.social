import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { useQuery } from '@tanstack/react-query';
import { memo, useLayoutEffect } from 'react';

import { ContractCard } from '@/components/EmbedCards/ContractCard.js';
import { Indicator, type IndicatorProps } from '@/components/EmbedCards/Indicator.js';
import type { AddressCardProps } from '@/components/EmbedCards/types.js';
import { WalletCard } from '@/components/EmbedCards/WalletCard.js';
import { useNFTCollection } from '@/hooks/useNFTCollection.js';
import { useTokenInfo } from '@/hooks/useTokenInfo.js';
import { useWalletProfile } from '@/hooks/useWalletProfile.js';
import { fireflyWalletProvider } from '@/providers/firefly/Wallet.js';

export const AddressCard = memo<AddressCardProps>(function AddressCard(props) {
    const address = props.address;
    const { data: detected } = useQuery({
        queryKey: ['detect-address', address.toLowerCase()],
        queryFn: () => fireflyWalletProvider.detectAddress(address),
        select: (data) => data?.list[0],
    });
    const address_type = detected?.address_type;
    if (!address_type) return null;

    switch (address_type) {
        case 'eoa':
        case 'soa':
            return <WalletCard {...props} className={classNames('min-h-[76px]', props.className)} />;
        case 'contract':
            if (detected.contract_type === 'program' || detected.contract_type === 'unknown') return null;
            return (
                <ContractCard
                    contractType={detected.contract_type}
                    chainId={+detected.chain_id}
                    {...props}
                    className={classNames('min-h-[109px]', props.className)}
                />
            );
        default:
            safeUnreachable(address_type);
            return null;
    }
});

interface AddressCardIndicatorProps extends IndicatorProps, Pick<AddressCardProps, 'address' | 'domain'> {
    data: string;
    onAvailableUpdate: (data: string, available: boolean) => void;
}

export const AddressCardIndicator = memo<AddressCardIndicatorProps>(function AddressCardIndicator({
    address,
    data,
    onAvailableUpdate,
    ...rest
}) {
    const { data: detected } = useQuery({
        queryKey: ['detect-address', address.toLowerCase()],
        queryFn: () => fireflyWalletProvider.detectAddress(address),
        select: (data) => data?.list[0],
    });
    const contractType = detected?.contract_type;
    const addressType = detected?.address_type;

    const attributes = detected?.contract_info?.attributes;
    const coingecko_coin_id = attributes?.coingecko_coin_id;

    const isCollection = contractType ? ['ERC721', 'ERC1155', 'nft'].includes(contractType) : false;
    const { data: collection, isPending: isLoadingCollection } = useNFTCollection(
        address,
        detected?.chain_id ? +detected?.chain_id : undefined,
        isCollection,
    );

    const isToken = addressType === 'contract' && (contractType === 'token' || contractType === 'ERC20');
    const { data: token, isPending: isLoadingToken } = useTokenInfo(
        { coingecko_id: coingecko_coin_id, address },
        isToken,
    );

    const isWallet = addressType === 'eoa' || addressType === 'soa';
    const { data: walletProfile, isPending: isLoadingWalletProfile } = useWalletProfile(address, isWallet);

    const isUnknownContract = contractType === 'unknown' || contractType === 'program';
    const isTokenButNotLoaded = isToken && !token && !isLoadingToken;
    const isCollectionButNotLoaded = isCollection && !collection && !isLoadingCollection;
    const isWalletButNotLoaded = isWallet && !walletProfile && !isLoadingWalletProfile;

    const unavailable =
        !addressType || isUnknownContract || isTokenButNotLoaded || isCollectionButNotLoaded || isWalletButNotLoaded;

    useLayoutEffect(() => {
        onAvailableUpdate(data, !unavailable);
    }, [data, unavailable, onAvailableUpdate]);

    if (unavailable) return null;

    return <Indicator {...rest} />;
});
