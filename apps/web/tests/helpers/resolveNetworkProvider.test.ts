import { NetworkType } from '@dimensiondev/enums';
import { describe, expect, it } from 'vitest';

import { resolveNetworkProvider } from '@/helpers/resolveNetworkProvider.js';
import { EthereumNetwork } from '@/providers/ethereum/Network.js';
import { SolanaNetwork } from '@/providers/solana/Network.js';

describe('resolveNetworkProvider', () => {
    it('resolves the Ethereum network provider', () => {
        expect(resolveNetworkProvider(NetworkType.Ethereum)).toBe(EthereumNetwork);
    });

    it('resolves the Solana network provider', () => {
        expect(resolveNetworkProvider(NetworkType.Solana)).toBe(SolanaNetwork);
    });
});
