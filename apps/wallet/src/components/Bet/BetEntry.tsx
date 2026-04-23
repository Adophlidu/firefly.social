import ArrowRightIcon from '@dimensiondev/assets/arrow-right2.svg';
import BetEntryIcon from '@dimensiondev/assets/bet-entry.svg';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { Address } from 'viem';

import { formatPortfolioUSDCe } from '@/helpers/formatPortfolioUSDCe.js';
import { usePolymarketBalance } from '@/hooks/usePolymarketBalance.js';
import { cn } from '@/lib/utils.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';

export function BetEntry({ className }: { className?: string }) {
    const { data: proxyAddress, isLoading: isLoadingProxyAddress } = useQuery({
        ...getPolymarketAccountQueryOptions(),
        select(data) {
            return data.proxyAddress as Address;
        },
    });

    const hasBetAccount = Boolean(proxyAddress);
    const { totalBalance, isLoading } = usePolymarketBalance(proxyAddress);

    const portfolioText = formatPortfolioUSDCe(totalBalance);

    const isLoadingSection = isLoadingProxyAddress || (hasBetAccount && isLoading);
    if (isLoadingSection) {
        return <div className={cn('bg-lightBg h-[80px] w-full animate-pulse rounded-[15px]', className)} />;
    }

    if (hasBetAccount) {
        return (
            <Link
                to="/bet"
                className={cn(
                    'flex w-full items-center gap-2 rounded-[15px] bg-gradient-to-r from-[#DAD4FF] to-[#FFD285] p-0.5 shadow-lg',
                    className,
                )}
            >
                <span className="bg-primaryBottom flex flex-1 items-center gap-4 rounded-[13px] p-4">
                    <BetEntryIcon width={48} height={48} className="shrink-0" />
                    <span className="text-base font-semibold leading-6">
                        <Trans>Predictions</Trans>
                    </span>
                    <span className="flex w-full flex-1 items-center gap-2">
                        <span className="flex flex-1 flex-col items-end justify-center">
                            <span className="text-main text-[13px] font-semibold leading-5">{portfolioText}</span>
                            <span className="text-second text-xs leading-[14px]">
                                <Trans>Portfolio</Trans>
                            </span>
                        </span>
                    </span>
                </span>
            </Link>
        );
    }

    return (
        <Link
            to="/bet"
            className={cn(
                'bg-lightBg to-danger/30 ring-primaryBottom flex w-full items-center rounded-2xl bg-gradient-to-r from-transparent p-4 shadow-lg ring-2',
                className,
            )}
        >
            <BetEntryIcon width={48} height={48} className="mr-4 shrink-0" />
            <span className="flex flex-col items-start">
                <span className="flex items-center">
                    <span className="text-base font-semibold leading-6">
                        <Trans>Predictions</Trans>
                    </span>
                    <ArrowRightIcon width={24} height={24} className="text-second ml-auto shrink-0" />
                </span>
                <span className="text-second text-[13px] font-medium">
                    <Trans>Start trading on prediction markets</Trans>
                </span>
            </span>
        </Link>
    );
}
