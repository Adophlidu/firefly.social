import { type Token } from '@/providers/types/Transfer.js';
import { type CustomToken, CustomTokenType } from '@/store/useCustomTokenStore.js';

export function formatCustomTokenToTipsToken<T extends Token>(token: CustomToken, options?: Partial<T>): T {
    if (token.type !== CustomTokenType.ERC20) {
        throw new Error('Unsupported token type');
    }
    return {
        amount: 0,
        chain: '',
        display_symbol: null,
        is_wallet: false,
        optimized_symbol: '',
        price_24h_change: 0,
        protocol_id: '',
        raw_amount: '',
        raw_amount_hex_str: '',
        time_at: 0,
        id: token.address,
        chainId: token.chainId,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        logo_url: token.logoURI,
        is_verified: true,
        balance: '0',
        usdValue: 0,
        price: 0,
        is_core: false,
        ...options,
    } as T;
}
