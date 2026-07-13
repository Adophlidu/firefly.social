import {
    ALLOWED_PREFIXES,
    DAILY_UP_OR_DOWN_EXTRA_PREFIXES,
    HOURLY_UP_OR_DOWN_PREFIXES,
} from '@/helpers/prediction/polymarket/eventSeriesPills/allowedPrefixes.js';
import type { SeriesSettings } from '@/helpers/prediction/polymarket/eventSeriesPills/types.js';

/** Polymarket `getSeriesSettings` / `ev()` (module 162923). */
export function getSeriesSettings(slug = ''): SeriesSettings {
    const hourlyEtSuffix =
        HOURLY_UP_OR_DOWN_PREFIXES.some((prefix) => slug.startsWith(prefix)) && /-[0-9]+(am|pm)-et$/.test(slug);
    const commodityDaily = /^(wti|cc|ng|ngd)([fghjkmnquvxz]\d)?-up-or-down-on-/.test(slug);
    const dailyUpOrDown =
        (DAILY_UP_OR_DOWN_EXTRA_PREFIXES.some((prefix) => slug.startsWith(prefix)) || commodityDaily) &&
        slug.includes('-up-or-down-on-') &&
        !hourlyEtSuffix;
    const priceFivePm =
        (slug.startsWith('ethereum-price') || slug.startsWith('bitcoin-price')) && /-price-.*-5pm-et/.test(slug);
    const has15m = HOURLY_UP_OR_DOWN_PREFIXES.some((prefix) => slug.startsWith(prefix)) && slug.includes('-15m');
    const has5m = HOURLY_UP_OR_DOWN_PREFIXES.some((prefix) => slug.startsWith(prefix)) && slug.includes('-5m');
    const has4h = HOURLY_UP_OR_DOWN_PREFIXES.some((prefix) => slug.startsWith(prefix)) && slug.includes('-4h');
    const hourlyAmPm = /-[0-9]+(am|pm)(-et)?$/i.test(slug);
    const multistrike4h = slug.includes('-multistrike-4h');
    const shouldShowDetailedTime = ALLOWED_PREFIXES.some((prefix) => slug.startsWith(prefix)) || commodityDaily;

    return {
        timezone: 'America/New_York',
        shouldShowDetailedTime,
        useHourlyFiltering: (hourlyAmPm || multistrike4h || has4h || has15m || has5m) && shouldShowDetailedTime,
        shouldShowLockedPrice:
            hourlyEtSuffix || dailyUpOrDown || priceFivePm || multistrike4h || has15m || has5m || has4h,
        decimalPlaces:
            slug.includes('doge') || slug.includes('dogecoin')
                ? 6
                : slug.includes('xrp') ||
                    slug.includes('hype') ||
                    slug.includes('bnb') ||
                    /^(eurusd|gbpusd|usdcad)/.test(slug)
                  ? 4
                  : 2,
    };
}
