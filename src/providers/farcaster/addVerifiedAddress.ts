import { safeUnreachable } from '@dimensiondev/utils';
import bs58 from 'bs58';
import { toBytes } from 'viem';
import { z } from 'zod';

import { MessageType, Protocol } from '@/constants/farcaster.js';
import { createWagmiPublicClient } from '@/helpers/createWagmiPublicClient.js';
import { ensureHexPrefix } from '@/helpers/ensureHexPrefix.js';
import { convertFarcasterAddressToBytes } from '@/providers/farcaster/convertFarcasterAddressToBytes.js';
import { determineFarcasterProtocol } from '@/providers/farcaster/determineFarcasterProtocol.js';
import { publishMessage } from '@/providers/neynar/publishMessage.js';
import { type FarcasterHubMessage } from '@/providers/types/Firefly.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

const AddVerifiedAddressRequestSchema = z.object({
    address: z.string().min(1, 'Address is required and must be a string'),
    blockHash: z.string().min(1, 'BlockHash is required and must be a string'),
    signature: z.string().min(1, 'Signature is required and must be a string'),
    protocol: z.nativeEnum(Protocol).optional(),
});

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
    const client = createWagmiPublicClient(EthereumChainId.Mainnet, 'default');
    const code = await client.getCode({
        address: address as `0x${string}`,
    });
    return code === undefined || code === '0x' ? AddressType.EOA : AddressType.CONTRACT;
}

export async function addVerifiedAddress(
    request: z.infer<typeof AddVerifiedAddressRequestSchema>,
): Promise<FarcasterHubMessage> {
    const {
        address,
        blockHash,
        signature,
        protocol: providedProtocol,
    } = AddVerifiedAddressRequestSchema.parse(request);

    const protocol = providedProtocol ?? determineFarcasterProtocol(address);

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

    return publishMessage(() => ({
        type: MessageType.VERIFICATION_ADD_ETH_ADDRESS,
        verificationAddAddressBody: {
            address: convertFarcasterAddressToBytes(normalizedAddress, protocol),
            claimSignature: signatureBytes,
            blockHash: blockHashBytes,
            verificationType: addressType,
            chainId: 0,
            protocol,
        },
    }));
}
