import ArrowRightIcon from '@dimensiondev/assets/arrow-right2.svg';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { Address } from 'viem';

import { formatPortfolioUSDCe } from '@/helpers/formatPortfolioUSDCe.js';
import { usePolymarketBalance } from '@/hooks/usePolymarketBalance.js';
import { cn } from '@/lib/utils.js';
import { getPolymarketAccountQueryOptions } from '@/queries/firefly/getPolymarketAccountQueryOptions.js';
import { getPolymarketUpgradeTaskQueryOptions } from '@/queries/firefly/getPolymarketUpgradeTaskQueryOptions.js';

export function BetEntry({ className }: { className?: string }) {
    const { data: proxyAddress, isLoading: isLoadingProxyAddress } = useQuery({
        ...getPolymarketAccountQueryOptions(),
        select(data) {
            return data.proxyAddress as Address;
        },
    });
    const { data: upgradeTask } = useQuery(getPolymarketUpgradeTaskQueryOptions(proxyAddress));

    const hasBetAccount = Boolean(proxyAddress);
    const { totalBalance, isLoading } = usePolymarketBalance(proxyAddress, undefined, upgradeTask?.is_upgraded);

    const portfolioText = formatPortfolioUSDCe(totalBalance);

    const isLoadingSection = isLoadingProxyAddress || (hasBetAccount && isLoading);

    return (
        <Link
            to="/bet"
            className={cn('flex w-full items-center justify-between duration-100 active:scale-[0.99]', className)}
        >
            <span className="flex min-w-0 items-center">
                <span className="text-main text-base font-semibold leading-6">
                    <Trans>Predictions</Trans>
                </span>
                <ArrowRightIcon width={20} height={20} className="text-second shrink-0" />
            </span>
            {isLoadingSection ? (
                <div className="bg-lightBg h-6 w-10 shrink-0 animate-pulse rounded-full" />
            ) : (
                <span className="text-main shrink-0 text-right text-sm font-semibold leading-[14px]">
                    {hasBetAccount ? portfolioText : '$0'}
                </span>
            )}
        </Link>
    );
}
