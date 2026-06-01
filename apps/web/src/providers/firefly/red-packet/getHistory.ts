import { EMPTY_LIST } from '@dimensiondev/constants';
import {
    createIndicator,
    createNextIndicator,
    createPageable,
    type Pageable,
    type PageIndicator,
} from '@dimensiondev/utils';
import urlcat from 'urlcat';
import type { Hex } from 'viem';

import { fetchJson } from '@/helpers/fetchJson.js';
import type {
    ActionType,
    HistoryResponse,
    RedPacketClaimedInfo,
    RedPacketSentInfo,
    SourceType,
} from '@/providers/types/FireflyRedPacket.js';
import { settings } from '@/settings/index.js';

export async function getHistory<
    T extends ActionType,
    R = T extends ActionType.Claim ? RedPacketClaimedInfo : RedPacketSentInfo,
>(actionType: T, from: Hex, platform: SourceType, indicator?: PageIndicator): Promise<Pageable<R, PageIndicator>> {
    if (!from) {
        return createPageable(EMPTY_LIST, createIndicator(indicator));
    }
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/redpacket/history', {
        address: from,
        redpacketType: actionType,
        claimFrom: platform,
        cursor: indicator?.id,
        size: 20,
    });
    const { data } = await fetchJson<HistoryResponse>(url);
    return createPageable(
        data.list.map((v) => ({ ...v, chain_id: Number(v.chain_id) })) as R[],
        createIndicator(indicator),
        data.cursor ? createNextIndicator(indicator, data.cursor.toString()) : undefined,
    );
}
