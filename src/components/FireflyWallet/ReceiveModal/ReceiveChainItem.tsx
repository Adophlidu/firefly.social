import { classNames } from '@firefly/utils';
import type { HTMLProps, ReactNode } from 'react';

import CheckIcon from '@/assets/check.svg';
import CopyIcon from '@/assets/copy-2.svg';
import QrCodeIcon from '@/assets/qrcode.svg';
import { Avatar } from '@/components/Avatar.js';
import { ChainIcon } from '@/components/ChainIcon.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { useCopyText } from '@/hooks/useCopyText.js';

export interface ReceiveChainItemProps extends Pick<HTMLProps<'div'>, 'className'> {
    avatar?: string;
    chainId?: number;
    name: ReactNode;
    address: string;
    onClickQrCodeButton?: () => void;
}

export function ReceiveChainItem({
    avatar,
    chainId,
    name,
    address,
    onClickQrCodeButton,
    className,
}: ReceiveChainItemProps) {
    const [copied, handleCopy] = useCopyText(address);
    return (
        <div className={classNames('flex w-full items-center justify-between rounded-2xl bg-bg p-3', className)}>
            <div className="flex space-x-2 text-left">
                {avatar ? (
                    <Avatar src={avatar} alt={address} className="size-10 shrink-0 !bg-transparent" size={40} />
                ) : (
                    <ChainIcon chainId={chainId} className="size-10 shrink-0 !bg-transparent" size={40} />
                )}
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
                    className={classNames(
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
