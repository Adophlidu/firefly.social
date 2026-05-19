import { NetworkType, WalletSource } from '@dimensiondev/enums';
import { compact } from 'lodash-es';

import { queryClient } from '@/configs/queryClient.js';
import { queryMyAllConnections } from '@/helpers/queryMyAllConnections.js';
import { createPrivyWallet } from '@/providers/firefly/endpoint/createPrivyWallet.js';

async function ensureCreatedFireflyWallets(): Promise<
    Array<{
        platform: 'eth' | 'solana';
        address: string;
    }>
> {
    const { connected } = await queryClient.fetchQuery(queryMyAllConnections);
    const privyConnections = connected.filter((connection) => connection.source === WalletSource.Privy);
    if (privyConnections.length >= 2) return privyConnections;

    /**
     * we cant call queryMyAllConnections directly after createPrivyWallet,
     * because there is a delay in data updates, so we use the result of createPrivyWallet directly
     */
    const privyUser = await createPrivyWallet();
    return compact(
        privyUser.wallets.map((x) => {
            const platform =
                x.chain === NetworkType.Ethereum ? 'eth' : x.chain === NetworkType.Solana ? 'solana' : undefined;
            return platform
                ? {
                      platform,
                      address: x.publicAddress,
                  }
                : null;
        }),
    );
}

export async function ensureCreatedFireflyWallet(platform: 'eth' | 'solana' = 'eth') {
    const wallets = await ensureCreatedFireflyWallets();
    const wallet = wallets.find((x) => x.platform === platform);
    return wallet;
}
