import dayjs from 'dayjs';

import { formatDate } from '@/helpers/formatTimestamp.js';
import { isMilliseconds, isUnix } from '@/helpers/ts.js';

export function getNFTPropertyDateString(dateString: string) {
    if (isUnix(dateString)) {
        return formatDate(dayjs.unix(Number.parseInt(dateString, 10)).toDate());
    } else if (isMilliseconds(dateString)) {
        return formatDate(dayjs(Number.parseInt(dateString, 10)).toDate());
    }
    return formatDate(dayjs(dateString).toDate());
}
