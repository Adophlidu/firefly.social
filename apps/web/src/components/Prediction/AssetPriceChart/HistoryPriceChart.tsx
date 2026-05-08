import { EMPTY_LIST } from '@dimensiondev/constants';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { memo, useCallback } from 'react';
import { Customized, Line, LineChart, ResponsiveContainer, Tooltip, type TooltipProps, XAxis, YAxis } from 'recharts';
import type { AxisDomain } from 'recharts/types/util/types.js';
import urlcat from 'urlcat';

import { Loading } from '@/components/Loading.js';
import { CryptoIcon } from '@/components/Prediction/PredictionSeries/CryptoIconButton.js';
import { SafePadding } from '@/components/PriceChart/config.js';
import { CRYPTO_PRICE_CHART_HEIGHT, type PredictionCrypto } from '@/constants/bets.js';
import { Source } from '@/constants/enum.js';
import { STALE_TIMES } from '@/constants/query.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { resolveBinanceCrypto } from '@/providers/firefly/prediction/resolveCrypto.js';
import { resolveCryptoPriceVariant } from '@/providers/firefly/prediction/resolveCryptoPriceVariant.js';
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

const YAxisDomain: AxisDomain = ([dataMin, dataMax]) => {
    const padding = (dataMax - dataMin) * (SafePadding / CRYPTO_PRICE_CHART_HEIGHT);
    return [dataMin - padding, dataMax + padding];
};

function formatPrice(price: number) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

interface ChartOverlayProps {
    xAxisMap?: Record<string, { scale: (v: number) => number }>;
    yAxisMap?: Record<string, { scale: (v: number) => number; domain: number[] }>;
    priceToBeat: number | null;
    dataMin: number;
    dataMax: number;
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
    dataMin,
    dataMax,
    timestamps,
    width: totalWidth,
    offset,
}: ChartOverlayProps) {
    const yAxis = yAxisMap ? yAxisMap[Object.keys(yAxisMap)[0]] : null;
    const xAxis = xAxisMap ? xAxisMap[Object.keys(xAxisMap)[0]] : null;
    if (!yAxis?.scale) return null;

    const yScale = yAxis.scale;
    const xScale = xAxis?.scale;
    const left = offset?.left ?? 0;
    const right = offset?.right ?? 0;
    const top = offset?.top ?? 0;
    const lineWidth = (totalWidth ?? 0) - left - right;
    const dataMid = (dataMin + dataMax) / 2;
    const refLines = [
        { value: dataMax, y: yScale(dataMax) },
        { value: dataMid, y: yScale(dataMid) },
        { value: dataMin, y: yScale(dataMin) },
    ];

    const targetY = priceToBeat !== null ? yScale(priceToBeat) : null;
    const badgeWidth = 46;
    const badgeHeight = 14;
    const badgePad = 8;
    const labelX = left + lineWidth - 4;

    return (
        <g>
            {/* Reference lines */}
            {refLines.map(({ value, y }, i) => (
                <g key={`${value}-${i}`} className="text-second">
                    <line
                        x1={left}
                        y1={y + top}
                        x2={left + lineWidth - badgeWidth - badgePad}
                        y2={y + top}
                        stroke="currentColor"
                        strokeWidth={0.5}
                        strokeDasharray="3 3"
                    />
                    <text
                        x={labelX}
                        y={y + top + 4}
                        textAnchor="end"
                        fill="currentColor"
                        fontSize={8}
                        fontFamily="Inter, sans-serif"
                    >
                        {formatPrice(value)}
                    </text>
                </g>
            ))}

            {/* Target dashed line + badge */}
            {targetY !== null && priceToBeat !== null ? (
                <g>
                    <line
                        x1={left}
                        y1={targetY + top}
                        x2={left + lineWidth}
                        y2={targetY + top}
                        stroke="currentColor"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        className="text-second"
                    />
                    {/* Badge background */}
                    <rect
                        x={left + lineWidth - badgeWidth}
                        y={targetY + top - badgeHeight / 2}
                        width={badgeWidth}
                        height={badgeHeight}
                        rx={badgeHeight / 2}
                        fill="currentColor"
                        className="text-second"
                    />
                    <text
                        x={left + lineWidth - badgeWidth / 2}
                        y={targetY + top + 3.5}
                        textAnchor="middle"
                        fill="white"
                        fontSize={9}
                        fontWeight="bold"
                        fontFamily="Inter, sans-serif"
                    >
                        <Trans>Target</Trans>
                    </text>
                </g>
            ) : null}

            {/* X-axis time labels */}
            {xScale && timestamps.length > 0
                ? (() => {
                      const count = 7;
                      const last = timestamps.length - 1;
                      const indices = Array.from({ length: count }, (_, i) => Math.round((i / (count - 1)) * last));
                      const chartBottom = top + (CRYPTO_PRICE_CHART_HEIGHT - (offset?.bottom ?? 0));
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
                                          y={chartBottom + 8}
                                          textAnchor={anchor}
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
                    <span>{formatPrice(payload.value as number)}</span>
                </div>
                <p className="text-second font-medium">{dayjs(payload.payload.date).format('MMM D, YYYY h:mm:ss A')}</p>
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
        queryKey: [Source.Prediction, 'crypto-prices', crypto],
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

    const Overlay = useCallback(
        (props: object) => {
            const values = data?.map((d) => d.value) || [];
            const dataMin = Math.min(...values);
            const dataMax = Math.max(...values);
            const timestamps = data?.map((d) => d.date) || [];

            return (
                <ChartOverlay
                    {...(props as ChartOverlayProps)}
                    priceToBeat={priceToBeat ?? null}
                    dataMin={dataMin}
                    dataMax={dataMax}
                    timestamps={timestamps}
                />
            );
        },
        [priceToBeat, data],
    );

    if (isLoading) return <Loading minHeight={CRYPTO_PRICE_CHART_HEIGHT} />;
    if (!data?.length)
        return (
            <div className="flex w-full items-center justify-center" style={{ height: CRYPTO_PRICE_CHART_HEIGHT }}>
                <span className="text-second text-sm font-medium">
                    <Trans>No price data.</Trans>
                </span>
            </div>
        );

    const color = resolveCryptoColor(crypto);

    return (
        <div className="relative w-full" style={{ height: CRYPTO_PRICE_CHART_HEIGHT }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={CustomTooltip} />
                    <XAxis hide dataKey="date" />
                    <YAxis hide domain={YAxisDomain} />
                    <Line
                        type="monotone"
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
