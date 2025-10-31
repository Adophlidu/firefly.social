import { classNames } from '@firefly/utils';
import { type CSSProperties, type HTMLProps, memo, useMemo, useState } from 'react';
import { Area, AreaChart, Customized, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import type { AxisDomain } from 'recharts/types/util/types.js';

import { PriceChartHeight, SafePadding } from '@/components/PriceChart/config.js';
import {
    type TooltipState,
    TraderLayer,
    TraderLayerContext,
    type TraderLayerOptions,
} from '@/components/PriceChart/TraderLayer.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { formatBalance, trimZero } from '@/helpers/formatBalance.js';
import { useIsPriceUp } from '@/hooks/useIsPriceUp.js';
import type { PriceRecord, TradeRecord } from '@/types/token.js';

interface TradeTooltipProps extends HTMLProps<HTMLDivElement> {
    x: number;
    y: number;
    trade: TradeRecord | null;
}
function TradeTooltip({ x, y, trade, className, ...rest }: TradeTooltipProps) {
    if (!trade) return null;

    const value = trade.decimals ? formatBalance(trade.amount, trade.decimals) : trimZero(trade.uiAmount);
    return (
        <div
            className={classNames(
                'h-[18px] rounded-[12px] px-2 font-mono text-sm font-bold leading-[18px] text-white',
                className,
            )}
            {...rest}
        >
            {`${trade.type === 'buy' ? '+' : '-'}${value}`}
        </div>
    );
}

interface PriceChartProps extends HTMLProps<HTMLDivElement> {
    records: PriceRecord[];
    tradeRecords?: TradeRecord[];
    activeTradeHash?: string | null;
    onHover?: (payload: PriceRecord) => void;
    onMouseLeave?: () => void;
    onDotClick?: TraderLayerOptions['onDotClick'];
}

const YAxisDomain: AxisDomain = ([dataMin, dataMax]) => {
    const padding = (dataMax - dataMin) * (SafePadding / PriceChartHeight);
    return [dataMin - padding, dataMax + padding];
};

export const PriceChart = memo<PriceChartProps>(function PriceChart({
    records,
    tradeRecords = EMPTY_LIST,
    activeTradeHash,
    onHover,
    onMouseLeave,
    onDotClick,
    ...props
}) {
    const { isUp } = useIsPriceUp(records);
    const [activeRecord, setActiveRecord] = useState<PriceRecord>();
    // Avatar is large enough to magnetically attract the cursor.
    const [hoveringTrade, setHoveringTrade] = useState<TradeRecord>();
    const [dotMap, setDotMap] = useState<Record<string, TooltipState>>({});

    const activeDate = hoveringTrade?.date ?? activeRecord?.date;
    const tooltipState = useMemo(() => {
        const activeTrade = activeTradeHash ? tradeRecords.find((x) => x.hash === activeTradeHash) : null;
        const trade = activeDate ? tradeRecords.find((x) => x.date === activeDate) || activeTrade : activeTrade;

        if (!trade?.date) return;
        const dateMatchedState = dotMap[trade.date];
        if (!dateMatchedState) return;

        // prefer active trade if exists
        const activeTradeState = activeTrade ? dotMap[activeTrade.date] : null;
        if (activeTradeState?.x === dateMatchedState.x) return { ...activeTradeState, trade: activeTrade! };

        return {
            ...dateMatchedState,
            trade,
        };
    }, [activeDate, activeTradeHash, dotMap, tradeRecords]);

    const traderLayerValue: TraderLayerOptions = useMemo(() => {
        return {
            tradeRecords,
            activeTradeDate: activeDate,
            activeTradeHash,
            onAvatarHover: setHoveringTrade,
            onAvatarLeave: () => {
                setHoveringTrade(undefined);
            },
            onDotClick,
            onDotMapUpdate: setDotMap,
        };
    }, [tradeRecords, activeDate, activeTradeHash, onDotClick]);

    const [tooltipWidth, setTooltipWidth] = useState(100);
    const [containerWidth, setContainerWidth] = useState(560);
    const isOverflow = tooltipState ? tooltipState.x + 20 + tooltipWidth > containerWidth : false;

    const tooltipStyle: CSSProperties | undefined = tooltipState
        ? {
              left: `${isOverflow ? Math.min(tooltipState.x, containerWidth - SafePadding) - 20 - tooltipWidth : Math.max(tooltipState.x, SafePadding) + 20}px`,
              top: `${tooltipState.y - 10}px`,
              backgroundColor:
                  tooltipState.trade?.type === 'buy' ? 'rgb(var(--color-success))' : 'rgb(var(--color-danger))',
          }
        : undefined;
    return (
        <div {...props} className={classNames('relative overflow-visible', props.className)}>
            <TraderLayerContext value={traderLayerValue}>
                <ResponsiveContainer width="100%" height="100%" onResize={setContainerWidth}>
                    <AreaChart
                        data={records}
                        onMouseMove={(e) => {
                            if (!e.activePayload?.length) return;
                            const record = e.activePayload[0].payload;
                            onHover?.(record);
                            setActiveRecord(record);
                        }}
                        onMouseLeave={() => {
                            onMouseLeave?.();
                            setActiveRecord(undefined);
                        }}
                        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                    >
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={() => null} />
                        <YAxis domain={YAxisDomain} hide />
                        <Area
                            type="monotone"
                            dataKey="value"
                            baseValue="dataMin"
                            stroke={isUp ? 'rgb(var(--color-success))' : 'rgb(var(--color-danger))'}
                            strokeWidth={2}
                            fill={isUp ? 'rgb(var(--color-success)/0.1)' : 'rgb(var(--color-danger)/0.1)'}
                            name="Price"
                            activeDot={false}
                        />
                        <Customized component={TraderLayer} />
                    </AreaChart>
                </ResponsiveContainer>
            </TraderLayerContext>
            {tooltipState ? (
                <TradeTooltip
                    ref={(el) => {
                        setTooltipWidth(el?.offsetWidth ?? 100);
                    }}
                    className={'pointer-events-none absolute z-10'}
                    style={tooltipStyle}
                    x={tooltipState.x}
                    y={tooltipState.y}
                    trade={tooltipState.trade}
                />
            ) : null}
        </div>
    );
});
