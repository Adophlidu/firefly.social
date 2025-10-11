import { WalletProfileCategory } from '@/constants/enum.js';

export function isWalletProfileCategory(category: string): category is WalletProfileCategory {
    return [
        WalletProfileCategory.Activities,
        WalletProfileCategory.NFTs,
        WalletProfileCategory.Transactions,
        WalletProfileCategory.Bets,
    ].includes(category as WalletProfileCategory);
}
