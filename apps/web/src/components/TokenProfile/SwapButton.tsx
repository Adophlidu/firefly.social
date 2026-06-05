'use client';

import SwapIcon from '@dimensiondev/assets/swap.svg';
import { SwapAccessPath } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useAsyncFn } from 'react-use';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { openLoginModalWithGuard } from '@/controllers/openLoginModal.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
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
        if (ethereum.address) params.set('externalEvm', ethereum.address);
        if (solana.address) params.set('externalSolana', solana.address);

        const query = params.toString();
        const swapPath = `/swap?${query}`;

        openFireflyWallet({ path: swapPath });
    }, [loginRequired, isLogin, swapFromProps, openFireflyWallet, ethereum.address, solana.address]);

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
