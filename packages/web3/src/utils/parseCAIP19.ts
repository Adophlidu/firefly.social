import { ETH_ZERO_ADDRESS, SOL_ZERO_ADDRESS } from '@/constants.js';

export interface CAIP19Token {
    chainNamespace: string;
    chainReference: string;
    namespace: string;
    reference: string;
    tokenId?: string;
}

const nativeReferences: Record<string, string> = {
    solana: SOL_ZERO_ADDRESS,
    eip155: ETH_ZERO_ADDRESS,
};

export function parseCAIP19(assetId: string): CAIP19Token {
    if (!assetId || typeof assetId !== 'string') {
        throw new Error('Invalid assetId: must be a non-empty string');
    }

    const parts = assetId.split('/');
    if (parts.length !== 2 && parts.length !== 3) {
        throw new Error('Invalid CAIP-19 format: must have 2 or 3 parts separated by /');
    }

    const [chainId, assetPart] = parts;
    const tokenId = parts[2];

    if (!chainId || !assetPart) {
        throw new Error('Invalid CAIP-19 format: chainId and assetPart are required');
    }

    if (!chainId.includes(':')) {
        throw new Error('Invalid chainId format: must be namespace:reference');
    }

    const [chainNamespace, chainReference] = chainId.split(':');
    if (!chainNamespace || !chainReference) {
        throw new Error('Invalid chainId format: namespace and reference are required');
    }

    let namespace: string;
    let reference: string;

    if (assetPart.includes(':')) {
        const [assetNamespace, assetReference] = assetPart.split(':');
        if (!assetNamespace || !assetReference) {
            throw new Error('Invalid asset format: namespace and reference are required');
        }
        namespace = assetNamespace;
        reference = assetReference;
    } else {
        // Handle special case like "native" without namespace:reference format
        namespace = assetPart;

        // Special handling for native assets
        reference = (namespace === 'native' && nativeReferences[chainNamespace]) || '';
    }

    return {
        chainNamespace,
        chainReference,
        namespace,
        reference,
        tokenId,
    };
}
