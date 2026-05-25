import { EMPTY_LIST } from '@dimensiondev/constants';
import { Source } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { memo, useCallback, useMemo } from 'react';
import { Customized, Line, LineChart, ResponsiveContainer, Tooltip, type TooltipProps, XAxis, YAxis } from 'recharts';
import urlcat from 'urlcat';

import { Loading } from '@/components/Loading.js';
import {
    CRYPTO_PRICE_CHART_LABEL_INSET,
    CRYPTO_PRICE_CHART_MARGIN,
    getCryptoPricePlotHeight,
} from '@/components/Prediction/AssetPriceChart/chartLayout.js';
import { CryptoPriceTargetOverlay } from '@/components/Prediction/AssetPriceChart/CryptoPriceTargetOverlay.js';
import { CryptoIcon } from '@/components/Prediction/PredictionSeries/CryptoIconButton.js';
import { CRYPTO_PRICE_CHART_HEIGHT, type PredictionCrypto } from '@/constants/bets.js';
import { STALE_TIMES } from '@/constants/query.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { resolveBinanceCrypto } from '@/providers/firefly/prediction/resolveCrypto.js';
import { resolveCryptoPriceVariant } from '@/providers/firefly/prediction/resolveCryptoPriceVariant.js';
import { computeCryptoPriceYTicks } from '@/providers/prediction/computeCryptoPriceYTicks.js';
import { formatCryptoPrice } from '@/providers/prediction/formatCryptoPrice.js';
import type { CryptoPriceHistory } from '@/providers/prediction/polymarket/type.js';
import { resolveCryptoColor } from '@/providers/prediction/resolveCryptoColor.js';
import type { PredictionRecurrence } from '@/types/prediction.js';
import type { ResponseJson } from '@/types/utility.js';

interface HistoryPriceChartProps {
    crypto: PredictionCrypto;
    eventStartTime: string;
    endDate: string;
    recurrence: PredictionRecurrence;
    priceToBeat?: number;
}

interface ChartOverlayProps {
    crypto: PredictionCrypto;
    xAxisMap?: Record<string, { scale: (v: number) => number }>;
    yAxisMap?: Record<string, { scale: (v: number) => number; domain: number[] }>;
    priceToBeat: number | null;
    ticks: number[];
    timestamps: number[];
    width?: number;
    height?: number;
    offset?: { left: number; right: number; top: number; bottom: number; width?: number; height?: number };
}

function formatTimestamp(ts: number): string {
    return new Date(ts).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });
}

function ChartOverlay({
    yAxisMap,
    xAxisMap,
    priceToBeat = null,
    ticks,
    timestamps,
    width: totalWidth,
    offset,
    crypto,
}: ChartOverlayProps) {
    const yAxis = yAxisMap ? yAxisMap[Object.keys(yAxisMap)[0]] : null;
    const xAxis = xAxisMap ? xAxisMap[Object.keys(xAxisMap)[0]] : null;
    if (!yAxis?.scale) return null;

    const yScale = yAxis.scale;
    const xScale = xAxis?.scale;
    const left = offset?.left ?? 0;
    const right = offset?.right ?? 0;
    const top = offset?.top ?? 0;
    const plotWidth = (totalWidth ?? 0) - left - right;
    const plotRight = left + plotWidth;
    // Recharts axis scales already include offset.top/left in their range — do not add margin again.
    const refLines = ticks.map((value) => ({ value, y: yScale(value) }));

    const chartRight = (totalWidth ?? 0) - CRYPTO_PRICE_CHART_LABEL_INSET;
    const plotHeight = offset?.height ?? getCryptoPricePlotHeight();
    const domain = yAxis.domain;
    const range = { min: domain[0], max: domain[1] };

    return (
        <g>
            {/* Reference lines */}
            {refLines.map(({ value, y }, i) => {
                return (
                    <g key={`${value}-${i}`} className="text-second">
                        <line
                            x1={left}
                            y1={y}
                            x2={plotRight}
                            y2={y}
                            stroke="currentColor"
                            strokeWidth={0.5}
                            strokeDasharray="3 3"
                        />
                        <text
                            x={chartRight}
                            y={y}
                            textAnchor="end"
                            dominantBaseline="middle"
                            fill="currentColor"
                            fontSize={8}
                            fontFamily="Inter, sans-serif"
                        >
                            {formatCryptoPrice(crypto, value)}
                        </text>
                    </g>
                );
            })}

            {priceToBeat !== null ? (
                <CryptoPriceTargetOverlay
                    priceToBeat={priceToBeat}
                    ticks={ticks}
                    yScale={yScale}
                    left={left}
                    plotRight={plotRight}
                    chartRight={chartRight}
                    plotTop={top}
                    plotHeight={plotHeight}
                    range={range}
                />
            ) : null}

            {/* X-axis time labels */}
            {xScale && timestamps.length > 0
                ? (() => {
                      const count = 7;
                      const last = timestamps.length - 1;
                      const indices = Array.from({ length: count }, (_, i) => Math.round((i / (count - 1)) * last));
                      // offset.height is the plot area height; bottom edge = top + height
                      const plotBottom =
                          top +
                          (offset?.height ??
                              CRYPTO_PRICE_CHART_HEIGHT -
                                  CRYPTO_PRICE_CHART_MARGIN.top -
                                  CRYPTO_PRICE_CHART_MARGIN.bottom);
                      return (
                          <g className="text-second">
                              {indices.map((idx, i) => {
                                  const ts = timestamps[idx];
                                  const x = xScale(ts);
                                  const anchor = i === 0 ? 'start' : i === count - 1 ? 'end' : 'middle';
                                  return (
                                      <text
                                          key={`ts-${ts}-${i}`}
                                          x={x}
                                          y={plotBottom + 6}
                                          textAnchor={anchor}
                                          dominantBaseline="hanging"
                                          fill="currentColor"
                                          fontSize={6}
                                          fontWeight="bold"
                                          fontFamily="Inter, sans-serif"
                                          style={{ textTransform: 'uppercase', letterSpacing: '0.326px' }}
                                      >
                                          {formatTimestamp(ts)}
                                      </text>
                                  );
                              })}
                          </g>
                      );
                  })()
                : null}
        </g>
    );
}

