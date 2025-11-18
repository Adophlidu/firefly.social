import { MessageType } from '@/constants/farcaster.js';
import { toFarcasterTime } from '@/helpers/toFarcasterTime.js';
import { encodeMessageData } from '@/providers/neynar/encodeMessageData.js';
import type { SignaturePacket } from '@/providers/types/Hubble.js';

export async function generateSignaturePacket(): Promise<SignaturePacket> {
    const { signer, messageDataHash, messageDataSignature } = await encodeMessageData(() => {
        return {
            type: MessageType.CAST_ADD,
            timestamp: toFarcasterTime(Date.now()),
            castAddBody: undefined,
        };
    });
    return {
        signer,
        messageHash: messageDataHash,
        messageSignature: messageDataSignature,
    };
}
