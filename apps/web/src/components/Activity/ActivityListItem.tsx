'use client';

import CalendarIcon from '@dimensiondev/assets/activity-calendar.svg';
import { ActivityStatus } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useState } from 'react';

import { ActivityEndedDialog } from '@/components/Activity/ActivityEndedDialog.js';
import { ActivityStatusTag } from '@/components/Activity/ActivityStatus.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { formatEventTimestamp } from '@/helpers/formatTimestamp.js';
import type { ActivityListItem as TypeActivityListItem } from '@/providers/types/Firefly.js';

// The FIFA Prediction Festival has ended, but its detail page (`/event/fifa`)
// is intentionally kept accessible, so we skip the "Event Ended" gate for it.
const ALWAYS_ACCESSIBLE_ACTIVITY_NAMES = new Set(['fifa']);

export function getActivityListItem(index: number, data: TypeActivityListItem) {
    return <ActivityListItem data={data} index={index} />;
}

function ActivityListItem({ data }: { data: TypeActivityListItem; index?: number }) {
    const [openActivityEndedDialog, setOpenActivityEndedDialog] = useState(false);
    const blockNavigation = data.status === ActivityStatus.Ended && !ALWAYS_ACCESSIBLE_ACTIVITY_NAMES.has(data.name);
    return (
        <>
            {blockNavigation ? (
                <ActivityEndedDialog
                    data={data}
                    open={openActivityEndedDialog}
                    onClose={() => setOpenActivityEndedDialog(false)}
                    buttonText={<Trans>OK</Trans>}
                />
            ) : null}
            <Link
                href={data.url || `/event/${data.name}`}
                data-disable-progress={blockNavigation}
                className="relative mb-4 flex w-full flex-col rounded-2xl border border-line bg-bg"
                onClick={(e) => {
                    if (blockNavigation) {
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
                            {formatEventTimestamp(data.start_time)} - {formatEventTimestamp(data.end_time)} (UTC)
                        </span>
                    </div>
                </div>
            </Link>
        </>
    );
}
