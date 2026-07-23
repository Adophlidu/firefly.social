'use client';

import { type PerpsIntent, toPerpsWalletPath } from '@dimensiondev/iframe-bridge';
import type { PerpsAddress } from '@dimensiondev/perps-react';
import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { DEFAULT_PERPS_MARKET, toPerpsMarketDisplayName } from '@/components/Perps/marketSelection.js';
import { PerpsAccountHeader } from '@/components/Perps/PerpsAccountHeader.js';
import { PerpsAccountPanels } from '@/components/Perps/PerpsAccountPanels.js';
import { PerpsChart } from '@/components/Perps/PerpsChart.js';
import { PerpsMarketSelector } from '@/components/Perps/PerpsMarketSelector.js';
import { PerpsMetric } from '@/components/Perps/PerpsMetric.js';
import { PerpsOrderBook } from '@/components/Perps/PerpsOrderBook.js';
import { usePerpsAccountSubscriptions } from '@/components/Perps/usePerpsAccountSubscriptions.js';
import { usePerpsMarketData } from '@/components/Perps/usePerpsMarketData.js';
import { usePerpsMutationSubscriber } from '@/components/Perps/usePerpsMutationSubscriber.js';
import { openLoginModalWithGuard } from '@/controllers/openLoginModal.js';
import { useRouter, useSearchParams } from '@/esm/navigation.js';
import { waitForAuthorization } from '@/helpers/waitForPrivyAuthorization.js';
import { useOpenFireflyWallet } from '@/hooks/useOpenFireflyWallet.js';
import { usePrivyAddresses } from '@/hooks/usePrivyAddresses.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

function formatMetric(value?: string, options?: Intl.NumberFormatOptions) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '--';
    return number.toLocaleString(undefined, options ?? { maximumFractionDigits: 4 });
}

function formatFundingCountdown(now: number) {
    const hour = 60 * 60 * 1000;
    const remainingSeconds = Math.ceil((hour - (now % hour)) / 1000);
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    return [hours, minutes, seconds].map((value) => value.toString().padStart(2, '0')).join(':');
}

const PerpsFundingMetric = memo(function PerpsFundingMetric({ funding }: { funding?: string }) {
    const [countdown, setCountdown] = useState('--:--:--');

    useEffect(() => {
        const updateCountdown = () => setCountdown(formatFundingCountdown(Date.now()));
        updateCountdown();
        const timer = setInterval(updateCountdown, 1_000);
        return () => clearInterval(timer);
    }, []);

    const rate = Number(funding);
    const hasRate = Number.isFinite(rate);
    const rateText = hasRate ? `${(rate * 100).toFixed(4)}%` : '--';

    return (
        <PerpsMetric
            label={<Trans>Funding/Countdown</Trans>}
            value={
                <>
                    <span className={hasRate ? (rate >= 0 ? 'text-[#3dc233]' : 'text-[#ff564d]') : undefined}>
                        {rateText}
                    </span>{' '}
                    {countdown}
                </>
            }
            valueClassName="w-32"
            helpLabel={t`About Funding`}
            description={<Trans>The current hourly funding rate paid between long and short positions.</Trans>}
        />
    );
});

