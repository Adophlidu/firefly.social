import { normalizeSolChainId } from '@dimensiondev/web3/chains';
import { ETH_NATIVE_TOKEN_ADDRESS, SOL_NATIVE_TOKEN_ADDRESS } from '@dimensiondev/web3/constants';

export interface DefaultSwapTokenPair {
    chainId: number;
    chainName: string;
    first: {
        symbol: string;
        contractAddress: string;
        decimals: number;
    };
    second: {
        symbol: string;
        contractAddress: string;
        decimals: number;
    };
}

export const DEFAULT_SWAP_TOKENS: DefaultSwapTokenPair[] = [
    {
        chainId: 1,
        chainName: 'Ethereum',
        first: { symbol: 'ETH', contractAddress: ETH_NATIVE_TOKEN_ADDRESS, decimals: 18 },
        second: { symbol: 'USDC', contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
    },
    {
        chainId: 56,
        chainName: 'Binance Smart Chain',
        first: { symbol: 'BNB', contractAddress: ETH_NATIVE_TOKEN_ADDRESS, decimals: 18 },
        second: { symbol: 'USDC', contractAddress: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', decimals: 6 },
    },
    {
        chainId: 137,
        chainName: 'Polygon',
        first: { symbol: 'POL', contractAddress: ETH_NATIVE_TOKEN_ADDRESS, decimals: 18 },
        second: { symbol: 'USDC', contractAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', decimals: 6 },
    },
    {
        chainId: 10,
        chainName: 'Optimism',
        first: { symbol: 'ETH', contractAddress: ETH_NATIVE_TOKEN_ADDRESS, decimals: 18 },
        second: { symbol: 'USDC', contractAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6 },
    },
    {
        chainId: 8453,
        chainName: 'Base',
        first: { symbol: 'ETH', contractAddress: ETH_NATIVE_TOKEN_ADDRESS, decimals: 18 },
        second: { symbol: 'USDC', contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
    },
    {
        chainId: 42161,
        chainName: 'Arbitrum',
        first: { symbol: 'ETH', contractAddress: ETH_NATIVE_TOKEN_ADDRESS, decimals: 18 },
        second: { symbol: 'USDC', contractAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
    },
    {
        chainId: 43114,
        chainName: 'Avalanche',
        first: { symbol: 'AVAX', contractAddress: ETH_NATIVE_TOKEN_ADDRESS, decimals: 18 },
        second: { symbol: 'USDC', contractAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', decimals: 6 },
    },
    {
        chainId: 81457,
        chainName: 'Blast',
        first: { symbol: 'ETH', contractAddress: ETH_NATIVE_TOKEN_ADDRESS, decimals: 18 },
        second: { symbol: 'USDB', contractAddress: '0x4300000000000000000000000000000000000003', decimals: 18 },
    },
    {
        chainId: 250,
        chainName: 'Fantom',
        first: { symbol: 'FTM', contractAddress: ETH_NATIVE_TOKEN_ADDRESS, decimals: 18 },
        second: { symbol: 'TUSD', contractAddress: '0x9879aBDea01a879644185341F7aF7128A740e757', decimals: 18 },
    },
    {
        chainId: 59144,
        chainName: 'Linea',
        first: { symbol: 'ETH', contractAddress: ETH_NATIVE_TOKEN_ADDRESS, decimals: 18 },
        second: { symbol: 'USDC', contractAddress: '0x8cAf31Dd58B36b2b84a7e6Df6B52f9D3131e3380', decimals: 6 },
    },
    {
        chainId: 169,
        chainName: 'Manta Pacific',
        first: { symbol: 'ETH', contractAddress: ETH_NATIVE_TOKEN_ADDRESS, decimals: 18 },
        second: { symbol: 'USDC', contractAddress: '0xE6C9E2976Dd0476f39831289A8D997CC9fa5C55E', decimals: 6 },
    },
    {
        chainId: 5000,
        chainName: 'Mantle',
        first: { symbol: 'MNT', contractAddress: ETH_NATIVE_TOKEN_ADDRESS, decimals: 18 },
        second: { symbol: 'USDC', contractAddress: '0x9333246333A6E6F8E9e7dDb947d3d9D1B1A7E5F9', decimals: 6 },
    },
    {
        chainId: 534352,
        chainName: 'Scroll',
        first: { symbol: 'ETH', contractAddress: ETH_NATIVE_TOKEN_ADDRESS, decimals: 18 },
        second: { symbol: 'USDC', contractAddress: '0x06eFdBFf2a14D7aAe658D48f57F2a2c3a27B6E5a', decimals: 6 },
    },
    {
        chainId: 501,
        chainName: 'Solana',
        first: { symbol: 'SOL', contractAddress: SOL_NATIVE_TOKEN_ADDRESS, decimals: 9 },
        second: { symbol: 'USDC', contractAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
    },
];

export function getDefaultSwapToken(chainId: number): DefaultSwapTokenPair | undefined {
    const normalizedId = normalizeSolChainId(chainId);
    return DEFAULT_SWAP_TOKENS.find((t) => t.chainId === normalizedId);
}
