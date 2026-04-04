'use client';

import dayjs from 'dayjs';

interface TransactionDateProps {
    time: string | number | Date;
}

export function TransactionDate({ time }: TransactionDateProps) {
    return dayjs(time).format('MMM DD, YYYY [at] hh:mm A');
}