export const PerpetualsPage = memo(function PerpetualsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const openFireflyWallet = useOpenFireflyWallet();
    const selectedCoin = searchParams.get('coin') || DEFAULT_PERPS_MARKET;
    const selectedMarketDisplayName = toPerpsMarketDisplayName(selectedCoin);
    const { coinInfo, markets, rawCoin, error } = usePerpsMarketData(selectedCoin);
    const { evm: privyEvmAddress } = usePrivyAddresses();
    const accountAddress = privyEvmAddress as PerpsAddress | undefined;
    usePerpsAccountSubscriptions(accountAddress);
    usePerpsMutationSubscriber(accountAddress);

    const handleSelectMarket = useCallback(
        (coin: string) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('coin', coin);
            router.replace(`/perpetuals?${params.toString()}`);
        },
        [router, searchParams],
    );

    const handleWalletIntent = useCallback(
        async (intent: PerpsIntent) => {
            if (!useFireflyProfileStore.getState().currentProfileSession) {
                openLoginModalWithGuard();
                return;
            }
            if (!useFireflyWalletStore.getState().isAuthorized) await waitForAuthorization();
            openFireflyWallet({ path: toPerpsWalletPath(intent) });
        },
        [openFireflyWallet],
    );

    const change = coinInfo?.priceDiffRatio;
    const markPrice = Number(coinInfo?.assetCtx?.markPx);
    const previousPrice = Number(coinInfo?.assetCtx?.prevDayPx);
    const changeAmount =
        Number.isFinite(markPrice) && Number.isFinite(previousPrice) ? markPrice - previousPrice : undefined;
    const metricValues = useMemo(
        () => ({
            leverage: coinInfo ? `${coinInfo.maxLeverage}x` : '--',
            mark: formatMetric(coinInfo?.assetCtx?.markPx),
            oracle: formatMetric(coinInfo?.assetCtx?.oraclePx),
            change:
                change === undefined
                    ? '--'
                    : `${changeAmount === undefined ? '' : `${changeAmount >= 0 ? '+' : ''}${formatMetric(String(changeAmount), { maximumFractionDigits: 0 })}/`}${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
            volume: coinInfo?.assetCtx?.dayNtlVlm
                ? `$${formatMetric(coinInfo.assetCtx.dayNtlVlm, { maximumFractionDigits: 0 })}`
                : '--',
            interest: coinInfo?.assetCtx?.openInterest
                ? `$${formatMetric(String(Number(coinInfo.assetCtx.openInterest) * Number(coinInfo.assetCtx.markPx)), { maximumFractionDigits: 0 })}`
                : '--',
        }),
        [change, changeAmount, coinInfo],
    );

    return (
        <div className="min-h-screen w-full overflow-x-hidden bg-white pb-16 text-lightTextMain">
            <header className="flex h-[60px] items-center justify-between px-4">
                <h1 className="text-xl font-bold leading-6">
                    <Trans>Perpetuals</Trans>
                </h1>
                <PerpsAccountHeader address={accountAddress} onIntent={(intent) => void handleWalletIntent(intent)} />
            </header>
            <div className="flex h-[58px] items-center justify-between gap-4 overflow-visible border-b border-[#f5f5f5] px-3 py-2">
                <PerpsMarketSelector
                    markets={markets}
                    selectedCoin={selectedCoin}
                    leverage={metricValues.leverage}
                    onSelect={handleSelectMarket}
                />
                <div className="no-scrollbar flex min-w-0 items-center overflow-x-auto">
                    <PerpsMetric
                        label={<Trans>Mark</Trans>}
                        value={metricValues.mark}
                        valueClassName="w-14"
                        helpLabel={t`About Mark`}
                        description={<Trans>The fair price used for margin and liquidation calculations.</Trans>}
                    />
                    <PerpsMetric
                        label={<Trans>Oracle</Trans>}
                        value={metricValues.oracle}
                        valueClassName="w-16"
                        helpLabel={t`About Oracle`}
                        description={<Trans>The external reference price reported to Hyperliquid.</Trans>}
                    />
                    <PerpsMetric
                        label={<Trans>24h Change</Trans>}
                        value={metricValues.change}
                        valueClassName={classNames(
                            'w-24',
                            change === undefined
                                ? 'text-lightTextMain'
                                : change >= 0
                                  ? 'text-[#3dc233]'
                                  : 'text-[#ff564d]',
                        )}
                    />
                    <PerpsMetric label={<Trans>24h Volume</Trans>} value={metricValues.volume} valueClassName="w-28" />
                    <PerpsMetric
                        label={<Trans>Open Interest</Trans>}
                        value={metricValues.interest}
                        valueClassName="w-28"
                        helpLabel={t`About Open Interest`}
                        description={<Trans>The notional value of currently open contracts.</Trans>}
                    />
                    <PerpsFundingMetric funding={coinInfo?.assetCtx?.funding} />
                    <span data-testid="perps-market-metric" className="sr-only">
                        <Trans>Maximum leverage</Trans>
                        <span data-testid="perps-market-metric-value">{metricValues.leverage}</span>
                    </span>
                </div>
            </div>
            {error ? (
                <div role="status" className="absolute z-20 bg-amber-50 px-4 py-1 text-xs text-[#767676]">
                    <Trans>Live market updates are reconnecting.</Trans>
                </div>
            ) : null}
            <div className="flex flex-col md:h-[557px] md:flex-row">
                <PerpsChart
                    coin={rawCoin}
                    displayCoin={selectedMarketDisplayName}
                    markPrice={coinInfo?.assetCtx?.markPx}
                />
                <PerpsOrderBook
                    coin={rawCoin}
                    onBuy={() =>
                        void handleWalletIntent({
                            kind: 'place-order',
                            coin: selectedCoin,
                            direction: 'buy',
                            orderType: 'market',
                        })
                    }
                    onSell={() =>
                        void handleWalletIntent({
                            kind: 'place-order',
                            coin: selectedCoin,
                            direction: 'sell',
                            orderType: 'market',
                        })
                    }
                />
            </div>
            <PerpsAccountPanels address={accountAddress} onIntent={(intent) => void handleWalletIntent(intent)} />
        </div>
    );
});
