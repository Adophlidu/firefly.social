import { createLookupTableResolver, safeUnreachable } from '@dimensiondev/utils';

import { PredictionCrypto } from '@/constants/bets.js';

export const resolveCrypPriceDecimal = createLookupTableResolver<PredictionCrypto, number>(
    {
        [PredictionCrypto.Bitcoin]: 2,
        [PredictionCrypto.Ethereum]: 2,
        [PredictionCrypto.Solana]: 2,
        [PredictionCrypto.XRP]: 4,
        [PredictionCrypto.Dogecoin]: 6,
        [PredictionCrypto.Hype]: 4,
        [PredictionCrypto.BNB]: 4,
    },
    (crypto) => {
        safeUnreachable(crypto as never);
        return 2;
    },
);
