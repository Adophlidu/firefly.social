import { isSameAddress } from '@dimensiondev/web3-utils';

const STABLECOIN_ADDRESSES: Record<number, { usdt: string; usdc: string }> = {
    1: {
        usdt: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        usdc: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    },
    56: {
        usdt: '0x55d398326f99059ff775485246999027b3197955',
        usdc: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    },
    8453: {
        usdt: '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2',
        usdc: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    },
    10: {
        usdt: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
        usdc: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    },
    137: {
        usdt: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
        usdc: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
    },
    42161: {
        usdt: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
        usdc: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    },
};

export function isSupportedStablecoin(chainId: number, tokenAddress: string): boolean {
    const addresses = STABLECOIN_ADDRESSES[chainId];
    if (!addresses) return false;
    return isSameAddress(addresses.usdt, tokenAddress) || isSameAddress(addresses.usdc, tokenAddress);
}
