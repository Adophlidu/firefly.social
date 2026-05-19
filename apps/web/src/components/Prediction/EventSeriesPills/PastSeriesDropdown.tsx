'use client';

import ArrowDownIcon from '@dimensiondev/assets/arrow-down.svg';
import ArrowLineDown from '@dimensiondev/assets/arrow-line-down.svg';
import { classNames } from '@dimensiondev/utils';
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Fragment, memo } from 'react';

import { PastResultsPreview } from '@/components/Prediction/EventSeriesPills/PastResultsPreview.js';
import { EventResult } from '@/components/Prediction/PredictionSeries/EventResult.js';
import { Link } from '@/esm/Link.js';
import {
    formatPastDropdownTime,
    splitAmPmTime,
} from '@/helpers/prediction/polymarket/eventSeriesPills/formatSeriesPillTime.js';
import { resolveOutcomeFromUiEvent } from '@/helpers/prediction/polymarket/eventSeriesPills/toSeriesEventForPills.js';
import type {
    PastOutcome,
    PastResultRow,
    SeriesEventForPills,
} from '@/helpers/prediction/polymarket/eventSeriesPills/types.js';
import { resolvePredictionEventUrl } from '@/helpers/resolvePredictionEventUrl.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

interface PastSeriesDropdownProps {
    eventSlug: string;
    pastEvents: BetsEventDataForUI[];
    pastLogic: SeriesEventForPills[];
    outcomesBySlug: Map<string, PastOutcome>;
    pastResults: PastResultRow[];
    isDailyUpOrDown: boolean;
    uiBySlug: Map<string, BetsEventDataForUI>;
}

export const PastSeriesDropdown = memo<PastSeriesDropdownProps>(function PastSeriesDropdown({
    eventSlug,
    pastEvents,
    pastLogic,
    outcomesBySlug,
    pastResults,
    isDailyUpOrDown,
    uiBySlug,
}) {
    if (!pastEvents.length) return null;

    const previewResolved = pastEvents.slice(0, 3).some((e) => e.markets.some((m) => !!m.resolvedOutcomeId));

    return (
        <Popover as="div" className="relative">
            {({ close }) => (
                <>
                    <PopoverButton className="border-secondaryLine flex h-[30px] items-center gap-2 rounded-full border px-2.5 focus:outline-none">
                        <span className="shrink-0 whitespace-nowrap text-[10px] font-bold">
                            <Trans>Past</Trans>
                        </span>
                        {previewResolved
                            ? pastEvents.slice(0, 3).map((event) => <EventResult key={event.id} event={event} />)
                            : null}
                        <PastResultsPreview
                            currentSlug={eventSlug}
                            pastEvents={pastLogic}
                            results={pastResults}
                            outcomesBySlug={outcomesBySlug}
                            isDailyUpOrDown={isDailyUpOrDown}
                            uiBySlug={uiBySlug}
                        />
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
                            anchor="top start"
                            style={{ height: 36 * pastEvents.length + 32 }}
                            className="no-scrollbar bg-lightBottom text-medium shadow-popover dark:border-line dark:bg-darkBottom absolute bottom-full right-0 z-30 w-[240px] !max-w-[80vw] -translate-y-3 rounded-lg py-4 [--anchor-max-height:214px] dark:border dark:shadow-none"
                        >
                            <div>
                                {pastEvents.map((event) => {
                                    const logic = pastLogic.find((e) => e.slug === event.slug);
                                    const { timeText, dateText } = logic
                                        ? formatPastDropdownTime(logic, t`Today`, t`Tomorrow`)
                                        : { timeText: event.slug ?? event.id, dateText: null };
                                    const { main, period, suffix } = splitAmPmTime(timeText);
                                    const apiOutcome = outcomesBySlug.get(event.slug ?? '');
                                    const fallbackOutcome = resolveOutcomeFromUiEvent(event);
                                    const showOutcome = apiOutcome || fallbackOutcome;
                                    const isUp = (apiOutcome ?? fallbackOutcome) === 'up';

                                    return (
                                        <Link
                                            key={event.id}
                                            className={classNames(
                                                'hover:bg-lightBg flex h-9 items-center gap-1.5 px-3 text-xs font-medium',
                                                event.slug === eventSlug ? 'pointer-events-none opacity-50' : '',
                                            )}
                                            href={resolvePredictionEventUrl(event)}
                                            onClick={() => close()}
                                        >
                                            {showOutcome ? (
                                                <span
                                                    className={classNames(
                                                        'flex size-[14px] shrink-0 items-center justify-center rounded-full text-[8px] text-white',
                                                        isUp ? 'bg-success' : 'bg-danger',
                                                    )}
                                                >
                                                    <ArrowDownIcon
                                                        width={15}
                                                        height={15}
                                                        className={classNames(isUp ? 'rotate-180' : '')}
                                                    />
                                                </span>
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
