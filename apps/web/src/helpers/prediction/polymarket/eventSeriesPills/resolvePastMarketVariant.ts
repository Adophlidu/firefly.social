import type { PastMarketVariant } from '@/helpers/prediction/polymarket/eventSeriesPills/types.js';
import { classifyPolymarketCryptoSlug } from '@/providers/prediction/polymarket/resolveCryptoUpDownFromEvent.js';

/** Resolve past-results `variant` from slug (Polymarket `eO` inner logic). */
export function resolvePastMarketVariant(slug: string): PastMarketVariant | null {
    const classification = classifyPolymarketCryptoSlug(slug);

    if (classification.kind === 'crypto-up-down-short') {
        switch (classification.interval) {
            case '5m':
                return 'fiveminute';
            case '15m':
                return 'fifteen';
            case '4h':
                return 'fourhour';
            default:
                return null;
        }
    }

    if (classification.kind === 'multistrike-4h') return 'fourhour';
    if (classification.kind === 'hourly-up-down') return 'hourly';
    if (classification.kind === 'daily-up-down') return 'daily';

    if (slug.includes('-up-or-down-on-')) return 'daily';
    if (/-\d+(am|pm)-et$/.test(slug)) return 'hourly';

    return null;
}

export function isPolymarketUpDownSlug(slug: string): boolean {
    const classification = classifyPolymarketCryptoSlug(slug);
    if (classification.kind !== 'other') return true;
    return classification.isUpDownFamily;
}
