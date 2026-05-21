import { Locale } from '@dimensiondev/enums';
import dayjs from 'dayjs';
import es from 'dayjs/locale/es';
import ja from 'dayjs/locale/ja';
import ko from 'dayjs/locale/ko';
import zhCn from 'dayjs/locale/zh-cn';
import zhTw from 'dayjs/locale/zh-tw';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';

export const localeToDayjsLocale: Record<Locale, string> = {
    [Locale.en]: 'en',
    [Locale.es]: 'es',
    [Locale.ja]: 'ja',
    [Locale.ko]: 'ko',
    [Locale.zhHans]: 'zh-cn',
    [Locale.zhHant]: 'zh-tw',
};

dayjs.extend(localizedFormat);
dayjs.locale(es, undefined, true);
dayjs.locale(ja, undefined, true);
dayjs.locale(ko, undefined, true);
dayjs.locale(zhCn, undefined, true);
dayjs.locale(zhTw, undefined, true);

export function getDayjsLocaleName(locale: Locale): string {
    return localeToDayjsLocale[locale] ?? localeToDayjsLocale[Locale.en];
}
