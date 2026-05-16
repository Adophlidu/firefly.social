import { POLYMARKET_MARKET_API_DOMAIN } from '@dimensiondev/workers-metadata/prediction/constants.js';
import { fetchJson } from '@dimensiondev/workers-shared/helpers/fetchJson.js';
import { urlcat } from '@dimensiondev/workers-shared/helpers/urlcat.js';
import type { Context } from 'hono';

interface PolymarketSearchProfile {
    name: string;
    pseudonym: string;
    displayUsernamePublic: boolean;
    proxyWallet: string;
}

interface PolymarketSearchResponse {
    profiles: PolymarketSearchProfile[];
    pagination: {
        hasMore: boolean;
        totalResults: number;
    };
}

export async function searchPolymarketProfile(username: string, c: Context): Promise<string | undefined> {
    try {
        const url = urlcat(POLYMARKET_MARKET_API_DOMAIN, '/public-search', {
            q: `@${username}`,
            search_profiles: true,
        });

        const response = await fetchJson<PolymarketSearchResponse>(url, {
            context: c,
        });

        if (!response?.profiles || response.profiles.length === 0) {
            console.log(`[searchPolymarketProfile] No profile found for username: ${username}`);
            return;
        }

        const target = response.profiles.find((x) => x.name.toLowerCase() === username.toLowerCase());
        const proxyWallet = target?.proxyWallet;
        console.log(`[searchPolymarketProfile] Found proxy wallet for ${username}: ${proxyWallet}`);
        return proxyWallet;
    } catch (error) {
        console.error(`[searchPolymarketProfile] Error searching for username ${username}:`, error);
        return;
    }
}
