import { type NetworkType } from '@/constants/enum.js';
import { usePrivyAppKitAccounts } from '@/hooks/useAppKitAccounts.js';

export function usePrivyAppkitAccountByNetwork(networkType: NetworkType) {
    const { accounts, isLoading } = usePrivyAppKitAccounts();
    const account = accounts.find((x) => x.network === networkType);
    return { account, isLoading };
}
