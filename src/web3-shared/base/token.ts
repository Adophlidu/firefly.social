import { TokenType } from '@/constants/enum.js';
import { type FungibleToken } from '@/web3-shared/base/specs.js';

export function createFungibleToken<ChainId, SchemaType>(
    chainId: ChainId,
    schema: SchemaType,
    address: string,
    name: string,
    symbol: string,
    decimals: number,
    logoURL?: string,
): FungibleToken<ChainId, SchemaType> {
    return {
        chainId,
        type: TokenType.Fungible,
        schema,
        id: address,
        address,
        name,
        symbol,
        decimals,
        logoURL,
    };
}
