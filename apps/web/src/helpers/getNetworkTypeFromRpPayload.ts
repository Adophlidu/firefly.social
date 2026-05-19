import { NetworkType } from '@dimensiondev/enums';
import { isValidAddressSolana } from '@dimensiondev/web3/utils';

import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';

export function getNetworkTypeFromRpPayload(payload: RedPacketJSONPayload) {
    return isValidAddressSolana(payload.sender.address) ? NetworkType.Solana : NetworkType.Ethereum;
}
