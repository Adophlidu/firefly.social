import { Locale } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import urlcat from 'urlcat';

import type { BetsEventDataForUI } from '@/types/prediction.js';

/** FW-7814 — SuperFortune ("玄学预测") integration on FIFA World Cup game detail pages. */

/** Host that renders the SuperFortune share card (currently the non-prod environment). */
const SUPERFORTUNE_CARD_HOST = 'https://nonprod.app.superfortune.xyz';
/** Host for the public SuperFortune game-interpretation page (the "Superfortune" jump button). */
const SUPERFORTUNE_APP_HOST = 'https://app.superfortune.xyz';
/** `leagueId` returned by `/v1/polymarket/event/detail` that identifies a FIFA World Cup match. */
const SUPERFORTUNE_LEAGUE_ID = 'fifwc';

export type SuperfortuneLang = 'zh' | 'en';

/** The card only supports `zh` / `en`; Simplified and Traditional Chinese both map to `zh`. */
export function resolveSuperfortuneLang(locale?: Locale): SuperfortuneLang {
    return locale === Locale.zhHans || locale === Locale.zhHant ? 'zh' : 'en';
}

/** The HTML share card, embedded in the modal via an `<iframe>` for preview. */
export function getSuperfortuneCardUrl(matchKey: string, lang: SuperfortuneLang): string {
    return urlcat(SUPERFORTUNE_CARD_HOST, '/share/worldcup/card', { match_key: matchKey, lang });
}

/**
 * Image URL used by the Download / Post actions — the single swap-point for the
 * partner's PNG endpoint (FW-7814). The partner only serves the HTML card today, so
 * this returns the card URL as a placeholder; once they expose a rendered image,
 * replace the URL here and Download / Post produce a real shareable image with no
 * other code changes.
 */
export function getSuperfortuneShareImageUrl(matchKey: string, lang: SuperfortuneLang): string {
    return getSuperfortuneCardUrl(matchKey, lang);
}

/** Public game-interpretation page opened by the "Superfortune" button (new tab, no warning). */
export function getSuperfortuneGameUrl(matchKey: string): string {
    return urlcat(SUPERFORTUNE_APP_HOST, '/worldcup/:matchKey', { matchKey });
}

/** Firefly game detail link pasted into the composer by the "Post" action. */
export function getSuperfortuneDetailUrl(matchKey: string): string {
    return urlcat(SITE_URL, '/polymarket/event/:slug', { slug: matchKey });
}

/**
 * The entry is shown only on a FIFA World Cup match detail page that is live or
 * upcoming: it must be a sport event with both teams resolved, `leagueId === 'fifwc'`,
 * and not yet finished.
 */
export function shouldShowSuperfortuneEntry(event: BetsEventDataForUI): boolean {
    const sport = event.sportData;
    if (!sport) return false;
    if (!sport.homeTeam?.name || !sport.awayTeam?.name) return false;
    if (sport.leagueId?.trim().toLowerCase() !== SUPERFORTUNE_LEAGUE_ID) return false;
    if (sport.ended) return false;
    return true;
}
