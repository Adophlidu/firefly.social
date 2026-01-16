import { MessageType } from '@/constants/farcaster.js';
import { convertFarcasterAddressToBytes } from '@/providers/farcaster/convertFarcasterAddressToBytes.js';
import { determineFarcasterProtocol } from '@/providers/farcaster/determineFarcasterProtocol.js';
import type { FarcasterSession } from '@/providers/farcaster/Session.js';
import { encodeMessageData } from '@/providers/neynar/encodeMessageData.js';
import { publishMessage } from '@/providers/neynar/publishMessage.js';
import { type FarcasterHubMessage } from '@/providers/types/Firefly.js';

export async function deleteVerifiedAddress({
    address,
    session,
}: {
    address: string;
    session?: FarcasterSession;
}): Promise<FarcasterHubMessage> {
    const protocol = determineFarcasterProtocol(address);
    const addressBytes = convertFarcasterAddressToBytes(address, protocol);

    const { messageJson } = await encodeMessageData(
        {
            type: MessageType.VERIFICATION_REMOVE,
            verificationRemoveBody: {
                address: addressBytes,
                protocol,
            },
        },
        session,
    );
    return publishMessage(messageJson);
}
