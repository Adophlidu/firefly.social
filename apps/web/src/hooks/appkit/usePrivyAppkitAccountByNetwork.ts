import type { NetworkType } from '@dimensiondev/web3/enums';

import { usePrivyAppKitAccounts } from '@/hooks/useAppKitAccounts.js';

export function usePrivyAppkitAccountByNetwork(networkType: NetworkType) {
    const { accounts, isLoading } = usePrivyAppKitAccounts();
    const account = accounts.find((x) => x.network === networkType);
    return { account, isLoading };
}
