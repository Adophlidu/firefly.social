import DollarIcon from '@dimensiondev/assets/dollar.svg';
import ReceiveIcon from '@dimensiondev/assets/qrcode.svg';
import SendIcon from '@dimensiondev/assets/send2.svg';
import SwapIcon from '@dimensiondev/assets/swap2.svg';
import { Trans } from '@lingui/react/macro';
import type {
    ButtonHTMLAttributes,
    FunctionComponent,
    HTMLAttributes,
    PropsWithChildren,
    ReactNode,
    SVGAttributes,
} from 'react';

import { CurrencyAmount } from '@/components/Bet/CurrencyAmount.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { cn } from '@/lib/utils.js';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    Icon: FunctionComponent<SVGAttributes<SVGElement>>;
    loading?: boolean;
}

function ActionButton({ Icon, loading, children, ...props }: ActionButtonProps) {
    return (
        <button
            {...props}
            disabled={props.disabled || loading}
            className={cn(
                'hover:bg-button-hover flex h-16 flex-1 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl bg-lightBg px-4 py-2.5 text-main duration-100 active:scale-95 active:bg-bg md:w-[124px]',
                'disabled:cursor-not-allowed disabled:opacity-50',
                props.className,
            )}
            aria-busy={loading || undefined}
        >
            {loading ? (
                <LoadingIcon size={24} className="text-highlight" />
            ) : (
                <Icon width={24} height={24} className="shrink-0 text-highlight" />
            )}
            <span className="whitespace-nowrap text-sm leading-5 text-main">{children}</span>
        </button>
    );
}

interface BaseProps extends Pick<HTMLAttributes<HTMLDivElement>, 'className'> {
    balance: number | string;
    loadingBalance?: boolean;
    onSend?: () => void;
    onReceive?: () => void;
    onSwap?: () => void;
    onFund?: () => void;
    title?: ReactNode;
    header?: ReactNode;
}

type FireflyWalletHomePageUIProps = PropsWithChildren<BaseProps>;

export function FireflyWalletHomePageUI({
    balance,
    children,
    onSend,
    onReceive,
    onSwap,
    onFund,
    title,
    header,
    loadingBalance,
    className,
}: FireflyWalletHomePageUIProps) {
    return (
        <div className={cn('flex flex-col items-center px-4 pt-6', className)}>
            {header}
            {title ? <div className="text-center text-base font-semibold leading-6">{title}</div> : null}
            <div className="mt-2 flex w-full flex-col">
                <div className="mb-8 flex flex-col space-y-2 text-center">
                    {loadingBalance ? (
                        <div className="h-12 w-20 animate-pulse rounded-lg bg-bg" />
                    ) : (
                        <CurrencyAmount amount={balance} formatted={formatTokenUSD(balance)} />
                    )}
                </div>
                <div className="flex w-full gap-3">
                    <ActionButton Icon={SendIcon} onClick={onSend} className="min-w-0 shrink-0">
                        <Trans>Send</Trans>
                    </ActionButton>
                    <ActionButton Icon={ReceiveIcon} onClick={onReceive} className="min-w-0 shrink-0">
                        <Trans>Receive</Trans>
                    </ActionButton>
                    <ActionButton Icon={SwapIcon} onClick={onSwap} className="min-w-0 shrink-0">
                        <Trans>Swap</Trans>
                    </ActionButton>
                    <ActionButton Icon={DollarIcon} onClick={onFund} className="min-w-0 shrink-0">
                        <Trans>Buy</Trans>
                    </ActionButton>
                </div>
                {children}
            </div>
        </div>
    );
}
