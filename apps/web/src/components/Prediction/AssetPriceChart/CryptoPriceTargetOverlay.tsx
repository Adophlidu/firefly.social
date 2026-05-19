import { Trans } from '@lingui/react/macro';

import { resolveTargetLineLayout } from '@/providers/prediction/resolveTargetLineLayout.js';
import type { TargetLineClamp } from '@/providers/prediction/resolveTargetLinePosition.js';

const TARGET_BADGE_HEIGHT = 14;
const TARGET_CHEVRON_WIDTH = 6;
const TARGET_CHEVRON_HEIGHT = 5.5;
const TARGET_LABEL_WIDTH = 28;
const TARGET_LABEL_CHEVRON_GAP = 4;

function TargetDirectionChevrons({
    direction,
    centerX,
    centerY,
}: {
    direction: Exclude<TargetLineClamp, 'none'>;
    centerX: number;
    centerY: number;
}) {
    const isAbove = direction === 'above';
    const x = centerX - TARGET_CHEVRON_WIDTH / 2;
    const y = centerY - TARGET_CHEVRON_HEIGHT / 2;
    const path1 = isAbove ? 'M0 2.5 L3 0 L6 2.5' : 'M0 0 L3 2.5 L6 0';
    const path2 = isAbove ? 'M0 5.5 L3 3 L6 5.5' : 'M0 3 L3 5.5 L6 3';
    const animValues = isAbove ? '0,0; 0,-1.5; 0,0' : '0,0; 0,1.5; 0,0';

    return (
        <g transform={`translate(${x}, ${y})`}>
            <g>
                <path
                    d={path1}
                    fill="none"
                    stroke="white"
                    strokeWidth={1.1}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d={path2}
                    fill="none"
                    stroke="white"
                    strokeWidth={1.1}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <animateTransform
                    attributeName="transform"
                    type="translate"
                    values={animValues}
                    dur="1.1s"
                    repeatCount="indefinite"
                />
            </g>
        </g>
    );
}

export interface CryptoPriceTargetOverlayProps {
    priceToBeat: number;
    ticks: number[];
    yScale: (value: number) => number;
    left: number;
    plotRight: number;
    chartRight: number;
    plotTop: number;
    plotHeight: number;
    range: { min: number; max: number };
}

export function CryptoPriceTargetOverlay({
    priceToBeat,
    ticks,
    yScale,
    left,
    plotRight,
    chartRight,
    plotTop,
    plotHeight,
    range,
}: CryptoPriceTargetOverlayProps) {
    const { y: targetY, clamp: targetClamp } = resolveTargetLineLayout({
        priceToBeat,
        ticks,
        yScale,
        plotTop,
        plotHeight,
        range,
    });
    const badgeWidth = targetClamp === 'none' ? 46 : 58;
    const badgeCenterX = chartRight - badgeWidth / 2;
    const clampedTextX = badgeCenterX - (TARGET_CHEVRON_WIDTH + TARGET_LABEL_CHEVRON_GAP) / 2;
    const clampedChevronCenterX = badgeCenterX + (TARGET_LABEL_WIDTH + TARGET_LABEL_CHEVRON_GAP) / 2;

    return (
        <g>
            <line
                x1={left}
                y1={targetY}
                x2={chartRight}
                y2={targetY}
                stroke="currentColor"
                strokeWidth={1}
                strokeDasharray="3 3"
                className="text-second"
            />
            <rect
                x={chartRight - badgeWidth}
                y={targetY - TARGET_BADGE_HEIGHT / 2}
                width={badgeWidth}
                height={TARGET_BADGE_HEIGHT}
                rx={TARGET_BADGE_HEIGHT / 2}
                fill="currentColor"
                className="text-second"
            />
            <text
                x={targetClamp === 'none' ? badgeCenterX : clampedTextX}
                y={targetY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={9}
                fontWeight="bold"
                fontFamily="Inter, sans-serif"
            >
                <Trans>Target</Trans>
            </text>
            {targetClamp !== 'none' ? (
                <TargetDirectionChevrons direction={targetClamp} centerX={clampedChevronCenterX} centerY={targetY} />
            ) : null}
        </g>
    );
}
