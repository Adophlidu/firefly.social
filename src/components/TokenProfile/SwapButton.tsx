'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useAsyncFn } from 'react-use';
import { switchChain } from 'wagmi/actions';

import SwapIcon from '@/assets/swap.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { useOkxSupportedChains } from '@/components/TokenProfile/useOkxSupportedChains.js';
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { SOLANA_CHAIN_ID_IN_FIREFLY } from '@/constants/debank.js';
import { ConnectionSource, NetworkType, OkxProviderType } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import { useAppKitAccounts } from '@/hooks/useAppKitAccounts.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { useIsLarge } from '@/hooks/useMediaQuery.js';
import { useOpenFireflyWallet } from '@/hooks/useOpenFireflyWallet.js';
import { SwapModalRef } from '@/modals/SwapModal/refs.js';
import { type SwapModalOpenProps } from '@/modals/SwapModal/SwapModalContent.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/refs.js';
import { captureSwapEvent } from '@/providers/telemetry/captureSwapEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { useSwapStore } from '@/store/useSwapStore.js';

export interface SwapButtonProps extends ClickableButtonProps {
    swapProps?: SwapModalOpenProps;
    loginRequired?: boolean;
}

export function SwapButton({ className, swapProps: swapFromProps, loginRequired = false, ...rest }: SwapButtonProps) {
    const { data: supportedChainIds = EMPTY_LIST } = useOkxSupportedChains();
    const { ethereum, solana } = useWalletAccountAll();
    const isLoginFirefly = useIsLoginFirefly();
    const isLarge = useIsLarge();
    const { sidebarSwapReady, setSidebarSwapOptions } = useSwapStore();
    const openFireflyWallet = useOpenFireflyWallet();
    const appkitAccounts = useAppKitAccounts();
    const privyWallets = useFireflyWalletStore((state) => state.wallets);

    const chainId = swapFromProps?.chainId;
    const providerType = chainId !== SOLANA_CHAIN_ID_IN_FIREFLY ? OkxProviderType.EVM : OkxProviderType.SOLANA;
    const isEvm = providerType === OkxProviderType.EVM;

    const currentWallet = appkitAccounts.find((account) => account.connected);
    const isUsingFireflyWallet = currentWallet?.source === ConnectionSource.Privy;
    const privyEvmAddress = privyWallets[NetworkType.Ethereum]?.[0]?.address;
    const privySolanaAddress = privyWallets[NetworkType.Solana]?.[0]?.address;
    const hasPrivyAddress = isEvm ? !!privyEvmAddress : !!privySolanaAddress;

    const chainIds = supportedChainIds.map((x) => x.chainId);
    const [{ loading }, handleClick] = useAsyncFn(async () => {
        if (loginRequired && !isLoginFirefly) {
            openLoginModal();
            return;
        }

        // For Privy wallet users, check Privy wallet address instead of relying on
        // wagmi/appkit isConnected state which may have race condition issues
        if (isUsingFireflyWallet) {
            if (!hasPrivyAddress) {
                WalletConnectModalRef.open({
                    networkType: isEvm ? NetworkType.Ethereum : NetworkType.Solana,
                });
                return;
            }
        } else {
            if ((isEvm && !ethereum.isConnected) || (!isEvm && !solana.isConnected)) {
                WalletConnectModalRef.open({
                    networkType: isEvm ? NetworkType.Ethereum : NetworkType.Solana,
                });
                return;
            }
        }
        if (chainId && isEvm) await switchChain(wagmiConfig, { chainId });
        captureSwapEvent(EventId.EVENT_SWAP_COPY_TRADE_CLICK);

        const params = new URLSearchParams();
        params.set('modal', 'swap');
        if (swapFromProps?.chainId) params.set('chain', swapFromProps.chainId.toString());
        if (swapFromProps?.toChainId) params.set('toChain', swapFromProps.toChainId.toString());
        if (swapFromProps?.fromToken) params.set('from', swapFromProps.fromToken);
        if (swapFromProps?.toToken) params.set('to', swapFromProps.toToken);

        const swapPath = `/?${params.toString()}`;

        if (isLarge && sidebarSwapReady) {
            setSidebarSwapOptions({
                ...swapFromProps,
                chainIds: swapFromProps?.chainIds ?? chainIds.map((x) => x.toString()),
                providerType,
            });
        } else if (isUsingFireflyWallet) {
            openFireflyWallet({ path: swapPath });
        } else {
            const options = {
                ...swapFromProps,
                chainIds: swapFromProps?.chainIds ?? chainIds.map((x) => x.toString()),
                providerType,
            };
            SwapModalRef.open(options);
        }
    }, [
        loginRequired,
        isLoginFirefly,
        isUsingFireflyWallet,
        chainId,
        isEvm,
        swapFromProps,
        isLarge,
        sidebarSwapReady,
        hasPrivyAddress,
        ethereum.isConnected,
        solana.isConnected,
        setSidebarSwapOptions,
        chainIds,
        providerType,
        openFireflyWallet,
    ]);

    if (isEvm && chainId && !chainIds.includes(chainId)) return null;

    return (
        <ClickableButton
            className={classNames(
                'ml-auto gap-2.5 rounded-full bg-main px-5 py-2 text-medium leading-4 text-primaryBottom',
                className,
            )}
            disabled={loading}
            onClick={handleClick}
            {...rest}
        >
            {rest.children ?? (
                <>
                    <SwapIcon width={16} height={16} />
                    <Trans>Swap</Trans>
                </>
            )}
        </ClickableButton>
    );
}
