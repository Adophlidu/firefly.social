import { TWITTER_TIMELINE_WHITELIST_JSON_URL } from '@/constants/index.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';

export async function getTwitterTimelineWhitelist() {
    return fetchJSON<Array<{ uid: string }>>(TWITTER_TIMELINE_WHITELIST_JSON_URL);
}
