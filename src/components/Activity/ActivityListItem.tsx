'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import dayjs from 'dayjs';
import { useState } from 'react';

import CalendarIcon from '@/assets/activity-calendar.svg';
import { ActivityEndedDialog } from '@/components/Activity/ActivityEndedDialog.js';
import { ActivityStatusTag } from '@/components/Activity/ActivityStatus.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { type ActivityListItem as TypeActivityListItem, ActivityStatus } from '@/providers/types/Firefly.js';

export function getActivityListItem(index: number, data: TypeActivityListItem) {
    return <ActivityListItem data={data} index={index} />;
}

function ActivityListItem({ data }: { data: TypeActivityListItem; index?: number }) {
    const timeTemplate = 'MMM DD, HH:mm';
    const [openActivityEndedDialog, setOpenActivityEndedDialog] = useState(false);
    return (
        <>
            {data.status === ActivityStatus.Ended ? (
                <ActivityEndedDialog
                    data={data}
                    open={openActivityEndedDialog}
                    onClose={() => setOpenActivityEndedDialog(false)}
                    buttonText={<Trans>OK</Trans>}
                />
            ) : null}
            <Link
                href={`/event/${data.name}`}
                data-disable-progress={data.status === ActivityStatus.Ended}
                className="relative mb-4 flex w-full flex-col rounded-2xl border border-line bg-bg"
                onClick={(e) => {
                    if (data.status === ActivityStatus.Ended) {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenActivityEndedDialog(true);
                    }
                }}
            >
                <div className="absolute right-2 top-2 z-1">
                    <ActivityStatusTag status={data.status} />
                </div>
                <Image
                    src={data.cover_url || data.banner_url}
                    alt={data.title}
                    className={classNames('aspect-[343/140] w-full rounded-t-2xl object-cover', {
                        'opacity-80': data.status === ActivityStatus.Ended,
                    })}
                    width={343}
                    height={140}
                />
                <div className="w-full space-y-1 rounded-b-2xl p-2 text-lightMain">
                    <h4 className="truncate text-base font-semibold leading-6">{data.title}</h4>
                    {data.description ? (
                        <p className="line-clamp-2 text-sm leading-6">{data.description.replaceAll('\\n', ' ')}</p>
                    ) : null}
                    <div className="flex h-6 items-center space-x-1.5 text-[13px] leading-6">
                        <CalendarIcon className="size-4 shrink-0" />
                        <span>
                            {dayjs(data.start_time).utc().format(timeTemplate)} -{' '}
                            {dayjs(data.end_time).utc().format(timeTemplate)} (UTC)
                        </span>
                    </div>
                </div>
            </Link>
        </>
    );
}
