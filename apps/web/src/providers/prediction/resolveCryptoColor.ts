import { createLookupTableResolver, safeUnreachable } from '@dimensiondev/utils';

import { PredictionCrypto } from '@/constants/bets.js';

export const resolveCryptoColor = createLookupTableResolver<PredictionCrypto, string>(
    {
        [PredictionCrypto.Bitcoin]: '#FF9900',
        [PredictionCrypto.Ethereum]: '#637FEB',
        [PredictionCrypto.Solana]: '#9945FF',
        [PredictionCrypto.XRP]: '#028CFF',
        [PredictionCrypto.Dogecoin]: '#C2A633',
        [PredictionCrypto.Hype]: '#00C2A8',
        [PredictionCrypto.BNB]: '#F3BA2F',
    },
    (crypto) => {
        safeUnreachable(crypto as never);
        return '#FF9900';
    },
);
