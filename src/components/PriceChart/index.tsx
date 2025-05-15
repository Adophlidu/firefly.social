import { isNumber } from 'lodash-es';
import { type CSSProperties, type HTMLProps, memo, useCallback, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

import { CustomizedDot, type CustomizedDotProps } from '@/components/PriceChart/CustomDot.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { formatBalance, trimZero } from '@/helpers/formatBalance.js';
import { useIsPriceUp } from '@/hooks/useIsPriceUp.js';
import type { PriceRecord, TradeRecord } from '@/types/token.js';

interface TooltipState {
    visible: boolean;
    x: number;
    y: number;
    trade: TradeRecord;
}

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

export interface PriceChartProps extends HTMLProps<HTMLDivElement> {
    records: PriceRecord[];
    tradeRecords?: TradeRecord[];
    activeTradeIndex?: number;
    onHover?: (payload: PriceRecord) => void;
    onMouseLeave?: () => void;
    onDotClick?: (dotIndex: number) => void;
}

const YAxisDomain = ['auto', 'auto'];
export const PriceChart = memo<PriceChartProps>(function PriceChart({
    records,
    tradeRecords = EMPTY_LIST,
    activeTradeIndex,
    onHover,
    onMouseLeave,
    onDotClick,
    ...props
}) {
    const { isUp } = useIsPriceUp(records);
    const [activeRecord, setActiveRecord] = useState<PriceRecord>();
    const [dotMap, setDotMap] = useState<Record<string, TooltipState>>({});

    const handleDotUpdate = useCallback((x: number, y: number, trade: TradeRecord): void => {
        setDotMap((map) => ({
            ...map,
            [trade.date]: { x, y, trade },
        }));
    }, []);
    const activeDate =
        activeRecord?.date || (isNumber(activeTradeIndex) ? tradeRecords[activeTradeIndex]?.date : undefined);
    const [hoveringTradeDate, setHoveringTradeDate] = useState<number>();
    const dateKey = hoveringTradeDate || activeDate;
    const tooltipState = dateKey ? dotMap[dateKey] : undefined;
    const WrappedDot = useCallback(
        ({ key, ...props }: CustomizedDotProps) => {
            return (
                <CustomizedDot
                    {...props}
                    key={key}
                    activeTradeDate={activeDate}
                    activeTradeIndex={activeTradeIndex}
                    tradeRecords={tradeRecords}
                    onAvatarHover={(trade) => {
                        setHoveringTradeDate(trade.date);
                    }}
                    onAvatarLeave={() => {
                        setHoveringTradeDate(undefined);
                    }}
                    onDotUpdate={handleDotUpdate}
                    onDotClick={onDotClick}
                />
            );
        },
        [activeDate, activeTradeIndex, tradeRecords, handleDotUpdate, onDotClick],
    );

    const [tooltipWidth, setTooltipWidth] = useState(100);
    const [containerWidth, setContainerWidth] = useState(560);
    const isOverflow = tooltipState ? tooltipState.x + 20 + tooltipWidth > containerWidth : false;

    const tooltipStyle: CSSProperties | undefined = tooltipState
        ? {
              left: `${isOverflow ? tooltipState.x - 20 - tooltipWidth : tooltipState.x + 20}px`,
              top: `${tooltipState.y - 10}px`,
              backgroundColor:
                  tooltipState.trade?.type === 'buy' ? 'rgb(var(--color-success))' : 'rgb(var(--color-danger))',
          }
        : undefined;
    return (
        <div {...props} className={classNames('relative overflow-visible', props.className)}>
            <ResponsiveContainer width="100%" height="100%" onResize={setContainerWidth}>
                <AreaChart
                    data={records}
                    onMouseMove={(e) => {
                        if (!e.activePayload?.length) return;
                        onHover?.(e.activePayload[0].payload);
                        setActiveRecord(e.activePayload[0].payload);
                    }}
                    onMouseLeave={() => {
                        onMouseLeave?.();
                        setActiveRecord(undefined);
                    }}
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
                        dot={WrappedDot}
                        activeDot={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
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
