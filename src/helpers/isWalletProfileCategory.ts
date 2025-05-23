import { WalletProfileCategory } from '@/constants/enum.js';

export function isWalletProfileCategory(category: string): category is WalletProfileCategory {
    return [
        WalletProfileCategory.Activities,
        WalletProfileCategory.NFTs,
        WalletProfileCategory.POAPs,
        WalletProfileCategory.Transactions,
    ].includes(category as WalletProfileCategory);
}
