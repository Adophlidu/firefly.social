import { TWITTER_TIMELINE_WHITELIST_JSON_URL } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';

export async function getTwitterTimelineWhitelist() {
    return fetchJson<Array<{ uid: string }>>(TWITTER_TIMELINE_WHITELIST_JSON_URL);
}
