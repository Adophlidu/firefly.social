import ArrowRightIcon from '@dimensiondev/assets/arrow-right2.svg';
import { Trans } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';

import { formatPortfolioUSDCe } from '@/helpers/formatPortfolioUSDCe.js';
import { useCachedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { usePerpsComputedAccountValue } from '@/hooks/usePerpsComputedAccountValue.js';
import { cn } from '@/lib/utils.js';

export function PerpsEntry({ className }: { className?: string }) {
    const { evmAddress, isLoading: isWalletAddressesLoading } = useCachedWalletAddresses();
    const hasEvmAddress = Boolean(evmAddress);
    const { accountValue, isQueryPending } = usePerpsComputedAccountValue(evmAddress ?? undefined, {
        enabled: hasEvmAddress,
    });

    const portfolioText = formatPortfolioUSDCe(accountValue ?? '0');
    const isLoadingSection = isWalletAddressesLoading || (hasEvmAddress && isQueryPending);

    return (
        <Link
            to="/perps"
            className={cn('flex w-full items-center justify-between duration-100 active:scale-[0.99]', className)}
        >
            <span className="flex min-w-0 items-center">
                <span className="text-main text-base font-semibold leading-6">
                    <Trans>Perps</Trans>
                </span>
                <ArrowRightIcon width={20} height={20} className="text-second shrink-0" />
            </span>
            {isLoadingSection ? (
                <div className="bg-lightBg h-6 w-10 shrink-0 animate-pulse rounded-full" />
            ) : (
                <span className="text-main shrink-0 text-right text-sm font-semibold leading-[14px]">
                    {portfolioText}
                </span>
            )}
        </Link>
    );
}
