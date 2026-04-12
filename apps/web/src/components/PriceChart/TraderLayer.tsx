import { EMPTY_LIST } from '@dimensiondev/constants';
import { classNames } from '@dimensiondev/utils';
import { sortBy } from 'lodash-es';
import { createContext, type CSSProperties, useContext, useLayoutEffect, useMemo, useRef } from 'react';

import { AvatarRadius, SafePadding } from '@/components/PriceChart/config.js';
import { TraderAvatar } from '@/components/PriceChart/TraderAvatar.js';
import type { PriceRecord, TradeRecord } from '@/types/token.js';

export interface TooltipState {
    x: number;
    y: number;
    trade?: TradeRecord;
}

export interface TraderLayerOptions {
    tradeRecords?: TradeRecord[];
    /** hovering date */
    activeTradeDate?: number;
    activeTradeHash?: string | null;
    onAvatarHover?: (trade: TradeRecord) => void;
    onAvatarLeave?: () => void;
    onDotUpdate?: (x: number, y: number, date: number, trades: TradeRecord[]) => void;
    onDotClick?: (tradeHash: string) => void;
    onDotMapUpdate?: (dotMap: Record<string, TooltipState>) => void;
}

export const TraderLayerContext = createContext<TraderLayerOptions>({
    tradeRecords: EMPTY_LIST,
});

TraderLayerContext.displayName = 'TraderLayerContext';

const AvatarSize = 2 * AvatarRadius;

export function TraderLayer(props: any) {
    const {
        tradeRecords = EMPTY_LIST,
        activeTradeDate,
        activeTradeHash,
        onAvatarHover,
        onAvatarLeave,
        onDotClick,
        onDotMapUpdate,
    } = useContext(TraderLayerContext);

    const { xAxisMap, yAxisMap } = props;
    const data = props.data as PriceRecord[];

    const xAxis = xAxisMap[Object.keys(xAxisMap)[0]];
    const yAxis = yAxisMap[Object.keys(yAxisMap)[0]];

    const xScaleRef = useRef<(v: any) => number>(xAxis?.scale as (v: any) => number);
    const yScaleRef = useRef<(v: any) => number>(yAxis?.scale as (v: any) => number);
    xScaleRef.current = xAxis?.scale as (v: any) => number;
    yScaleRef.current = yAxis?.scale as (v: any) => number;

    const activeTrade = activeTradeHash ? tradeRecords.find((x) => x.hash === activeTradeHash) : null;
    const sortedRecords = useMemo(() => {
        return sortBy(
            tradeRecords,
            (x) => x.date === activeTradeDate,
            (x) => (x === activeTrade ? 1 : 0),
        );
    }, [activeTrade, activeTradeDate, tradeRecords]);

    useLayoutEffect(() => {
        const map: Record<string, TooltipState> = {};
        sortedRecords.forEach((record) => {
            const index = data.findIndex((x) => x.date === record.date);
            if (index === -1) return;

            const x = xScaleRef.current(index);
            const y = yScaleRef.current(data[index].value);
            map[record.date] = { x, y };
        });
        onDotMapUpdate?.(map);
    }, [tradeRecords, onDotMapUpdate, sortedRecords, data]);

    return (
        <g>
            <svg width={AvatarSize} height={AvatarSize} viewBox={`0 0 ${AvatarSize} ${AvatarSize}`}>
                <defs>
                    {sortedRecords.map((record) => {
                        return (
                            <pattern
                                key={record.hash}
                                id={`avatar-${record.hash}`}
                                patternUnits="objectBoundingBox"
                                height={AvatarSize}
                                width={AvatarSize}
                            >
                                <TraderAvatar
                                    x="0"
                                    y="0"
                                    width={AvatarSize}
                                    height={AvatarSize}
                                    href={record.user.avatar}
                                />
                            </pattern>
                        );
                    })}
                </defs>
            </svg>
            {sortedRecords.map((record) => {
                const offset = tradeRecords.findIndex((x) => x === record);
                const index = data.findIndex((x) => x.date === record.date);
                if (index === -1) return null;

                const cx = xScaleRef.current(index);
                const cy = yScaleRef.current(data[index].value);
                const reachedLeftEdge = cx < SafePadding;
                const reachedRightEdge = cx > xAxis?.width - SafePadding;
                const pinned = activeTrade === record || activeTradeDate === record.date;
                return (
                    <g
                        key={offset}
                        cx={cx}
                        cy={cy}
                        className={classNames(
                            'cursor-pointer transition-all duration-300 ease-in-out hover:scale-[1.4]',
                            pinned ? 'scale-[1.4]' : null,
                        )}
                        style={
                            {
                                transformOrigin: `${cx}px ${cy}px`,
                                '--tw-translate-x': reachedLeftEdge
                                    ? `${SafePadding - cx}px`
                                    : reachedRightEdge
                                      ? `-${cx - xAxis.width + SafePadding}px`
                                      : undefined,
                            } as CSSProperties
                        }
                        onMouseEnter={() => {
                            onAvatarHover?.(record);
                        }}
                        onMouseLeave={() => {
                            onAvatarLeave?.();
                        }}
                        onClick={() => {
                            onDotClick?.(record.hash);
                        }}
                    >
                        <circle
                            cx={cx}
                            cy={cy}
                            r={AvatarRadius - 1} // to avoid clipping the stroke
                            stroke={record.type === 'buy' ? 'rgb(var(--color-success))' : 'rgb(var(--color-danger))'}
                            strokeWidth={2}
                            fill={`url(#avatar-${record.hash})`}
                        />
                    </g>
                );
            })}
        </g>
    );
}
