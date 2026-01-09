import { type Hex, hexToBytes } from 'viem';
import { signMessage } from 'viem/accounts';

import { NetworkType } from '@/constants/enum.js';
import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import { getCurrentClaimProfile } from '@/providers/ethereum/getCurrentClaimProfile.js';
import { type ClaimRedPacketContext } from '@/providers/ethereum/red-packet/types.js';
import { createClaimSignature } from '@/providers/firefly/red-packet/createClaimSignature.js';

export async function signClaimMessage(context: ClaimRedPacketContext): Promise<
    | {
          signedMessage: string;
          message?: string;
          publicKey?: string;
      }
    | undefined
> {
    const { account, payload } = context;
    if (!account) return;

    const rpid = payload.rpid;
    const password = 'privateKey' in payload ? payload.privateKey : payload.password;
    const version = payload.contract_version;

    if (version <= 3)
        return {
            signedMessage: password as string,
        };
    if (password) {
        const signed = await signMessage({
            message: { raw: hexToBytes(account as Hex) },
            privateKey: password as Hex,
        });

        return {
            signedMessage: signed,
        };
    }

    const me = await getCurrentClaimProfile(context.source);
    if (!me) return;

    const data = await createClaimSignature({
        rpid,
        isSolana: getNetworkTypeFromRpPayload(payload) === NetworkType.Solana,
        profile: me,
        wallet: {
            address: account,
        },
    });

    return data;
}
