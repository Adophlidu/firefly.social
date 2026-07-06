import ArrowDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import { multipliedBy } from '@dimensiondev/web3/numbers';
import { formatTokenItemAmount } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';

import type { DepositPayTokenDisplay } from '@/components/Deposit/types.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { cn } from '@/lib/utils.js';

interface DepositPayTokenRowProps {
    token: DepositPayTokenDisplay | null;
    isLoading?: boolean;
    isBalanceLoading?: boolean;
    onSelect?: () => void;
    className?: string;
}

export function DepositPayTokenRow({
    token,
    isLoading = false,
    isBalanceLoading = false,
    onSelect,
    className,
}: DepositPayTokenRowProps) {
    if (isLoading || !token) {
        return (
            <div className={cn('flex h-[60px] w-full items-center gap-3', className)}>
                <div className="size-9 rounded-full bg-lightBg" />
                <div className="flex-1">
                    <div className="h-5 w-[50px] bg-lightBg" />
                    <div className="mt-1 h-3 w-[100px] bg-lightBg" />
                </div>
                <div className="h-5 w-7 bg-lightBg" />
            </div>
        );
    }

    const rowClassName = cn(
        'flex h-[60px] w-full items-center gap-3',
        onSelect ? 'cursor-pointer' : undefined,
        className,
    );

    const content = (
        <>
            <TokenIcon
                size={36}
                badgeSize={16}
                className="shrink-0"
                badgeClassName="bg-white"
                chainId={token.chainId}
                icon={token.logoUrl}
                symbol={token.symbol}
                name={token.name}
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-main">{token.name}</span>
                    {onSelect ? <ArrowDownIcon width={16} height={16} /> : null}
                </div>
                {isBalanceLoading ? (
                    <div className="h-[14px] w-8 animate-pulse bg-lightBg" />
                ) : (
                    <span className="text-xs font-medium text-second">
                        <Trans>
                            {formatTokenItemAmount(token.balance ?? '0')} {token.symbol} in your Firefly wallet
                        </Trans>
                    </span>
                )}
            </div>
            {isBalanceLoading ? (
                <div className="h-5 w-7 animate-pulse bg-lightBg" />
            ) : (
                <span className="shrink-0 text-sm font-semibold text-main">
                    {token.balance ? formatTokenUSD(multipliedBy(token.balance, token.price ?? 0).toString()) : '$0'}
                </span>
            )}
        </>
    );

    if (onSelect) {
        return (
            <div className={rowClassName} onClick={onSelect}>
                {content}
            </div>
        );
    }

    return <div className={rowClassName}>{content}</div>;
}
