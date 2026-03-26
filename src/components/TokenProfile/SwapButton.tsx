'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useAsyncFn } from 'react-use';

import SwapIcon from '@/assets/swap.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { useOpenFireflyWallet } from '@/hooks/useOpenFireflyWallet.js';
import { captureSwapEvent } from '@/providers/telemetry/captureSwapEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';

interface SwapParams {
    chainId?: number;
    toChainId?: number;
    fromToken?: string;
    toToken?: string;
}

export interface SwapButtonProps extends ClickableButtonProps {
    swapProps?: SwapParams;
    loginRequired?: boolean;
}

export function SwapButton({ className, swapProps: swapFromProps, loginRequired = false, ...rest }: SwapButtonProps) {
    const isLoginFirefly = useIsLoginFirefly();
    const openFireflyWallet = useOpenFireflyWallet();

    const [{ loading }, handleClick] = useAsyncFn(async () => {
        if (loginRequired && !isLoginFirefly) {
            openLoginModal();
            return;
        }

        captureSwapEvent(EventId.EVENT_SWAP_COPY_TRADE_CLICK);

        const params = new URLSearchParams();
        if (swapFromProps?.chainId) params.set('chain', swapFromProps.chainId.toString());
        if (swapFromProps?.toChainId) params.set('toChain', swapFromProps.toChainId.toString());
        if (swapFromProps?.fromToken) params.set('from', swapFromProps.fromToken);
        if (swapFromProps?.toToken) params.set('to', swapFromProps.toToken);

        const query = params.toString();
        const swapPath = query ? `/swap?${query}` : '/swap';

        openFireflyWallet({ path: swapPath });
    }, [loginRequired, isLoginFirefly, swapFromProps, openFireflyWallet]);

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
