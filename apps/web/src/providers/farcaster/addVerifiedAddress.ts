import { safeUnreachable } from '@dimensiondev/utils';
import { ensureHexPrefix } from '@dimensiondev/web3/utils';
import bs58 from 'bs58';
import { toBytes } from 'viem';
import { mainnet } from 'viem/chains';

import { MessageType, Protocol } from '@/constants/farcaster.js';
import { createWagmiPublicClient } from '@/helpers/createWagmiPublicClient.js';
import { convertFarcasterAddressToBytes } from '@/providers/farcaster/convertFarcasterAddressToBytes.js';
import { determineFarcasterProtocol } from '@/providers/farcaster/determineFarcasterProtocol.js';
import type { FarcasterSession } from '@/providers/farcaster/Session.js';
import { publishMessage } from '@/providers/firefly/farcaster-hub/publishMessage.js';
import { encodeMessageData } from '@/providers/neynar/encodeMessageData.js';
import type { FarcasterHubMessage } from '@/providers/types/Firefly.js';

function convertHexStringToBytes(hexString: string): Uint8Array {
    try {
        const hexWithPrefix = ensureHexPrefix(hexString);
        return toBytes(hexWithPrefix);
    } catch (error) {
        throw new Error(`Failed to convert hex string to bytes: ${error}`);
    }
}

function convertBase58StringToBytes(base58String: string): Uint8Array {
    try {
        return bs58.decode(base58String);
    } catch (error) {
        throw new Error(`Failed to convert base58 string to bytes: ${error}`);
    }
}

enum AddressType {
    EOA = 0,
    CONTRACT = 1,
}

async function checkEthereumAddressType(address: string): Promise<AddressType> {
    const client = createWagmiPublicClient(mainnet.id, 'default');
    const code = await client.getCode({
        address: address as `0x${string}`,
    });
    return code === undefined || code === '0x' ? AddressType.EOA : AddressType.CONTRACT;
}

export async function addVerifiedAddress(
    request: {
        address: string;
        blockHash: string;
        signature: string;
        protocol?: Protocol;
        fid?: string;
    },
    session?: FarcasterSession,
): Promise<FarcasterHubMessage> {
    const { address, blockHash, signature } = request;
    const protocol = request.protocol ?? determineFarcasterProtocol(address);

    // IMPORTANT: Normalize Ethereum address to lowercase to match signature recovery
    const normalizedAddress = protocol === Protocol.ETHEREUM ? address.toLowerCase() : address;

    let blockHashBytes: Uint8Array;
    let signatureBytes: Uint8Array;

    switch (protocol) {
        case Protocol.ETHEREUM: {
            blockHashBytes = convertHexStringToBytes(blockHash);
            signatureBytes = convertHexStringToBytes(signature);
            break;
        }
        case Protocol.SOLANA: {
            blockHashBytes = convertBase58StringToBytes(blockHash);
            signatureBytes = convertHexStringToBytes(signature);
            break;
        }
        default:
            safeUnreachable(protocol);
            throw new Error(`Unsupported protocol: ${protocol}`);
    }

    const addressType = protocol === Protocol.ETHEREUM ? await checkEthereumAddressType(address) : AddressType.EOA;

    const { messageJson } = await encodeMessageData(
        {
            type: MessageType.VERIFICATION_ADD_ETH_ADDRESS,
            verificationAddAddressBody: {
                address: convertFarcasterAddressToBytes(normalizedAddress, protocol),
                claimSignature: signatureBytes,
                blockHash: blockHashBytes,
                verificationType: addressType,
                chainId: 0,
                protocol,
            },
        },
        session,
    );
    return publishMessage(messageJson);
}
