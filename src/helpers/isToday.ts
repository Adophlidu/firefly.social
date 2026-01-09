import dayjs, { type ConfigType } from 'dayjs';

export function isToday(value: ConfigType) {
    const today = dayjs();
    return dayjs(value).isSame(today, 'day');
}
