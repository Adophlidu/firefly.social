import { MessageType } from '@/constants/farcaster.js';
import { convertFarcasterAddressToBytes } from '@/providers/farcaster/convertFarcasterAddressToBytes.js';
import { determineFarcasterProtocol } from '@/providers/farcaster/determineFarcasterProtocol.js';
import { publishMessage } from '@/providers/neynar/publishMessage.js';
import type { FarcasterHubMessage } from '@/providers/types/Firefly.js';

export async function deleteVerifiedAddress(address: string): Promise<FarcasterHubMessage> {
    if (!address) throw new Error('Address is required');

    const protocol = determineFarcasterProtocol(address);
    const addressBytes = convertFarcasterAddressToBytes(address, protocol);

    return publishMessage(() => ({
        type: MessageType.VERIFICATION_REMOVE,
        verificationRemoveBody: {
            address: addressBytes,
            protocol,
        },
    }));
}
