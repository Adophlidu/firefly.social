import dayjs from 'dayjs';
import zhCn from 'dayjs/locale/zh-cn';
import zhTw from 'dayjs/locale/zh-tw';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';

import { Locale } from '@/constants/enum.js';

export const localeToDayjsLocale: Record<Locale, string> = {
    [Locale.en]: 'en',
    [Locale.zhHans]: 'zh-cn',
    [Locale.zhHant]: 'zh-tw',
};

dayjs.extend(localizedFormat);
dayjs.locale(zhCn, undefined, true);
dayjs.locale(zhTw, undefined, true);

export function getDayjsLocaleName(locale: Locale): string {
    return localeToDayjsLocale[locale] ?? localeToDayjsLocale[Locale.en];
}
