import { NetworkType } from '@/constants/enum.js';
import { SOLANA_PREFIX } from '@/constants/rp.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';

export function getNetworkTypeFromRpPayload(payload: RedPacketJSONPayload) {
    return payload.rpid.startsWith(SOLANA_PREFIX) ? NetworkType.Solana : NetworkType.Ethereum;
}
