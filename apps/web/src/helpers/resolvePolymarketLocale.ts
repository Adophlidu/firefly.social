import { Locale } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';

import { PolymarketLocale } from '@/constants/bets.js';

export function resolvePolymarketLocale(locale: string): PolymarketLocale | undefined {
    switch (locale) {
        case Locale.zhHans:
            return PolymarketLocale.zhHans;
        case Locale.zhHant:
            return PolymarketLocale.zhHant;
        case Locale.es:
            return PolymarketLocale.es;
        case Locale.ja:
            return PolymarketLocale.ja;
        case Locale.en:
        case Locale.ko:
            return;
        default:
            safeUnreachable(locale as never);
            return;
    }
}
