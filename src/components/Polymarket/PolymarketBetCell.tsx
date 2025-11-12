import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { type CSSProperties, memo, type ReactNode } from 'react';

import { ActivityCellPolymarketAction } from '@/components/ActivityCell/Polymarket/ActivityCellPolymarketAction.js';
import { Image } from '@/components/Image.js';
import { PolymarketActivityRate } from '@/components/Polymarket/PolymarketActivityRate.js';
import { PolymarketActivityResult } from '@/components/Polymarket/PolymarketActivityResult.js';
import { formatAmount } from '@/helpers/polymarket.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import type { PolymarketActivity } from '@/providers/types/Firefly.js';

function floor(num: number | string) {
    return Number.isNaN(+num) ? 0 : Math.floor(+num);
}

interface PolymarketBetCellProps {
    activity: PolymarketActivity;
    className?: string;
    style?: CSSProperties;
    wrapper?: (children: ReactNode) => ReactNode;
}

export const PolymarketBetCell = memo<PolymarketBetCellProps>(function PolymarketBetCell({
    activity,
    className,
    style,
    wrapper,
}) {
    const isDarkMode = useIsDarkMode();
    const isLeft = activity.outcomeIndex === 0;
    const outcome = activity.conditionOutcomes[activity.outcomeIndex] || activity.outcome;

    const containerStyle = {
        '--success-color': isDarkMode ? '#1F4B1A' : '#C1E7BD',
        '--danger-color': isDarkMode ? '#66120D' : '#FFD5D2',
        ...style,
    } as CSSProperties;

    const content = (
        <>
            <ActivityCellPolymarketAction type={activity.side} usdcSize={activity.usdcSize} />
            <div className="mt-1.5 rounded-xl border border-line bg-lightBg p-3">
                <div className="flex gap-x-2">
                    <Image
                        alt={activity.title}
                        width={24}
                        height={24}
                        className="size-6 shrink-0 rounded-lg"
                        src={activity.image}
                    />
                    <span className="line-clamp-2 text-sm font-semibold leading-6 text-lightMain">
                        {activity.title}
                    </span>
                </div>
                <div className="mt-2 flex items-center gap-x-1 text-sm font-medium">
                    <span
                        className={classNames('rounded-lg border px-2 leading-6', {
                            'border-success text-success': isLeft,
                            'border-danger text-danger': !isLeft,
                        })}
                    >
                        {outcome.toUpperCase()} - {floor(+activity.price * 100)}¢
                    </span>
                    <span className="h-6 rounded-lg bg-lightBottom px-2 leading-6 text-lightMain dark:bg-lightBg">
                        <Trans>×{formatAmount(activity.size)} shares</Trans>
                    </span>
                </div>
                {activity.umaResolutionStatus === 'resolved' ? (
                    <PolymarketActivityResult activity={activity} />
                ) : (
                    <PolymarketActivityRate activity={activity} />
                )}
            </div>
        </>
    );

    return (
        <div className={classNames('mt-1.5 block flex-1', className)} style={containerStyle}>
            {wrapper ? wrapper(content) : content}
        </div>
    );
});
