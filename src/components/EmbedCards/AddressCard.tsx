import { safeUnreachable } from '@masknet/kit';
import { useQuery } from '@tanstack/react-query';
import { memo, useLayoutEffect } from 'react';

import { ContractCard } from '@/components/EmbedCards/ContractCard.js';
import { Indicator, type IndicatorProps } from '@/components/EmbedCards/Indicator.js';
import type { AddressCardProps } from '@/components/EmbedCards/types.js';
import { WalletCard } from '@/components/EmbedCards/WalletCard.js';
import { classNames } from '@/helpers/classNames.js';
import { useTokenInfo } from '@/hooks/useTokenInfo.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export const AddressCard = memo<AddressCardProps>(function AddressCard(props) {
    const address = props.address;
    const { data: detected } = useQuery({
        queryKey: ['detect-address', address],
        queryFn: () => FireflyEndpointProvider.detectAddress(address),
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
        queryKey: ['detect-address', address],
        queryFn: () => FireflyEndpointProvider.detectAddress(address),
        select: (data) => data?.list[0],
    });

    const attributes = detected?.contract_info?.attributes;
    const coingecko_coin_id = attributes?.coingecko_coin_id;
    const isToken =
        detected?.address_type === 'contract' &&
        (detected.contract_type === 'token' || detected.contract_type === 'ERC20');

    const { data: token, isLoading } = useTokenInfo(coingecko_coin_id || address, !!coingecko_coin_id, isToken);

    const unavailable =
        !detected?.address_type ||
        detected.contract_type === 'program' ||
        detected.contract_type === 'unknown' ||
        (isToken && !token && !isLoading);

    useLayoutEffect(() => {
        onAvailableUpdate(data, !unavailable);
    }, [data, unavailable, onAvailableUpdate]);

    if (unavailable) return null;

    return <Indicator {...rest} />;
});
