import { getChainInfo } from '@dimensiondev/web3/chains';
import { isNativeTokenAddress } from '@dimensiondev/web3/utils';
import { t } from '@lingui/core/macro';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { type DepositChainOption, DepositViaCryptoModal } from '@/components/DepositViaCryptoModal/index.js';
import type { RouteModalProps } from '@/configs/modalRoutes.js';
import { InvalidPolymarketAccountError } from '@/constants/error.js';
import { captureWalletTelemetryEvent, WalletTelemetryEventId } from '@/helpers/swap/swapAnalytics.js';
import type { DepositAllSupportedTokenItem } from '@/providers/types/Firefly.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getPolymarketDepositAddressQueryOptions } from '@/queries/firefly/getPolymarketDepositAddressQueryOptions.js';
import { getPolymarketDepositAllSupportedTokensQueryOptions } from '@/queries/firefly/getPolymarketDepositAllSupportedTokensQueryOptions.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

const ETH_CHAIN_ID = 1;
const TRON_CHAIN_INFO = getChainInfo('tron', undefined);
const USDC_SYMBOL = 'USDC';
const USDT_SYMBOL = 'USDT';
const DEFAULT_MIN_DEPOSIT_USD = 9;

function pickDefaultTokenAddress(tokens: DepositAllSupportedTokenItem[], isTron: boolean): string | null {
    if (tokens.length === 0) return null;
    const preferred = isTron ? USDT_SYMBOL : USDC_SYMBOL;
    const match = tokens.find((token) => token.token_symbol?.toUpperCase() === preferred);
    // Stablecoins come first; on chains with no stablecoin (e.g. Robinhood: USDG + ETH),
    // prefer the native ETH token before falling back to tokens[0].
    const native = tokens.find(
        (token) => isNativeTokenAddress(token.token_address) || token.token_symbol?.toUpperCase() === 'ETH',
    );
    return match?.token_address ?? native?.token_address ?? tokens[0].token_address ?? null;
}

export function DepositViaCryptoModalWrapper({ modalType, open, onClose }: RouteModalProps) {
    const queryClient = useQueryClient();
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    // Account gate: resolve an existing account, fall back to creating one.
    const accountQuery = useQuery({
        ...getPolymarketAccountQueryOptions(),
        enabled: open,
    });
    const accountNeedsCreate = accountQuery.error instanceof InvalidPolymarketAccountError;

    useEffect(() => {
        if (!open || !accountNeedsCreate) return;
        let cancelled = false;
        getFireflyEndpoint()
            .createPolymarketAccount()
            .then((created) => {
                if (cancelled) return;
                queryClient.setQueryData(getPolymarketAccountQueryOptions().queryKey, created);
            })
            .catch((error) => {
                if (cancelled) return;
                const message = error instanceof Error ? error.message : String(error);
                toast.error(t`Failed to create predict wallet. ${message}`);
                onCloseRef.current(modalType);
            });
        return () => {
            cancelled = true;
        };
    }, [open, accountNeedsCreate, modalType, queryClient]);

    const { data: depositChains } = useQuery({
        ...getPolymarketDepositAllSupportedTokensQueryOptions(),
        enabled: open,
    });
    const { data: depositAddressData } = useQuery({
        ...getPolymarketDepositAddressQueryOptions(),
        enabled: open,
    });

    const chains = useMemo<DepositChainOption[]>(
        () =>
            (depositChains ?? []).map((chain) => ({
                chainId: chain.chain_id,
                chainName: chain.chain_name ?? '',
                icon: chain.chain_type === 'tron' ? TRON_CHAIN_INFO?.icon : undefined,
            })),
        [depositChains],
    );

    const [selectedChainId, setSelectedChainId] = useState<number | null>(null);
    const [selectedTokenAddress, setSelectedTokenAddress] = useState<string | null>(null);

    // Default to Ethereum when the chain list first loads.
    useEffect(() => {
        if (selectedChainId !== null || !depositChains?.length) return;
        const ethereum = depositChains.find((chain) => chain.chain_id === ETH_CHAIN_ID);
        setSelectedChainId((ethereum ?? depositChains[0]).chain_id);
    }, [depositChains, selectedChainId]);

    const selectedChain = useMemo(
        () => depositChains?.find((chain) => chain.chain_id === selectedChainId) ?? null,
        [depositChains, selectedChainId],
    );
    const isTron = selectedChain?.chain_type === 'tron';
    const tokensForChain = selectedChain?.tokens ?? [];

    useEffect(() => {
        if (!selectedChain) return;
        setSelectedTokenAddress(pickDefaultTokenAddress(selectedChain.tokens, isTron));
    }, [selectedChain, isTron]);

    const address = selectedChain ? (depositAddressData?.[selectedChain.chain_type] ?? null) : null;
    const minDepositUsd = selectedChain?.min_checkout_usd ?? DEFAULT_MIN_DEPOSIT_USD;

    const account = accountQuery.data ?? null;
    // `ready` requires the account AND the form data (chains, selected chain/token, deposit
    // address) to be loaded — otherwise the selectors render empty and the QR is missing.
    const formReady =
        chains.length > 0 && selectedChainId !== null && tokensForChain.length > 0 && !!depositAddressData;
    const status: 'loading' | 'creating' | 'ready' = !account
        ? accountNeedsCreate
            ? 'creating'
            : 'loading'
        : formReady
          ? 'ready'
          : 'loading';

    const handleChangeChain = (chainId: number) => {
        setSelectedChainId(chainId);
        captureWalletTelemetryEvent(WalletTelemetryEventId.BETS_DEPOSIT_VIA_CRYPTO_CHANGE_CHAIN, {
            chain_id: String(chainId),
        });
    };
    const handleChangeToken = (token: DepositAllSupportedTokenItem) => {
        setSelectedTokenAddress(token.token_address);
        captureWalletTelemetryEvent(WalletTelemetryEventId.BETS_DEPOSIT_VIA_CRYPTO_CHANGE_TOKEN, {
            chain_id: String(selectedChainId ?? ''),
            token_symbol: token.token_symbol,
        });
    };

    return (
        <DepositViaCryptoModal
            open={open}
            status={status}
            chains={chains}
            selectedChainId={selectedChainId}
            tokens={tokensForChain}
            selectedTokenAddress={selectedTokenAddress}
            address={address}
            minDepositUsd={minDepositUsd}
            isTron={isTron}
            onChangeChain={handleChangeChain}
            onChangeToken={handleChangeToken}
            onClose={() => onClose(modalType)}
        />
    );
}
