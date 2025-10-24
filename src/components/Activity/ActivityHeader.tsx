import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

import CalendarIcon from '@/assets/activity-calendar.svg';
import { ActivityStatusTag } from '@/components/Activity/ActivityStatus.js';
import { Image } from '@/components/Image.js';
import { classNames } from '@/helpers/classNames.js';
import type { ActivityInfoResponse } from '@/providers/types/Firefly.js';

function parseDescription(description: string) {
    return description.split('\\n').map((line, index, array) => (
        <span key={index}>
            {line}
            {index < array.length - 1 && <br />}
        </span>
    ));
}

export function ActivityHeader({
    data,
}: {
    data: Pick<
        Required<ActivityInfoResponse>['data'],
        'title' | 'sub_title' | 'start_time' | 'end_time' | 'status' | 'banner_url' | 'cover_url' | 'description'
    >;
}) {
    dayjs.extend(utc);
    const timeTemplate = 'MMM DD, HH:mm';
    return (
        <div className="flex w-full flex-col">
            <Image
                src={data.cover_url || data.banner_url}
                alt={data.title}
                className={classNames('w-full object-cover')}
                width={343}
                height={140}
            />
            <div className="w-full overflow-hidden pb-2 pl-6 pt-4">
                <div className="flex h-6 items-center space-x-1.5 whitespace-nowrap text-[13px] leading-6">
                    <CalendarIcon className="size-4 shrink-0" />
                    <span>
                        {dayjs(data.start_time).utc().format(timeTemplate)} -{' '}
                        {dayjs(data.end_time).utc().format(timeTemplate)} (UTC)
                    </span>
                    <ActivityStatusTag status={data.status} />
                </div>
            </div>
            <div className="w-full px-6 pb-4">
                <div className="w-full space-y-2 border-b border-line pb-4">
                    <h1 className="text-xl font-semibold leading-6">{data.title}</h1>
                    <p className="text-sm leading-6">{parseDescription(data.description)}</p>
                </div>
            </div>
        </div>
    );
}
