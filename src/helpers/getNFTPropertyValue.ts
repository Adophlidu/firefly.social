import { isMilliseconds, isUnix } from '@dimensiondev/utils';
import dayjs from 'dayjs';

import { formatDate } from '@/helpers/formatTimestamp.js';
import { type NonFungibleTokenTrait } from '@/web3-shared/base/specs.js';

function getNFTPropertyDateString(dateString: string) {
    if (isUnix(dateString)) return formatDate(dayjs.unix(Number.parseInt(dateString, 10)).toDate());
    if (isMilliseconds(dateString)) return formatDate(dayjs(Number.parseInt(dateString, 10)).toDate());
    return formatDate(dayjs(dateString).toDate());
}

export function getNFTPropertyValue(displayType: NonFungibleTokenTrait['displayType'], value: string) {
    if (displayType === 'date') return getNFTPropertyDateString(value);
    return value;
}
