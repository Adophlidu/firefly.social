import { classNames } from '@dimensiondev/utils';
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import { Fragment, memo, type PropsWithChildren } from 'react';

import { EventResult } from '@/components/Prediction/PredictionSeries/EventResult.js';
import { EventTime } from '@/components/Prediction/PredictionSeries/EventTime.js';
import { Link } from '@/esm/Link.js';
import { resolvePredictionEventUrl } from '@/helpers/resolvePredictionEventUrl.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

interface EventsPopoverProps {
    events: BetsEventDataForUI[];
    eventSlug: string;
    showResult?: boolean;
}

export const EventsPopover = memo<PropsWithChildren<EventsPopoverProps>>(function EventsPopover({
    events,
    children,
    eventSlug,
    showResult = false,
}) {
    return (
        <Popover as="div" className="relative">
            {({ close }) => (
                <>
                    <PopoverButton className="border-secondaryLine h-[30px] rounded-full border px-2.5 focus:outline-none">
                        {children}
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
                            style={{ height: 36 * events.length + 32 }}
                            className="no-scrollbar bg-lightBottom text-medium shadow-popover dark:border-line dark:bg-darkBottom absolute bottom-full right-0 z-30 w-[200px] !max-w-[80vw] -translate-y-3 rounded-lg py-4 [--anchor-max-height:214px] dark:border dark:shadow-none"
                        >
                            <div>
                                {events.map((event) => {
                                    return (
                                        <Link
                                            className={classNames(
                                                'hover:bg-lightBg flex h-9 items-center px-3 text-xs font-medium',
                                                event.slug === eventSlug ? 'pointer-events-none opacity-50' : '',
                                            )}
                                            key={event.id}
                                            href={resolvePredictionEventUrl(event)}
                                            onClick={() => close()}
                                        >
                                            {showResult ? (
                                                <EventResult className="mr-1.5 shrink-0" event={event} />
                                            ) : null}
                                            <div className="min-w-0 flex-1">
                                                <EventTime event={event} />
                                            </div>
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
