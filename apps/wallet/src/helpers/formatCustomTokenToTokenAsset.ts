import { type TokenAsset } from '@/providers/types/Firefly.js';
import { type ERC20Token } from '@/store/customToken.js';

/**
 * Convert custom ERC20 token to TokenAsset format
 * This allows custom tokens to be merged with API token data
 */
export function formatCustomTokenToTokenAsset(token: ERC20Token, walletAddress: string): TokenAsset {
    return {
        chainIndex: String(token.chainId),
        name: token.name,
        symbol: token.symbol,
        decimals: String(token.decimals),
        tokenLogoUrl: token.logoURI || '',
        tokenAddress: token.address,
        address: walletAddress,
        balance: '0', // Custom tokens don't have balance initially, will be updated by API if available
        tokenPrice: '0', // Custom tokens don't have price initially, will be updated by API if available
        tokenType: 'ERC20',
        isRiskToken: false,
    };
}
