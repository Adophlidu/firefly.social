import type { BetsEventTagForUI } from '@/types/prediction.js';
import { SportCategory } from '@/types/prediction.js';

const ESPORT_LEAGUE_MAP: Record<string, SportCategory> = {
    dota: SportCategory.EsportDota2,
    'dota 2': SportCategory.EsportDota2,
    valorant: SportCategory.EsportValorant,
    'counter-strike': SportCategory.EsportCs2,
    cs2: SportCategory.EsportCs2,
    'league of legends': SportCategory.EsportLol,
    lol: SportCategory.EsportLol,
};

const SPORT_ID_MAP: Record<string, SportCategory> = {
    soccer: SportCategory.Soccer,
    football: SportCategory.Soccer,
    tennis: SportCategory.Tennis,
    baseball: SportCategory.Baseball,
    mlb: SportCategory.Baseball,
    basketball: SportCategory.Default,
    nba: SportCategory.Default,
    esports: SportCategory.Default, // needs sub-classification via league
};

/**
 * Classify a sport event into a SportCategory using multiple signals.
 * Priority: sportId → leagueName (sub-classification) → fallback to Default.
 */
export function classifySport(sportId?: string, leagueName?: string, tags?: BetsEventTagForUI[]): SportCategory {
    // 1. Direct sportId match
    if (sportId) {
        const normalized = sportId.toLowerCase().trim();
        if (SPORT_ID_MAP[normalized]) {
            const category = SPORT_ID_MAP[normalized];
            // If it's esports, try sub-classification via league name
            if (category === SportCategory.Default) {
                return classifyEsportByLeague(leagueName) ?? SportCategory.Default;
            }
            return category;
        }
        // Check if sportId itself is an esport sub-type
        if (normalized.includes('dota')) return SportCategory.EsportDota2;
        if (normalized.includes('valorant')) return SportCategory.EsportValorant;
        if (normalized.includes('cs2') || normalized.includes('counter')) return SportCategory.EsportCs2;
        if (normalized.includes('lol') || normalized.includes('league')) return SportCategory.EsportLol;
    }

    // 2. Check tags for sport identification
    if (tags?.length) {
        for (const tag of tags) {
            const slug = tag.slug?.toLowerCase().trim();
            const label = tag.label?.toLowerCase().trim();
            if (slug && SPORT_ID_MAP[slug]) {
                return SPORT_ID_MAP[slug];
            }
            if (label && SPORT_ID_MAP[label]) {
                return SPORT_ID_MAP[label];
            }
        }
    }

    // 3. Check league name for direct classification
    if (leagueName) {
        const normalized = leagueName.toLowerCase().trim();
        // Direct sport matches from league name
        if (normalized.includes('soccer') || normalized.includes('football')) return SportCategory.Soccer;
        if (normalized.includes('tennis') || normalized.includes('atp') || normalized.includes('wta')) {
            return SportCategory.Tennis;
        }
        if (normalized.includes('baseball') || normalized.includes('mlb')) return SportCategory.Baseball;
        // Esport sub-classification from league name
        const esport = classifyEsportByLeague(leagueName);
        if (esport) return esport;
    }

    return SportCategory.Default;
}

function classifyEsportByLeague(leagueName?: string): SportCategory | undefined {
    if (!leagueName) return undefined;
    const normalized = leagueName.toLowerCase().trim();
    for (const [keyword, category] of Object.entries(ESPORT_LEAGUE_MAP)) {
        if (normalized.includes(keyword)) return category;
    }

    return undefined;
}
