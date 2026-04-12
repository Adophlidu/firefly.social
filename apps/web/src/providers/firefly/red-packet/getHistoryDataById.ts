import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import type { Response } from '@/providers/types/Firefly.js';
import type { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';
import { settings } from '@/settings/index.js';

/**
 * Get the history data of a red packet by its ID.
 * @param rpid - The ID of the red packet.
 * @returns The history data of the red packet reported by automatically.
 */
export async function getHistoryDataById(rpid: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/redpacket/fromHistory', { rpid });
    const response = await fetchJson<Response<FireflyRedPacketAPI.RedPacketSentInfo>>(url);
    return resolveFireflyResponseData(response);
}
