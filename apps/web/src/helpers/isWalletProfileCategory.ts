import { WalletProfileCategory } from '@dimensiondev/enums';

export function isWalletProfileCategory(category: string): category is WalletProfileCategory {
    return Object.values(WalletProfileCategory).includes(category as WalletProfileCategory);
}
