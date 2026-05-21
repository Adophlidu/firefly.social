import { Locale } from '@dimensiondev/enums';

export function appLocaleToBrowserLocale(appLocale: Locale) {
    switch (appLocale) {
        case Locale.en:
            return 'en-US';
        case Locale.es:
            return 'es';
        case Locale.ja:
            return 'ja';
        case Locale.ko:
            return 'ko';
        case Locale.zhHant:
            return 'zh-Hant';
        case Locale.zhHans:
            return 'zh-Hans';
        default:
            return 'en-US';
    }
}
