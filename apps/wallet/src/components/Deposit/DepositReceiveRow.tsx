import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import { TokenIcon } from '@/components/TokenIcon.js';
import { cn } from '@/lib/utils.js';

interface DepositReceiveRowProps {
    chainId: number;
    icon?: string;
    symbol: string;
    name: string;
    subtitle: ReactNode;
    amountText: string;
    isAmountLoading?: boolean;
    className?: string;
}

export function DepositReceiveRow({
    chainId,
    icon,
    symbol,
    name,
    subtitle,
    amountText,
    isAmountLoading = false,
    className,
}: DepositReceiveRowProps) {
    return (
        <div className={cn('flex h-[60px] w-full items-center', className)}>
            <TokenIcon
                size={36}
                badgeSize={16}
                className="shrink-0"
                badgeClassName="bg-white"
                chainId={chainId}
                icon={icon}
                symbol={symbol}
                name={name}
            />
            <div className="ml-4 flex w-full min-w-0 flex-col justify-start text-left">
                <div className="h-5 w-full truncate text-sm font-semibold">
                    <Trans>Receive</Trans>
                </div>
                <div className="w-full text-xs font-medium leading-3 text-second">{subtitle}</div>
            </div>
            {isAmountLoading ? (
                <div className="ml-auto h-5 w-10 animate-pulse bg-lightBg" />
            ) : (
                <div className="ml-auto text-sm font-semibold">{amountText || '-'}</div>
            )}
        </div>
    );
}
