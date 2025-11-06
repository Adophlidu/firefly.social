import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';
import { settings } from '@/settings/index.js';
import type { EthereumChainId } from '@/web3-shared/evm/types.js';

export async function checkGasFreeStatus(chainId: EthereumChainId, wallet: string) {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/redpacket/checkGasFreeRedPacketClaimStatus', {
        wallet,
        chainId,
    });
    const { data } = await fetchJson<
        FireflyRedPacketAPI.Response<{
            substituteGasStatus: boolean;
        }>
    >(url);
    return data.substituteGasStatus;
}
