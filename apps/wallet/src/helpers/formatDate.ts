import type { Dayjs } from 'dayjs';

import { Locale } from '@/constants/enum.js';
import { getDayjsLocaleName } from '@/helpers/dayjsLocale.js';
import { getLocalFromClientCookies } from '@/helpers/getCookies.js';

type DateFormatType = 'date' | 'datetime' | 'shortDate';

const EN_FORMATS: Record<DateFormatType, string> = {
    date: 'MMM DD, YYYY',
    datetime: 'MMM DD, YYYY [at] hh:mm A',
    shortDate: 'MMM D, YYYY',
};

const LOCALIZED_FORMATS: Record<DateFormatType, string> = {
    date: 'LL',
    datetime: 'LLL',
    shortDate: 'LL',
};

export function formatDate(
    date: Dayjs,
    type: DateFormatType = 'date',
    locale: Locale = getLocalFromClientCookies(),
): string {
    const localizedDate = date.locale(getDayjsLocaleName(locale));
    return localizedDate.format(locale === Locale.en ? EN_FORMATS[type] : LOCALIZED_FORMATS[type]);
}
