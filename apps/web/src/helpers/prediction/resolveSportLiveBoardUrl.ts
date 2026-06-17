import { Locale } from '@dimensiondev/enums';
import { createLookupTableResolver } from '@dimensiondev/utils';

const SPORT_LIVE_BOARD_HOST = 'https://worldcup-live.web3.bio';

// The board uses its own locale codes, which differ from the app's Locale enum.
const resolveBoardLocale = createLookupTableResolver<Locale, string>(
    {
        [Locale.en]: 'en',
        [Locale.es]: 'es',
        [Locale.ja]: 'ja',
        [Locale.ko]: 'kr',
        [Locale.zhHans]: 'zh',
        [Locale.zhHant]: 'zh-Hant',
    },
    'en',
);

interface SportLiveBoardUrlOptions {
    /** Render the board in compact (embed) mode. */
    compact?: boolean;
    /** Board color theme. */
    theme?: 'dark' | 'light';
    /** App locale used to localize the board; falls back to English. */
    locale?: Locale;
}

/**
 * Resolve the live data board URL for a sport event.
 * The board is keyed by the same slug as the Firefly event detail page.
 */
export function resolveSportLiveBoardUrl(
    eventSlug: string | undefined,
    options?: SportLiveBoardUrlOptions,
): string | undefined {
    const slug = eventSlug?.trim();
    if (!slug) return undefined;

    const url = new URL(`${SPORT_LIVE_BOARD_HOST}/${encodeURIComponent(slug)}`);
    if (options?.compact) url.searchParams.set('compact', 'true');
    if (options?.theme) url.searchParams.set('theme', options.theme);
    if (options?.locale) url.searchParams.set('locale', resolveBoardLocale(options.locale));
    return url.toString();
}
