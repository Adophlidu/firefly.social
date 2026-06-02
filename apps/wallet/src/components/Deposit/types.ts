export interface DepositPayTokenDisplay {
    chainId: number;
    address?: string;
    logoUrl?: string;
    symbol: string;
    name: string;
    balance?: string;
    price?: number;
    decimals: number;
    rawAmount?: string;
}
