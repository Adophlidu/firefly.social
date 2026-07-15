import { Locale } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';

export function resolvePolymarketLocale(locale?: Locale) {
    if (!locale) return;

    switch (locale) {
        case Locale.zhHans:
            return 'zh';
        case Locale.zhHant:
            return 'zh-Hant';
        case Locale.en:
            return;
        case Locale.es:
            return 'es';
        case Locale.ja:
            return 'ja';
        case Locale.ko:
            return 'ko';
        default:
            safeUnreachable(locale);
            return;
    }
}
