import { NetworkType } from '@/constants/enum.js';
import { isValidAddressSolana } from '@/helpers/isValidAddress.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';

export function getNetworkTypeFromRpPayload(payload: RedPacketJSONPayload) {
    return isValidAddressSolana(payload.sender.address) ? NetworkType.Solana : NetworkType.Ethereum;
}
