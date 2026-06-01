import { NetworkType } from '@dimensiondev/enums';
import urlcat from 'urlcat';
import type { Hex } from 'viem';

import { fetchJson } from '@/helpers/fetchJson.js';
import type { ClaimStrategy, PublicKeyResponse } from '@/providers/types/FireflyRedPacket.js';
import { SourceType } from '@/providers/types/FireflyRedPacket.js';
import { settings } from '@/settings/index.js';

export async function createPublicKey(
    themeId: string,
    shareFrom: string,
    strategies: ClaimStrategy[],
    networkType: NetworkType,
): Promise<Hex> {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v2/redpacket/createPublicKey');
    const { data } = await fetchJson<PublicKeyResponse>(url, {
        method: 'POST',
        body: JSON.stringify({
            themeId,
            shareFrom,
            claimFrom: SourceType.FireflyPC,
            claimStrategy: JSON.stringify(strategies),
            isSolana: networkType === NetworkType.Solana,
        }),
    });
    return data.publicKey;
}
