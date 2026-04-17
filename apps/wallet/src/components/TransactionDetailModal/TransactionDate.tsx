import dayjs from 'dayjs';

import { formatDate } from '@/helpers/formatDate.js';
import { useLocale } from '@/helpers/getCookies.js';

interface TransactionDateProps {
    time: string | number | Date;
}

export function TransactionDate({ time }: TransactionDateProps) {
    const locale = useLocale();
    return formatDate(dayjs(time), 'datetime', locale);
}
