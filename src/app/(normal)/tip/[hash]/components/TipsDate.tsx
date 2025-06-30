'use client';

import dayjs from 'dayjs';

interface TipsDateProps {
    time: string | number | Date;
}

export function TipsDate({ time }: TipsDateProps) {
    return dayjs(time).format('MMM DD, YYYY [at] hh:mm A');
}