function CustomTooltip(props: TooltipProps<number, string>) {
    const payload = props.payload?.[0];
    const crypto = payload?.payload?.crypto as PredictionCrypto | undefined;

    if (props.active && payload && crypto) {
        const color = resolveCryptoColor(crypto);

        return (
            <div className="flex flex-col items-center text-xs">
                <div className="flex items-center gap-1 font-medium" style={{ color }}>
                    <div
                        className="flex size-4 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: color }}
                    >
                        <CryptoIcon crypto={crypto} width={12} height={12} />
                    </div>
                    <span>{formatCryptoPrice(crypto, payload.value as number)}</span>
                </div>
                <p className="font-medium text-second">{dayjs(payload.payload.date).format('MMM D, YYYY h:mm:ss A')}</p>
            </div>
        );
    }

    return null;
}

export const HistoryPriceChart = memo<HistoryPriceChartProps>(function HistoryPriceChart({
    crypto,
    eventStartTime,
    endDate,
    recurrence,
    priceToBeat,
}) {
    const { data, isLoading } = useQuery({
        queryKey: [Source.Prediction, 'crypto-prices', crypto, eventStartTime, endDate, recurrence],
        staleTime: STALE_TIMES.MINUTE_5,
        queryFn: async () => {
            const response = await fetchJson<ResponseJson<CryptoPriceHistory>>(
                urlcat('/api/polymarket/crypto-price-history', {
                    symbol: resolveBinanceCrypto(crypto),
                    variant: resolveCryptoPriceVariant(recurrence),
                    eventStartTime,
                    endDate,
                }),
            );
            return resolveResponseData(response);
        },
        select: (data) => {
            if (!data?.length || !eventStartTime || !endDate) return EMPTY_LIST;

            return data.map((p) => ({
                date: p.timestamp,
                value: p.value,
                crypto,
            }));
        },
    });

    const values = useMemo(() => data?.map((point) => point.value) ?? [], [data]);
    const { ticks, domain: yDomain } = useMemo(() => {
        const tickValues =
            priceToBeat !== undefined && Number.isFinite(priceToBeat) ? [...values, priceToBeat] : values;
        return computeCryptoPriceYTicks({ values: tickValues });
    }, [values, priceToBeat]);

    const Overlay = useCallback(
        (props: object) => {
            const timestamps = data?.map((point) => point.date) ?? [];

            return (
                <ChartOverlay
                    {...(props as ChartOverlayProps)}
                    crypto={crypto}
                    priceToBeat={priceToBeat ?? null}
                    ticks={ticks}
                    timestamps={timestamps}
                />
            );
        },
        [priceToBeat, ticks, data, crypto],
    );

    if (isLoading) return <Loading minHeight={CRYPTO_PRICE_CHART_HEIGHT} />;
    if (!data?.length)
        return (
            <div className="flex w-full items-center justify-center" style={{ height: CRYPTO_PRICE_CHART_HEIGHT }}>
                <span className="text-sm font-medium text-second">
                    <Trans>No price data.</Trans>
                </span>
            </div>
        );

    const color = resolveCryptoColor(crypto);

    return (
        <div className="relative w-full" style={{ height: CRYPTO_PRICE_CHART_HEIGHT }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={CRYPTO_PRICE_CHART_MARGIN}>
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={CustomTooltip} />
                    <XAxis hide dataKey="date" padding={{ left: 0, right: 4 }} />
                    <YAxis hide type="number" domain={yDomain} allowDataOverflow={false} />
                    <Line
                        type="linear"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        fill={color}
                        fillOpacity={0.1}
                        name="Price"
                        activeDot={false}
                        dot={false}
                    />
                    <Customized component={Overlay} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
});
