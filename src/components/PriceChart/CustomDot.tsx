import { isNumber } from 'lodash-es';
import { type HTMLProps, memo, type ReactElement, type SVGAttributes, useEffect, useMemo, useState } from 'react';
import { useUpdateEffect } from 'react-use';

import { useResolveAvatarFallbackUrl } from '@/components/Avatar.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import type { PriceRecord, TradeRecord } from '@/types/token.js';

export interface CustomizedDotProps extends HTMLProps<SVGElement> {
    active?: boolean;
    payload: PriceRecord;
    tradeRecords?: TradeRecord[];
    activeTradeDate?: number;
    activeTradeIndex?: number;
    cx: number;
    cy: number;
    onAvatarHover?: (trade: TradeRecord) => void;
    onAvatarLeave?: () => void;
    onDotUpdate?: (x: number, y: number, trade: TradeRecord) => void;
    onDotClick?: (dotIndex: number) => void;
}

function UserAvatar(props: SVGAttributes<SVGImageElement>) {
    const [failed, setFailed] = useState(false);
    const isDarkMode = useIsDarkMode();
    const { data: xFallbackUrl } = useResolveAvatarFallbackUrl(props.href);

    const fallbackUrl = isDarkMode ? '/image/firefly-dark-avatar.png' : '/image/firefly-light-avatar.png';
    const avatar = failed ? fallbackUrl : xFallbackUrl || props.href || fallbackUrl;

    useUpdateEffect(() => {
        setFailed(false);
    }, [xFallbackUrl]);

    return <image {...props} href={avatar} onError={() => setFailed(true)} />;
}

export const CustomizedDot = memo(function CustomizedDot({
    cx,
    cy,
    payload,
    tradeRecords,
    activeTradeDate,
    activeTradeIndex,
    onAvatarHover,
    onAvatarLeave,
    onDotUpdate,
    onDotClick,
}: CustomizedDotProps): ReactElement<SVGElement> {
    const activeDate = useMemo(() => {
        if (isNumber(activeTradeIndex) && tradeRecords) {
            return tradeRecords[activeTradeIndex]?.date;
        }
        return activeTradeDate;
    }, [activeTradeDate, activeTradeIndex, tradeRecords]);
    const matchedRecords = useMemo(
        () => tradeRecords?.filter((x) => x.date === payload.date) || EMPTY_LIST,
        [tradeRecords, payload.date],
    );

    const hasActiveDate = !!activeDate && matchedRecords.some((x) => x.date === activeDate);
    const record =
        isNumber(activeTradeIndex) && tradeRecords
            ? tradeRecords[activeTradeIndex]
            : matchedRecords.find((x) => x.date === activeDate);

    useEffect(() => {
        if (!hasActiveDate || !onDotUpdate || !record) return;
        onDotUpdate(cx, cy, record);
    }, [cx, cy, hasActiveDate, onDotUpdate, record]);

    if (matchedRecords.length) {
        const baseRadius = 10;
        const baseSize = 2 * baseRadius;
        return (
            <g>
                <svg width={baseSize} height={baseSize} viewBox={`0 0 ${baseSize} ${baseSize}`}>
                    <defs>
                        {matchedRecords.map((record, i) => {
                            return (
                                <pattern
                                    key={`${record.date}/${i}`}
                                    id={`avatar-${record.date}/${i}`}
                                    patternUnits="objectBoundingBox"
                                    height={baseSize}
                                    width={baseSize}
                                >
                                    <UserAvatar
                                        x="0"
                                        y="0"
                                        width={baseSize}
                                        height={baseSize}
                                        href={record.user.avatar}
                                    />
                                </pattern>
                            );
                        })}
                    </defs>
                </svg>
                {matchedRecords.map((record, i) => {
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
                            onClick={() => {
                                onDotClick?.(tradeRecords!.indexOf(record));
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
                                fill={`url(#avatar-${record.date}/${i})`}
                            />
                        </g>
                    );
                })}
            </g>
        );
    }

    return null as unknown as ReactElement<SVGElement>;
});
