import { type Hex, hexToBytes } from 'viem';
import { signMessage } from 'viem/accounts';

import { getCurrentClaimProfile } from '@/providers/ethereum/getCurrentClaimProfile.js';
import type { ClaimRedPacketContext } from '@/providers/ethereum/RedPacket.js';
import { fireflyRedPacketProvider } from '@/providers/firefly/RedPacket.js';

export async function signClaimMessage(context: ClaimRedPacketContext) {
    const { account, payload } = context;
    if (!account) return;

    const rpid = payload.rpid;
    const password = 'privateKey' in payload ? payload.privateKey : payload.password;
    const version = payload.contract_version;

    if (version <= 3) return password as string;
    if (password)
        return signMessage({
            message: { raw: hexToBytes(account as Hex) },
            privateKey: password as Hex,
        });

    const me = await getCurrentClaimProfile(context.source);
    if (!me) return;

    return fireflyRedPacketProvider.createClaimSignature({
        rpid,
        profile: me,
        wallet: {
            address: account,
        },
    });
}
