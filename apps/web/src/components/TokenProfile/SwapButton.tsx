'use client';

import SwapIcon from '@dimensiondev/assets/swap.svg';
import { SwapAccessPath } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useAsyncFn } from 'react-use';
import type { Address } from 'viem';
import { mainnet } from 'viem/chains';
import { useConnection } from 'wagmi';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { PRIVY_CONNECTOR_ID } from '@/constants/privy.js';
import { walletConnectIcon, walletConnectId, WalletId } from '@/constants/reown.js';
import { openLoginModalWithGuard } from '@/controllers/openLoginModal.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import { fetchEnsName, useEnsName } from '@/hooks/useEnsName.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { useOpenFireflyWallet } from '@/hooks/useOpenFireflyWallet.js';
import { captureSwapEvent } from '@/providers/telemetry/captureSwapEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';

interface SwapParams {
    chainId?: number;
    toChainId?: number;
    fromToken?: string;
    toToken?: string;
    entry?: SwapAccessPath;
}

export interface SwapButtonProps extends ClickableButtonProps {
    swapProps?: SwapParams;
    loginRequired?: boolean;
}

export function SwapButton({ className, swapProps: swapFromProps, loginRequired = false, ...rest }: SwapButtonProps) {
    const isLogin = useIsLoginFirefly();
    const openFireflyWallet = useOpenFireflyWallet();
    const { ethereum, solana } = useWalletAccountAll();
    const evmConnection = useConnection();
    const { data: evmEnsName } = useEnsName(ethereum.address, !!ethereum.address);

    const [{ loading }, handleClick] = useAsyncFn(async () => {
        if (loginRequired && !isLogin) {
            openLoginModalWithGuard();
            return;
        }

        captureSwapEvent(EventId.EVENT_SWAP_COPY_TRADE_CLICK);

        const params = new URLSearchParams();
        params.set('entry', swapFromProps?.entry ?? SwapAccessPath.TokenDetail); // Default to Token detail entry
        if (swapFromProps?.chainId) params.set('chain', swapFromProps.chainId.toString());
        if (swapFromProps?.toChainId) params.set('toChain', swapFromProps.toChainId.toString());
        if (swapFromProps?.fromToken) params.set('from', swapFromProps.fromToken);
        if (swapFromProps?.toToken) params.set('to', swapFromProps.toToken);
        if (ethereum.address) {
            const evmConnectorId = evmConnection.connector?.id.toLowerCase();
            const evmIcon =
                evmConnectorId === walletConnectId.toLowerCase()
                    ? walletConnectIcon
                    : evmConnectorId === PRIVY_CONNECTOR_ID.toLowerCase() ||
                        evmConnectorId === WalletId.FireflyWallet.toLowerCase()
                      ? null
                      : evmConnection.connector?.icon;
            const resolvedEvmEnsName =
                evmEnsName ??
                (await fetchEnsName({ address: ethereum.address as Address, chainId: mainnet.id }).catch(() => null));

            params.set('externalEvm', ethereum.address);
            if (resolvedEvmEnsName) params.set('externalEvmName', resolvedEvmEnsName);
            if (evmIcon) params.set('externalEvmIcon', evmIcon);
        }
        if (solana.address) params.set('externalSolana', solana.address);

        const query = params.toString();
        const swapPath = `/swap?${query}`;

        openFireflyWallet({ path: swapPath });
    }, [
        loginRequired,
        isLogin,
        swapFromProps,
        openFireflyWallet,
        ethereum.address,
        evmConnection.connector,
        evmEnsName,
        solana.address,
    ]);

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
