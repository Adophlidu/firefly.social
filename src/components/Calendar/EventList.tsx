import { Trans } from '@lingui/react/macro';
import { format } from 'date-fns';
import { useRef } from 'react';
import { useUpdateEffect } from 'react-use';

import CalendarIcon from '@/assets/calendar.svg';
import LocationIcon from '@/assets/location.svg';
import { EventSkeleton } from '@/components/Calendar/CalendarCardSkeleton.js';
import { EmptyStatus } from '@/components/Calendar/EmptyStatus.js';
import { useLumaEvents } from '@/components/Calendar/hooks/useLumaEvents.js';
import { ImageLoader } from '@/components/Calendar/ImageLoader.js';
import { ElementAnchor } from '@/components/ElementAnchor.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { Loading } from '@/components/Loading.js';
import { EMPTY_LIST } from '@/constants/index.js';

interface EventListProps {
    date: Date;
}

export function EventList({ date }: EventListProps) {
    const listRef = useRef<HTMLDivElement>(null);
    const { isLoading, isFetching, data = EMPTY_LIST, hasNextPage, fetchNextPage } = useLumaEvents(date);

    useUpdateEffect(() => {
        listRef.current?.scrollTo({
            top: 0,
        });
    }, [JSON.stringify(data)]);

    if (isLoading) {
        return (
            <div className="no-scrollbar relative h-[506px] w-full overflow-y-scroll">
                <div className="flex flex-col gap-10 pt-10">
                    {Array.from({ length: 4 }).map((_, index) => {
                        return <EventSkeleton key={index} />;
                    })}
                </div>
            </div>
        );
    }

    if (!data.length) {
        return (
            <div className="no-scrollbar relative h-[506px] w-full overflow-y-scroll">
                <EmptyStatus>
                    <Trans>No content for the last two weeks.</Trans>
                </EmptyStatus>
            </div>
        );
    }

    return (
        <div
            className="no-scrollbar relative flex h-[506px] w-full flex-col gap-2.5 overflow-y-scroll overscroll-contain"
            ref={listRef}
        >
            <div className="pt-3">
                {data.map((event) => {
                    return (
                        <Link
                            key={event.event_id}
                            className="flex cursor-pointer flex-col gap-2 border-b border-line p-2 text-main outline-none last:border-none hover:no-underline"
                            href={event.event_url}
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            {event.host_name && event.host_avatar ? (
                                <div className="flex w-full justify-between">
                                    <div className="flex items-center gap-2">
                                        <Image
                                            src={event.host_avatar}
                                            className="overflow-hidden rounded-full"
                                            width={24}
                                            height={24}
                                            alt={event.host_name}
                                        />
                                        <p className="text-xs font-bold leading-4">{event.host_name}</p>
                                    </div>
                                </div>
                            ) : null}
                            <p className="text-sm">{event.event_description || event.event_title}</p>
                            <p className="flex items-center gap-3 text-[13px] leading-[18px] text-main">
                                <LocationIcon width={18} height={18} className="shrink-0" />
                                {event.event_full_location}
                            </p>
                            <p className="flex items-center gap-3 text-[13px] leading-[18px] text-main">
                                <CalendarIcon className="shrink-0" width={18} height={18} />
                                {format(event.event_date, 'MMM dd, yyyy HH:mm')}
                            </p>
                            <ImageLoader src={event.poster_url} />
                        </Link>
                    );
                })}
                {hasNextPage ? (
                    <ElementAnchor className="h-8" callback={() => fetchNextPage()}>
                        {isFetching ? <Loading className="text-main" /> : null}
                    </ElementAnchor>
                ) : (
                    <p className="py-2 text-center text-xs text-second">
                        <Trans>No more data available.</Trans>
                    </p>
                )}
            </div>
        </div>
    );
}
