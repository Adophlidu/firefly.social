import {
    type CSSProperties,
    type HTMLProps,
    memo,
    type ReactElement,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

import { useMergeRecords } from '@/components/PriceChart/useMergeRecords.js';
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

interface CustomizedDotProps extends HTMLProps<SVGElement> {
    active?: boolean;
    payload: PriceRecord;
    tradeRecords?: TradeRecord[];
    activeTradeDate?: number;
    cx: number;
    cy: number;
    onAvatarHover?: (trade: TradeRecord) => void;
    onAvatarLeave?: () => void;
    onDotUpdate?: (x: number, y: number, trade: TradeRecord) => void;
}

function CustomizedDot({
    cx,
    cy,
    payload,
    tradeRecords,
    activeTradeDate,
    onAvatarHover,
    onAvatarLeave,
    onDotUpdate,
}: CustomizedDotProps): ReactElement<SVGElement> {
    const records = useMemo(
        () => tradeRecords?.filter((x) => x.date === payload.date) || EMPTY_LIST,
        [tradeRecords, payload.date],
    );

    const hasActiveDate = !!activeTradeDate && records.some((x) => x.date === activeTradeDate);
    const record = records.find((x) => x.date === activeTradeDate);
    useEffect(() => {
        if (!hasActiveDate || !onDotUpdate || !record) return;
        onDotUpdate(cx, cy, record);
    }, [hasActiveDate, cx, cy, onDotUpdate, record]);

    if (records.length) {
        const baseRadius = 10;
        const baseSize = 2 * baseRadius;
        return (
            <g>
                <svg width={baseSize} height={baseSize} viewBox={`0 0 ${baseSize} ${baseSize}`}>
                    <defs>
                        {records.map((record) => {
                            return (
                                <pattern
                                    key={record.date}
                                    id={`avatar-${record.date}`}
                                    patternUnits="objectBoundingBox"
                                    height={baseSize}
                                    width={baseSize}
                                >
                                    <image x="0" y="0" width={baseSize} height={baseSize} href={record.user.avatar} />
                                </pattern>
                            );
                        })}
                    </defs>
                </svg>
                {records.map((record, i) => {
                    return (
                        <g
                            key={i}
                            cx={cx}
                            cy={cy}
                            className={classNames(
                                'cursor-pointer transition-all duration-300 ease-in-out hover:scale-[1.2]',
                                activeTradeDate === record.date ? 'scale-[1.2]' : null,
                            )}
                            style={{ transformOrigin: `${cx}px ${cy}px` }}
                            onMouseEnter={() => {
                                onAvatarHover?.(record);
                            }}
                            onMouseLeave={() => {
                                onAvatarLeave?.();
                            }}
                        >
                            <circle
                                cx={cx}
                                cy={cy}
                                r={baseRadius - 1} // to avoid clipping the stroke
                                stroke={
                                    record.type === 'buy' ? 'rgb(var(--color-success))' : 'rgb(var(--color-danger))'
                                }
                                strokeWidth={2}
                                fill={`url(#avatar-${record.date})`}
                            />
                        </g>
                    );
                })}
            </g>
        );
    }

    return null as unknown as ReactElement<SVGElement>;
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

interface Props extends HTMLProps<HTMLDivElement> {
    records: PriceRecord[];
    tradeRecords?: TradeRecord[];
    activeTradeDate?: number;
    onHover?: (payload: PriceRecord) => void;
    onMouseLeave?: () => void;
}

const YAxisDomain = ['auto', 'auto'];
export const PriceChart = memo<Props>(function PriceChart({
    records,
    tradeRecords = EMPTY_LIST,
    activeTradeDate: propActiveTradeDate,
    onHover,
    onMouseLeave,
    ...props
}) {
    const { isUp } = useIsPriceUp(records);
    const mergedRecords = useMergeRecords(records, tradeRecords);
    const [activeRecord, setActiveRecord] = useState<PriceRecord>();
    const [dotMap, setDotMap] = useState<Record<string, TooltipState>>({});

    const handleDotUpdate = useCallback((x: number, y: number, trade: TradeRecord): void => {
        setDotMap((map) => ({
            ...map,
            [trade.date]: { x, y, trade },
        }));
    }, []);
    const activeTradeDate = activeRecord?.date || propActiveTradeDate;
    const [hoveringTradeDate, setHoveringTradeDate] = useState<number>();
    const dateKey = hoveringTradeDate || activeTradeDate;
    const tooltipState = dateKey ? dotMap[dateKey] : undefined;
    const WrappedDot = useCallback(
        ({ key, ...props }: CustomizedDotProps) => {
            return (
                <CustomizedDot
                    {...props}
                    key={key}
                    activeTradeDate={activeTradeDate}
                    tradeRecords={tradeRecords}
                    onAvatarHover={(trade) => {
                        setHoveringTradeDate(trade.date);
                    }}
                    onAvatarLeave={() => {
                        setHoveringTradeDate(undefined);
                    }}
                    onDotUpdate={handleDotUpdate}
                />
            );
        },
        [activeTradeDate, tradeRecords, handleDotUpdate],
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
    const activeItem = mergedRecords.find((x) => x.date === activeTradeDate);
    return (
        <div {...props} className={classNames('relative overflow-visible', props.className)}>
            <ResponsiveContainer width="100%" height="100%" onResize={setContainerWidth}>
                <AreaChart
                    data={mergedRecords}
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
                    <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        active={!!activeTradeDate}
                        payload={activeItem ? [{ value: activeItem.value, payload: activeItem }] : undefined}
                        content={() => null}
                    />
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
