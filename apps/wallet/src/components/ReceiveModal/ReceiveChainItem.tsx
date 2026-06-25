import CheckIcon from '@dimensiondev/assets/check.svg';
import CopyIcon from '@dimensiondev/assets/copy-2.svg';
import QrCodeIcon from '@dimensiondev/assets/qrcode.svg';
import { formatAddress } from '@dimensiondev/web3/utils';
import type { HTMLProps, ReactNode } from 'react';

import { ChainIcon } from '@/components/ChainIcon.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { useCopyText } from '@/hooks/useCopyText.js';
import { cn } from '@/lib/utils.js';

export interface ReceiveChainItemProps extends Pick<HTMLProps<'div'>, 'className'> {
    chainId: number;
    name: ReactNode;
    address: string;
    onClickQrCodeButton?: () => void;
}

export function ReceiveChainItem({ chainId, name, address, onClickQrCodeButton, className }: ReceiveChainItemProps) {
    const [copied, handleCopy] = useCopyText(address);
    return (
        <div className={cn('flex w-full items-center justify-between rounded-2xl bg-bg p-3', className)}>
            <div className="flex space-x-2 text-left">
                <ChainIcon chainId={chainId} className="size-10 shrink-0 !bg-transparent" size={40} />
                <div>
                    <div className="h-[22px] text-medium font-semibold leading-[22px]">{name}</div>
                    <div className="h-[18px] text-sm font-normal leading-[18px] text-second">
                        {formatAddress(address, 4)}
                    </div>
                </div>
            </div>
            <div className="flex space-x-2">
                <ClickableButton
                    className="inline-flex size-8 items-center justify-center rounded-full bg-secondaryLine duration-100 hover:scale-105 active:scale-95"
                    onClick={onClickQrCodeButton}
                >
                    <QrCodeIcon width={18} height={18} className="size-[18px] shrink-0" />
                </ClickableButton>
                <ClickableButton
                    className={cn(
                        'inline-flex size-8 items-center justify-center rounded-full bg-secondaryLine duration-100 hover:scale-105 active:scale-95',
                        {
                            'text-success': copied,
                        },
                    )}
                    onClick={() => handleCopy?.()}
                >
                    {copied ? (
                        <CheckIcon width={18} height={18} />
                    ) : (
                        <CopyIcon width={18} height={18} className="size-[18px] shrink-0" />
                    )}
                </ClickableButton>
            </div>
        </div>
    );
}
