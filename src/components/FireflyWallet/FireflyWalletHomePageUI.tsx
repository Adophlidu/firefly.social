'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { type PropsWithChildren, type ReactNode } from 'react';

import CheckIcon from '@/assets/check.svg';
import CopyIcon from '@/assets/copy-2.svg';
import ReceiveIcon from '@/assets/qrcode.svg';
import SendIcon from '@/assets/send2.svg';
import SwapIcon from '@/assets/swap2.svg';
import { formatAddress } from '@/helpers/formatAddress.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { useCopyText } from '@/hooks/useCopyText.js';

interface BaseProps {
    address?: string;
    balance: number | string;
    loadingBalance?: boolean;
    onSend?: () => void;
    onReceive?: () => void;
    onSwap?: () => void;
    title?: ReactNode;
    header?: ReactNode;
}

export type FireflyWalletHomePageUIProps = PropsWithChildren<BaseProps>;

export function FireflyWalletHomePageUI({
    address,
    balance,
    children,
    onSend,
    onReceive,
    onSwap,
    title,
    header,
    loadingBalance,
}: FireflyWalletHomePageUIProps) {
    return (
        <div className="flex flex-col items-center px-4 py-6">
            {header}
            {title ? <div className="text-center text-base font-semibold leading-6">{title}</div> : null}
            <div className="mt-2 flex w-full flex-col space-y-8">
                {address ? <AddressCopier address={address} /> : null}
                <div className="flex flex-col space-y-2 text-center">
                    <div
                        className={classNames(
                            'mx-auto h-8 w-auto min-w-[100px] truncate text-[32px] font-bold leading-8 text-main',
                            {
                                'animate-pulse rounded-lg bg-bg': !!loadingBalance,
                            },
                        )}
                    >
                        {loadingBalance ? '' : formatTokenUSD(balance)}
                    </div>
                    <div className="text-sm font-medium leading-[18px] text-second">
                        <Trans>TOTAL ASSETS (≈USD)</Trans>
                    </div>
                </div>
                <div className="mx-auto grid grid-cols-3 gap-2 md:gap-4">
                    <button
                        className="hover:bg-button-hover flex h-12 items-center justify-center rounded-2xl border border-current px-4 font-bold text-main duration-100 active:scale-95 active:bg-bg md:w-[124px]"
                        onClick={onSend}
                    >
                        <SendIcon width={24} height={24} className="mr-1.5 shrink-0" />
                        <Trans>Send</Trans>
                    </button>
                    <button
                        className="hover:bg-button-hover flex h-12 items-center justify-center rounded-2xl border border-current px-4 font-bold text-main duration-100 active:scale-95 active:bg-bg md:w-[124px]"
                        onClick={onReceive}
                    >
                        <ReceiveIcon width={24} height={24} className="mr-1.5 shrink-0" />
                        <Trans>Receive</Trans>
                    </button>
                    <button
                        className="hover:bg-button-hover flex h-12 items-center justify-center rounded-2xl border border-current px-4 font-bold text-main duration-100 active:scale-95 active:bg-bg md:w-[124px]"
                        onClick={onSwap}
                    >
                        <SwapIcon width={24} height={24} className="mr-1.5 shrink-0" />
                        <Trans>Swap</Trans>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function AddressCopier({ address }: { address: string }) {
    const [copied, handleCopy] = useCopyText(address, { enqueueSuccessMessage: true });

    return (
        <button
            className="mx-auto inline-flex h-[26px] cursor-pointer items-center rounded-full bg-line px-2 text-sm font-medium text-second"
            onClick={() => handleCopy()}
        >
            <span>{formatAddress(address, 4)}</span>
            <span className="ml-1 size-3.5 shrink-0">
                {copied ? <CheckIcon width={14} height={14} /> : <CopyIcon width={14} height={14} />}
            </span>
        </button>
    );
}
