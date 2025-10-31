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
import { NetworkType, OkxProviderType } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useIsLarge } from '@/hooks/useMediaQuery.js';
import { SwapModalRef } from '@/modals/SwapModal/SwapModal.js';
import type { SwapModalOpenProps } from '@/modals/SwapModal/SwapModalContent.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/index.js';
import { captureSwapEvent } from '@/providers/telemetry/captureSwapEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';
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

    const chainId = swapFromProps?.chainId;
    const providerType = chainId !== SOLANA_CHAIN_ID_IN_FIREFLY ? OkxProviderType.EVM : OkxProviderType.SOLANA;

    const chainIds = supportedChainIds.map((x) => x.chainId);
    const [{ loading }, handleClick] = useAsyncFn(async () => {
        if (loginRequired && !isLoginFirefly) {
            openLoginModal();
            return;
        }

        if (
            (providerType === OkxProviderType.EVM && !ethereum.isConnected) ||
            (providerType === OkxProviderType.SOLANA && !solana.isConnected)
        ) {
            WalletConnectModalRef.open({
                networkType: providerType === OkxProviderType.EVM ? NetworkType.Ethereum : NetworkType.Solana,
            });
            return;
        }
        if (chainId && providerType === OkxProviderType.EVM) await switchChain(wagmiConfig, { chainId });
        captureSwapEvent(EventId.EVENT_SWAP_COPY_TRADE_CLICK);
        const options = {
            ...swapFromProps,
            chainIds: swapFromProps?.chainIds ?? chainIds.map((x) => x.toString()),
            providerType,
        };
        if (isLarge && sidebarSwapReady) {
            setSidebarSwapOptions(options);
        } else {
            SwapModalRef.open(options);
        }
    }, [
        loginRequired,
        isLoginFirefly,
        providerType,
        ethereum.isConnected,
        solana.isConnected,
        chainId,
        swapFromProps,
        chainIds,
        isLarge,
        sidebarSwapReady,
        setSidebarSwapOptions,
    ]);

    if (providerType === OkxProviderType.EVM && chainId && !chainIds.includes(chainId)) return null;

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
