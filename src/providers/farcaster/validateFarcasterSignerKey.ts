import { keyRegistryABI } from '@farcaster/core';
import { parseUnits } from 'viem';
import { readContract } from 'wagmi/actions';

import { config } from '@/configs/wagmiClient.js';
import { FarcasterInvalidSignerKey, MalformedError } from '@/constants/error.js';
import { getPublicKeyInHexFromPrivateKey } from '@/helpers/ed25519.js';
import type { FarcasterSession } from '@/providers/farcaster/Session.js';
import { EthereumChainId } from '#masknet/web3-shared-evm';

enum KeyState {
    ADDED = 1,
    REMOVED = 2,
}

export async function validateFarcasterSession(session: FarcasterSession): Promise<true> {
    const publicKey = await getPublicKeyInHexFromPrivateKey(session.token);
    if (!publicKey) throw new MalformedError('Invalid signer key.');

    try {
        const [state, _] = await readContract(config, {
            abi: keyRegistryABI,
            address: '0x00000000Fc1237824fb747aBDE0FF18990E59b7e',
            functionName: 'keys',
            args: [parseUnits(session.profileId, 0), publicKey],
            chainId: EthereumChainId.Optimism,
        });
        if (state !== KeyState.ADDED) throw new FarcasterInvalidSignerKey('Invalid signer key.');
    } catch {
        return true;
    }

    return true;
}
