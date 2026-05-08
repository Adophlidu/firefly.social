import { createLookupTableResolver, UnreachableError } from '@dimensiondev/utils';

import { PredictionCrypto } from '@/constants/bets.js';

export const resolveChainLinkCrypto = createLookupTableResolver<PredictionCrypto, string>(
    {
        [PredictionCrypto.Bitcoin]: 'btc',
        [PredictionCrypto.Ethereum]: 'eth',
        [PredictionCrypto.Solana]: 'sol',
        [PredictionCrypto.XRP]: 'xrp',
        [PredictionCrypto.Dogecoin]: 'doge',
        [PredictionCrypto.Hype]: 'hype',
        [PredictionCrypto.BNB]: 'bnb',
    },
    (crypto) => {
        throw new UnreachableError('crypto', crypto);
    },
);

export const resolveBinanceCrypto = createLookupTableResolver<PredictionCrypto, string>(
    {
        [PredictionCrypto.Bitcoin]: 'BTC',
        [PredictionCrypto.Ethereum]: 'ETH',
        [PredictionCrypto.Solana]: 'SOL',
        [PredictionCrypto.XRP]: 'XRP',
        [PredictionCrypto.Dogecoin]: 'DOGE',
        [PredictionCrypto.Hype]: 'HYPE',
        [PredictionCrypto.BNB]: 'BNB',
    },
    (crypto) => {
        throw new UnreachableError('crypto', crypto);
    },
);
