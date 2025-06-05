import { ACTIONS_BLINK_REGISTER_URL } from '@/constants/index.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import type { ActionType } from '@/types/blink.js';

export async function isBlinkWhitelist(url: string) {
    const urlObj = parseUrl(url.startsWith('https://') ? url : `https://${url}`);
    if (!urlObj) return false;
    const res = await fetchJSON<{ actions: Array<{ host: string; state: ActionType }> }>(ACTIONS_BLINK_REGISTER_URL, {
        next: {
            revalidate: 60 * 60, // 1 hour
        },
    });
    return res.actions.some(
        (action) => action.state === 'trusted' && action.host.toLowerCase() === urlObj.host.toLowerCase(),
    );
}
