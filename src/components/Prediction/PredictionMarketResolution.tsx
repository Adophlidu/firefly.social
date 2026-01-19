import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { Fragment } from 'react';

import { BetsMarketResolveStatus } from '@/constants/enum.js';
import type { BetsMarketDataForUI } from '@/types/prediction.js';

interface PredictionMarketResolutionProps {
    market: BetsMarketDataForUI;
}

function StatusLabel({ status, outcomeLabel }: { status: BetsMarketResolveStatus; outcomeLabel: string }) {
    switch (status) {
        case BetsMarketResolveStatus.Proposed:
            return <Trans>Outcome proposed: {outcomeLabel}</Trans>;
        case BetsMarketResolveStatus.Disputed:
            return <Trans>Disputed</Trans>;
        case BetsMarketResolveStatus.NoDisputed:
            return <Trans>No dispute</Trans>;
        case BetsMarketResolveStatus.Resolved:
            return <Trans>Final outcome: {outcomeLabel}</Trans>;
        default:
            safeUnreachable(status);
            return null;
    }
}

export function PredictionMarketResolution({ market }: PredictionMarketResolutionProps) {
    const statusList = market.statusList;
    if (!statusList?.length) return null;

    const outcomeLabel =
        market.outcomes.length === 2
            ? parseFloat(market.outcomes[0].price) >= parseFloat(market.outcomes[1].price)
                ? market.outcomes[0].label
                : market.outcomes[1].label
            : '';

    return (
        <div className="mt-6 flex flex-col items-center p-4">
            {statusList.map((status, i) => {
                const isOdd = i % 2 === 0;

                return (
                    <Fragment key={`${status}-${i}`}>
                        <div
                            className={classNames(
                                'flex h-12 min-w-0 max-w-full items-center justify-center truncate rounded-2xl border-2 border-dashed px-4 text-sm font-semibold',
                                isOdd
                                    ? 'border-[#8E96FF] bg-[rgba(142,150,255,0.10)] text-[#5E69FF]'
                                    : 'border-[#FFB100] bg-[rgba(255,177,0,0.10)] text-[#FFAA16]',
                            )}
                        >
                            <StatusLabel status={status} outcomeLabel={outcomeLabel || '-'} />
                        </div>
                        {i < statusList.length - 1 ? <div className="h-10 w-0.5 bg-[#8E96FF]" /> : null}
                    </Fragment>
                );
            })}
        </div>
    );
}
