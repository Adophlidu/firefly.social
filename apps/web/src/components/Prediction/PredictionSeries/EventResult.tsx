import ArrowDownIcon from '@dimensiondev/assets/arrow-down.svg';
import { classNames } from '@dimensiondev/utils';
import { first } from 'lodash-es';

import type { BetsEventDataForUI } from '@/types/prediction.js';

interface EventResultProps {
    event: BetsEventDataForUI;
    className?: string;
}

export function EventResult({ event, className }: EventResultProps) {
    const market = first(event.markets);
    const outcome = market?.resolvedOutcomeId
        ? market.outcomes.find((o) => o.id === market.resolvedOutcomeId)?.label
        : undefined;
    const isUp = ['up'].includes(outcome?.toLowerCase() || '');

    if (!outcome) return null;

    return (
        <div
            className={classNames(
                'flex size-[15px] items-center justify-center rounded-full text-white',
                isUp ? 'bg-success' : 'bg-danger',
                className,
            )}
        >
            <ArrowDownIcon width={15} height={15} className={classNames(isUp ? 'rotate-180' : '')} />
        </div>
    );
}
