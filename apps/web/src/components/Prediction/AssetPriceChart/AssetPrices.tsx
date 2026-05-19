import PriceDownIcon from '@dimensiondev/assets/price-down.svg';
import PriceUpIcon from '@dimensiondev/assets/price-up.svg';
import type { PredictionPlatform } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { isZero, minus } from '@dimensiondev/web3/numbers';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';
import urlcat from 'urlcat';

import { CountdownTimer } from '@/components/Prediction/AssetPriceChart/CountdownTimer.js';
import { GoLiveButton } from '@/components/Prediction/AssetPriceChart/GoLiveButton.js';
import type { PredictionCrypto } from '@/constants/bets.js';
import { STALE_TIMES } from '@/constants/query.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { resolveBinanceCrypto } from '@/providers/firefly/prediction/resolveCrypto.js';
import { resolveCryptoPriceVariant } from '@/providers/firefly/prediction/resolveCryptoPriceVariant.js';
import { formatCryptoPrice } from '@/providers/prediction/formatCryptoPrice.js';
import type { CryptoPrice } from '@/providers/prediction/polymarket/type.js';
import type { PredictionRecurrence } from '@/types/prediction.js';
import type { ResponseJson } from '@/types/utility.js';

interface AssetPricesProps {
    endDate: string;
    latestPrice: number | null;
    recurrence: PredictionRecurrence;
    seriesId: string;
    platform: PredictionPlatform;
    priceToBeat?: number;
    finalPrice?: number;
    startTime: string;
    crypto: PredictionCrypto;
    isActive: boolean;
}

export const AssetPrices = memo<AssetPricesProps>(function AssetPrices({
    endDate,
    recurrence,
    latestPrice,
    seriesId,
    platform,
    startTime,
    crypto,
    isActive,
    ...rest
}) {
    const { data } = useQuery({
        queryKey: [Source.Prediction, 'crypto-price', platform, crypto, startTime, endDate],
        staleTime: STALE_TIMES.MINUTE_5,
        enabled: !rest.priceToBeat || !rest.finalPrice, // skip if both prices are provided
        queryFn: async () => {
            const response = await fetchJson<ResponseJson<CryptoPrice>>(
                urlcat('/api/polymarket/crypto-price', {
                    symbol: resolveBinanceCrypto(crypto),
                    variant: resolveCryptoPriceVariant(recurrence),
                    eventStartTime: startTime,
                    endDate,
                }),
            );
            return resolveResponseData(response);
        },
    });

    const completed = !isActive;

    const finalPrice = rest.finalPrice ?? data?.closePrice ?? null;
    const priceToBeat = rest.priceToBeat ?? data?.openPrice ?? null;
    const currentPrice = completed ? finalPrice : latestPrice;
    const priceDiff = currentPrice !== null && priceToBeat ? minus(currentPrice, priceToBeat).toNumber() : null;
    const priceChanged = priceDiff !== null && !isZero(priceDiff);

    return (
        <div className="mb-3 flex items-end justify-between px-4">
            <div className="flex gap-5">
                <div className="flex flex-col gap-1">
                    <span className="text-second text-[10px] font-bold">
                        <Trans>Price to beat</Trans>
                    </span>
                    <span className="text-second text-base font-black">
                        {priceToBeat ? formatCryptoPrice(crypto, priceToBeat) : 'N/A'}
                    </span>
                </div>
                <div className="border-lightLineSecond flex flex-col gap-1 border-l pl-5">
                    <div
                        className={classNames(
                            'flex items-center gap-1',
                            priceChanged ? (priceDiff > 0 ? 'text-success' : 'text-danger') : '',
                        )}
                    >
                        <span className={classNames('text-[10px] font-bold', completed ? 'text-main' : 'text-warn')}>
                            {completed ? <Trans>Final price</Trans> : <Trans>Current price</Trans>}
                        </span>
                        {priceChanged ? (
                            <>
                                {priceDiff > 0 ? <PriceUpIcon /> : <PriceDownIcon />}
                                <span className="text-[10px] font-bold">{`${priceDiff > 0 ? '+' : '-'}${formatCryptoPrice(crypto, Math.abs(priceDiff))}`}</span>
                            </>
                        ) : null}
                    </div>
                    <span className={classNames('text-base font-black', completed ? 'text-main' : 'text-warn')}>
                        {currentPrice !== null ? formatCryptoPrice(crypto, currentPrice) : 'N/A'}
                    </span>
                </div>
            </div>

            {completed ? (
                <GoLiveButton platform={platform} seriesId={seriesId} recurrence={recurrence} />
            ) : (
                <CountdownTimer endTime={new Date(endDate).getTime()} />
            )}
        </div>
    );
});
