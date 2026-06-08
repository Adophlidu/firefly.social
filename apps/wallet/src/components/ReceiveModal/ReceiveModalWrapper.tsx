import { SwapFromPage } from '@dimensiondev/enums';
import { getChainInfo, isSolanaChain } from '@dimensiondev/web3/chains';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from '@tanstack/react-router';
import { useMemo } from 'react';

import { ReceiveModal } from '@/components/ReceiveModal/index.js';
import type { ReceiveChainItemProps } from '@/components/ReceiveModal/ReceiveChainItem.js';
import type { RouteModalProps } from '@/configs/modalRoutes.js';
import { POLYMARKET_DEPOSIT_EVM_CHAIN_IDS } from '@/constants/ethereum.js';
import { useSwapSupportedChains } from '@/hooks/swap/useSwapSupportedChains.js';
import { useEmbeddedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getPolymarketDepositAddressQueryOptions } from '@/queries/firefly/getPolymarketDepositAddressQueryOptions.js';
import { getPolymarketDepositSupportedTokensQueryOptions } from '@/queries/firefly/getPolymarketDepositSupportedTokensQueryOptions.js';

const TRON_RECEIVE_CHAIN_ID = 728126428;
const TRON_RECEIVE_CHAIN_INFO = getChainInfo('tron', undefined);
const POLYMARKET_DEPOSIT_CHAIN_IDS = new Set<number>([...POLYMARKET_DEPOSIT_EVM_CHAIN_IDS, 101]);

export function ReceiveModalWrapper({ modalType: typeId, open, onClose }: RouteModalProps) {
    const { evmAddress, solanaAddress, isLoading } = useEmbeddedWalletAddresses();
    const { data: supportedChains, isLoading: isLoadingSupportedChains } = useSwapSupportedChains();
    const location = useLocation();
    const search = location.search as { from?: SwapFromPage };
    const isPredictionDeposit = search.from === SwapFromPage.BetDeposit;

    const { data: polymarketAccount, isLoading: isLoadingPolymarketAccount } = useQuery({
        ...getPolymarketAccountQueryOptions(),
        enabled: open && isPredictionDeposit,
    });

    const { data: depositAddressData, isLoading: isLoadingDepositAddress } = useQuery({
        ...getPolymarketDepositAddressQueryOptions(),
        enabled: open && isPredictionDeposit,
    });

    const { data: supportedTokens, isLoading: isLoadingDepositTokens } = useQuery({
        ...getPolymarketDepositSupportedTokensQueryOptions(),
        enabled: open && isPredictionDeposit,
    });

    const usdtToken =
        supportedTokens?.find((token) => token.token_symbol?.toUpperCase() === 'USDT') ?? supportedTokens?.[0];
    const polymarketDepositAddress = polymarketAccount?.proxyAddress;
    const tronDepositAddress = depositAddressData?.tron;

    const receiveItems: ReceiveChainItemProps[] = useMemo(() => {
        const visibleChains = isPredictionDeposit
            ? supportedChains.filter((chain) => POLYMARKET_DEPOSIT_CHAIN_IDS.has(chain.chainId))
            : supportedChains;

        const items: ReceiveChainItemProps[] = visibleChains.flatMap((chain) => {
            const address = isPredictionDeposit
                ? polymarketDepositAddress
                : isSolanaChain(chain.chainId)
                  ? solanaAddress
                  : evmAddress;
            if (!address) return [];
            return [
                {
                    name: chain.chainName,
                    chainId: chain.chainId,
                    icon: chain.logoUrl,
                    address,
                },
            ];
        });

        if (!isPredictionDeposit || !tronDepositAddress) return items;

        const tronItem: ReceiveChainItemProps = {
            name: TRON_RECEIVE_CHAIN_INFO?.name ?? 'Tron',
            chainId: TRON_RECEIVE_CHAIN_ID,
            icon: TRON_RECEIVE_CHAIN_INFO?.icon,
            address: tronDepositAddress,
            minDepositUsd: usdtToken?.min_deposit_usd ?? null,
            tokenIcon: usdtToken?.token_icon,
            variant: 'tron-deposit',
        };
        const solanaIndex = items.findIndex((item) => isSolanaChain(item.chainId));
        if (solanaIndex === -1) return [...items, tronItem];

        return [...items.slice(0, solanaIndex + 1), tronItem, ...items.slice(solanaIndex + 1)];
    }, [
        evmAddress,
        isPredictionDeposit,
        polymarketDepositAddress,
        solanaAddress,
        supportedChains,
        tronDepositAddress,
        usdtToken?.min_deposit_usd,
        usdtToken?.token_icon,
    ]);

    return (
        <ReceiveModal
            loading={
                (!isPredictionDeposit && isLoading) ||
                isLoadingSupportedChains ||
                (isPredictionDeposit &&
                    (isLoadingPolymarketAccount || isLoadingDepositAddress || isLoadingDepositTokens))
            }
            open={open}
            onClose={() => onClose(typeId)}
            items={receiveItems}
        />
    );
}
