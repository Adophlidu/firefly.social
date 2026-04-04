import { Locale } from '@/constants/enum.js';

export function appLocaleToBrowserLocale(appLocale: Locale) {
    switch (appLocale) {
        case Locale.en:
            return 'en-US';
        case Locale.zhHant:
            return 'zh-Hant';
        case Locale.zhHans:
            return 'zh-Hans';
        default:
            return 'en-US';
    }
}
