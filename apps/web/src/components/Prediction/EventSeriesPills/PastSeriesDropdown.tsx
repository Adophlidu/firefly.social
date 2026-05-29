'use client';

import ArrowDownIcon from '@dimensiondev/assets/arrow-down.svg';
import ArrowLineDown from '@dimensiondev/assets/arrow-line-down.svg';
import { classNames } from '@dimensiondev/utils';
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Fragment, memo } from 'react';

import { Link } from '@/esm/Link.js';
import {
    formatPastDropdownTime,
    splitAmPmTime,
} from '@/helpers/prediction/polymarket/eventSeriesPills/formatSeriesPillTime.js';
import { resolvePastEventOutcome } from '@/helpers/prediction/polymarket/eventSeriesPills/toSeriesEventForPills.js';
import type { PastOutcome, SeriesEventForPills } from '@/helpers/prediction/polymarket/eventSeriesPills/types.js';
import { resolvePredictionEventUrl } from '@/helpers/resolvePredictionEventUrl.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

interface PastSeriesDropdownProps {
    eventSlug: string;
    pastEvents: BetsEventDataForUI[];
    pastLogic: SeriesEventForPills[];
    outcomesBySlug: Map<string, PastOutcome>;
}

export const PastSeriesDropdown = memo<PastSeriesDropdownProps>(function PastSeriesDropdown({
    eventSlug,
    pastEvents,
    pastLogic,
    outcomesBySlug,
}) {
    if (!pastEvents.length) return null;

    const previewEvents = pastEvents.slice(0, 3);

    return (
        <Popover as="div" className="relative">
            {({ close }) => (
                <>
                    <PopoverButton className="flex h-[30px] items-center gap-2 rounded-full border border-secondaryLine px-2.5 focus:outline-none">
                        <span className="shrink-0 whitespace-nowrap text-[10px] font-bold">
                            <Trans>Past</Trans>
                        </span>
                        {previewEvents.map((event) => {
                            const outcome = resolvePastEventOutcome(event, outcomesBySlug);
                            return outcome ? (
                                <PastOutcomeIcon key={event.id} outcome={outcome} className="size-[15px]" />
                            ) : null;
                        })}
                        <ArrowLineDown className="size-[7px] shrink-0" />
                    </PopoverButton>
                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0 translate-y-1"
                    >
                        <PopoverPanel
                            portal={false}
                            anchor="bottom start"
                            style={{ height: 36 * pastEvents.length + 32 }}
                            className="no-scrollbar absolute bottom-full right-0 z-30 w-[240px] !max-w-[80vw] rounded-lg bg-lightBottom py-4 text-medium shadow-popover [--anchor-max-height:214px] dark:border dark:border-line dark:bg-darkBottom dark:shadow-none"
                        >
                            <div>
                                {pastEvents.map((event) => {
                                    const logic = pastLogic.find((e) => e.slug === event.slug);
                                    const { timeText, dateText } = logic
                                        ? formatPastDropdownTime(logic, t`Today`, t`Tomorrow`)
                                        : { timeText: event.slug ?? event.id, dateText: null };
                                    const { main, period, suffix } = splitAmPmTime(timeText);
                                    const outcome = resolvePastEventOutcome(event, outcomesBySlug);

                                    return (
                                        <Link
                                            key={event.id}
                                            className={classNames(
                                                'flex h-9 items-center gap-1.5 px-3 text-xs font-medium hover:bg-lightBg',
                                                event.slug === eventSlug ? 'pointer-events-none opacity-50' : '',
                                            )}
                                            href={resolvePredictionEventUrl(event)}
                                            onClick={() => close()}
                                        >
                                            {outcome ? (
                                                <PastOutcomeIcon outcome={outcome} className="size-[14px] text-[8px]" />
                                            ) : null}
                                            {dateText ? (
                                                <span className="flex items-center gap-1 whitespace-nowrap">
                                                    <span>
                                                        {main}
                                                        {period ? <span className="text-[10px]"> {period}</span> : null}
                                                        {suffix}
                                                    </span>
                                                    <span className="text-second">· {dateText}</span>
                                                </span>
                                            ) : (
                                                <span className="whitespace-nowrap">
                                                    {main}
                                                    {period ? <span className="text-[10px]"> {period}</span> : null}
                                                    {suffix}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </PopoverPanel>
                    </Transition>
                </>
            )}
        </Popover>
    );
});

function PastOutcomeIcon({ outcome, className }: { outcome: PastOutcome; className?: string }) {
    const isUp = outcome === 'up';

    return (
        <span
            className={classNames(
                'flex shrink-0 items-center justify-center rounded-full text-white',
                isUp ? 'bg-success' : 'bg-danger',
                className,
            )}
        >
            <ArrowDownIcon width={15} height={15} className={classNames(isUp ? 'rotate-180' : '')} />
        </span>
    );
}
