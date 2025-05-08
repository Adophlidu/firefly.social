'use client';
import { t } from '@lingui/core/macro';
import { useAppKitProvider } from '@reown/appkit/react';
import { memo, useContext } from 'react';

import SwapIcon from '@/assets/swap.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { TokenContext } from '@/components/Token/TokenContext.js';
import { NetworkType } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { SwapModalRef, WalletConnectModalRef } from '@/modals/controls.js';
import type { SwapModalOpenProps } from '@/modals/SwapModal.js';

interface Props extends ClickableButtonProps {
    tradable?: boolean;
    swapProps?: SwapModalOpenProps;
}

export const SwapButton = memo<Props>(function SwapButton({
    className,
    tradable: tradableFromProps,
    swapProps: swapPropsFromProps,
    ...rest
}) {
    const appKitProvider = useAppKitProvider('eip155');
    const { tradable: tradableFromContext, swapProps: propsFromContext } = useContext(TokenContext);

    const tradable = tradableFromProps ?? tradableFromContext;

    if (!tradable) return null;

    return (
        <ClickableButton
            className={classNames(
                'ml-auto gap-[10px] rounded-full bg-main px-5 py-2 text-[15px] leading-4 text-primaryBottom',
                className,
            )}
            disabled={!tradable}
            onClick={() => {
                if (!appKitProvider.walletProvider) {
                    WalletConnectModalRef.open({ networkType: NetworkType.Ethereum });
                    return;
                }
                SwapModalRef.open(swapPropsFromProps ?? propsFromContext);
            }}
            {...rest}
        >
            {rest.children ?? (
                <>
                    <SwapIcon width={16} height={16} />
                    {t`Swap`}
                </>
            )}
        </ClickableButton>
    );
});
