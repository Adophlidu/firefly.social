import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { type CSSProperties, memo, type ReactNode } from 'react';

import { BetsActivityRate } from '@/components/Bets/BetsActivityRate.js';
import { BetsActivityResult } from '@/components/Bets/BetsActivityResult.js';
import { BetsActivityTxType } from '@/components/Bets/BetsActivityTxType.js';
import { Image } from '@/components/Image.js';
import { BetsPlatform } from '@/constants/enum.js';
import { toFixedTrimmed } from '@/helpers/polymarket.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import type { BetsActivity } from '@/providers/types/Firefly.js';

function floor(num: number | string) {
    return Number.isNaN(+num) ? 0 : Math.floor(+num);
}

interface BetsActivityBodyProps {
    activity: BetsActivity;
    className?: string;
    style?: CSSProperties;
    wrapper?: (children: ReactNode) => ReactNode;
}

export const BetsActivityBody = memo<BetsActivityBodyProps>(function BetsActivityBody({
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
    const displayTitle =
        activity.platform === BetsPlatform.Opinion
            ? compact([activity.parent_title, activity.title]).join(' - ')
            : activity.title;

    const content = (
        <>
            <BetsActivityTxType type={activity.side} usdcSize={activity.usdcSize} platform={activity.platform} />
            <div className="mt-1.5 rounded-2xl border border-line p-4">
                <div className="flex gap-x-2">
                    <Image
                        alt={activity.title}
                        width={24}
                        height={24}
                        className="size-6 shrink-0 rounded-lg"
                        src={activity.image}
                    />
                    <span className="line-clamp-2 text-sm font-semibold leading-6 text-lightMain">{displayTitle}</span>
                </div>
                <div className="mt-3 flex items-center gap-x-1 text-sm font-medium">
                    <span
                        className={classNames('rounded-lg px-2 leading-6', {
                            'bg-success/20 text-success': isLeft,
                            'bg-danger/20 text-danger': !isLeft,
                        })}
                    >
                        {outcome} - {floor(+activity.price * 100)}¢
                    </span>
                    <span className="h-6 rounded-lg bg-lightBg px-2 leading-6 text-lightMain">
                        <Trans>×{toFixedTrimmed(+activity.size, 2)} shares</Trans>
                    </span>
                </div>
                {activity.umaResolutionStatus === 'resolved' ? (
                    <BetsActivityResult activity={activity} />
                ) : (
                    <BetsActivityRate activity={activity} />
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
