import { mainnet } from 'viem/chains';

import { FarcasterNetwork, Protocol } from '@/constants/farcaster.js';
import { ensureHexPrefix } from '@/helpers/ensureHexPrefix.js';

const FARCASTER_VERIFICATION_DOMAIN = {
    name: 'Farcaster Verify Ethereum Address',
    version: '2.0.0',
    salt: '0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558',
} as const;

const VERIFICATION_CLAIM_TYPES = {
    EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'salt', type: 'bytes32' },
    ],
    VerificationClaim: [
        { name: 'fid', type: 'uint256' },
        { name: 'address', type: 'address' },
        { name: 'blockHash', type: 'bytes32' },
        { name: 'network', type: 'uint8' },
    ],
} as const;

interface VerificationMessageParams {
    fid: number | string;
    address: string;
    blockHash: string;
    network?: number; // Default: 1 (mainnet)
    protocol?: Protocol; // Default: Protocol.ETHEREUM
}

interface EthereumVerificationMessage {
    domain: {
        name: string;
        version: string;
        salt: `0x${string}`;
    };
    message: {
        fid: bigint;
        address: `0x${string}`;
        blockHash: `0x${string}`;
        network: number;
    };
    primaryType: 'VerificationClaim';
    types: typeof VERIFICATION_CLAIM_TYPES;
}

export function createEthereumVerificationMessage(params: VerificationMessageParams): EthereumVerificationMessage {
    const { fid, address, blockHash, network = mainnet.id } = params;

    const formattedAddress = ensureHexPrefix(address);
    const formattedBlockHash = ensureHexPrefix(blockHash);

    return {
        domain: {
            name: FARCASTER_VERIFICATION_DOMAIN.name,
            version: FARCASTER_VERIFICATION_DOMAIN.version,
            salt: FARCASTER_VERIFICATION_DOMAIN.salt,
        },
        message: {
            fid: BigInt(fid),
            // IMPORTANT: Normalize to lowercase to match signature recovery
            address: formattedAddress.toLowerCase() as `0x${string}`,
            blockHash: formattedBlockHash,
            network,
        },
        primaryType: 'VerificationClaim',
        types: VERIFICATION_CLAIM_TYPES,
    };
}

export function createSolanaVerificationMessage(params: VerificationMessageParams): string {
    const { fid, address, blockHash, network = FarcasterNetwork.MAINNET } = params;

    const message = `fid: ${fid} address: ${address} network: ${network} blockHash: ${blockHash} protocol: ${Protocol.SOLANA}`;
    return message;
}
