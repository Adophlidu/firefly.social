import { Locale } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';

import type { PredictionPlatform } from '@/constants/enum.js';
import { translatePolymarketEventData } from '@/providers/firefly/prediction/translatePolymarketEventData.js';
import type { PolymarketEventLocale } from '@/providers/prediction/polymarket/type.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

interface Options {
    platform: PredictionPlatform;
    event: BetsEventDataForUI;
    locale: Locale;
}

function transferPolymarketLocale(locale: Locale): PolymarketEventLocale | null {
    switch (locale) {
        case Locale.en:
            return null;
        case Locale.zhHans:
            return 'zh';
        case Locale.zhHant:
            return 'zh-Hant';
        default:
            safeUnreachable(locale);
            return null;
    }
}

export async function translateBetEventData({ platform, event, locale }: Options): Promise<BetsEventDataForUI> {
    if (!event.title && !event.description) return event;

    const polymarketLocale = transferPolymarketLocale(locale);
    if (!polymarketLocale) return event;

    const result = await translatePolymarketEventData({
        event_id: `${platform}:${event.id}`,
        language: polymarketLocale,
        title: event.title,
        description: event.description,
    });

    return {
        ...event,
        title: result.title || event.title,
        description: result.description || event.description,
    };
}
