import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';

export function isPrivyAddress(address: string) {
    const { isAuthorized, wallets } = useFireflyWalletStore.getState();
    const allWallets = [...wallets.ethereum, ...wallets.solana];
    if (!isAuthorized || !allWallets.length) return false;

    return allWallets.some((wallet) => wallet.address.toLowerCase() === address.toLowerCase());
}
