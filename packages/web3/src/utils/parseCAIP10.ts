import { arbitrum, base, baseSepolia, gnosis, mainnet, optimism, polygon, zora } from 'viem/chains';

import { isValidAddressEthereum } from '@/utils/isValidAddress.js';

/**
 * EVM chain IDs supported by Farcaster Frame v1 `eip155:` CAIP-10 accounts.
 * @see https://docs.farcaster.xyz/developers/frames/spec
 */
export const FARCASTER_FRAME_V1_CHAIN_IDS = [
    mainnet.id,
    polygon.id,
    arbitrum.id,
    gnosis.id,
    base.id,
    optimism.id,
    baseSepolia.id,
    zora.id,
] as const;

function isFarcasterFrameV1ChainId(chainId: number): boolean {
    return (FARCASTER_FRAME_V1_CHAIN_IDS as readonly number[]).includes(chainId);
}

export function parseCAIP10(caip10: string) {
    if (!caip10.startsWith('eip155:')) throw new Error(`Invalid CAIP10 identifier: ${caip10}`);

    const fragments = caip10.split(':');
    const [chainId, address, ...parameters] = fragments.slice(1);

    const chainIdParsed = Number.parseInt(chainId, 10);
    if (isNaN(chainIdParsed) || chainIdParsed <= 0) throw new Error(`Invalid chain ID: ${chainId}`);
    if (!isFarcasterFrameV1ChainId(chainIdParsed)) throw new Error(`Unsupported chain ID: ${chainId}`);

    const addressParsed = isValidAddressEthereum(address) ? address : undefined;

    return {
        chainId: chainIdParsed,
        address: addressParsed,
        parameters,
    };
}
