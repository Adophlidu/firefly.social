import { envs } from '@dimensiondev/envs/wallet';
import urlcat from 'urlcat';

import type { CoinbaseAsset, CoinbaseBuyerToken, CoinbaseNetwork } from '@/providers/types/PrivyAuth.js';

const COINBASE_ASSET_ID: Record<CoinbaseAsset, string> = {
    USDC: '2b92315d-eab7-5bef-84fa-089a131333f5',
    ETH: 'd85dce9b-5b73-5c3c-8978-522ce1d1c1b4',
    BTC: '5b71fc48-3dd3-540c-809b-f8c94d0e68b5',
    SOL: '4f039497-3af8-5bb3-951c-6df9afa9be1c',
    POL: '026bcc1e-9163-591c-a709-34dd18b2e7a1',
    MON: '92aa538f-b005-45cc-a237-71d6466f54d9',
};

export function resolveCoinbaseBuyerUrl(
    { app_id, partner_user_id, session_token }: CoinbaseBuyerToken,
    network: CoinbaseNetwork,
    asset: CoinbaseAsset,
) {
    const assetId = COINBASE_ASSET_ID[asset];
    if (!assetId) throw new Error(`Unsupported asset: ${asset}`);

    return urlcat('https://pay.coinbase.com/buy/one-click', {
        appId: app_id,
        defaultAsset: 'd85dce9b-5b73-5c3c-8978-522ce1d1c1b4',
        defaultExperience: 'buy',
        defaultNetwork: network,
        defaultPaymentMethod: 'CARD',
        endPartnerName: `privy:${envs.external.NEXT_PUBLIC_PRIVY_APP_ID}`,
        partnerUserId: partner_user_id,
        presetCryptoAmount: '0.01',
        sessionToken: session_token,
    });
}
