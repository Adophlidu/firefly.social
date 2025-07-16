'use client';

import { Trans } from '@lingui/react/macro';
import { ProviderType } from '@okxweb3/dex-widget';
import { memo } from 'react';
import { useAsyncFn } from 'react-use';
import { switchChain } from 'wagmi/actions';

import SwapIcon from '@/assets/swap.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { useOkxSupportedChains } from '@/components/TokenProfile/useOkxSupportedChains.js';
import { config } from '@/configs/wagmiClient.js';
import { SOLANA_CHAIN_ID_IN_FIREFLY } from '@/constants/chain.js';
import { NetworkType } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import { SwapModalRef, WalletConnectModalRef } from '@/modals/controls.js';
import type { SwapModalOpenProps } from '@/modals/SwapModal/SwapModalContent.js';
import { captureSwapEvent } from '@/providers/telemetry/captureSwapEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';

interface Props extends ClickableButtonProps {
    swapProps?: SwapModalOpenProps;
}

export const SwapButton = memo<Props>(function SwapButton({
    className,
    swapProps: swapPropsFromProps,
    ...rest
}: ClickableButtonProps & { swapProps?: SwapModalOpenProps }) {
    const { data: supportedChainIds = EMPTY_LIST } = useOkxSupportedChains();
    const { ethereum, solana } = useWalletAccountAll();

    const chainId = swapPropsFromProps?.chainId;
    const providerType = chainId !== SOLANA_CHAIN_ID_IN_FIREFLY ? ProviderType.EVM : ProviderType.SOLANA;

    const [{ loading }, handleClick] = useAsyncFn(async () => {
        if (
            (providerType === ProviderType.EVM && !ethereum.isConnected) ||
            (providerType === ProviderType.SOLANA && !solana.isConnected)
        ) {
            WalletConnectModalRef.open({
                networkType: providerType === ProviderType.EVM ? NetworkType.Ethereum : NetworkType.Solana,
            });
            return;
        }
        if (chainId && providerType === ProviderType.EVM) await switchChain(config, { chainId });
        captureSwapEvent(EventId.EVENT_SWAP_COPY_TRADE_CLICK);
        SwapModalRef.open({
            ...swapPropsFromProps,
            providerType,
        });
    }, [chainId, providerType, ethereum.isConnected, solana.isConnected, swapPropsFromProps]);

    const chainIds = supportedChainIds.map((x) => x.chainId);
    if (providerType === ProviderType.EVM && chainId && !chainIds.includes(chainId)) return null;

    return (
        <ClickableButton
            className={classNames(
                'ml-auto gap-[10px] rounded-full bg-main px-5 py-2 text-[15px] leading-4 text-primaryBottom',
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
});
