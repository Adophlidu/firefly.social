import type { TokenType } from '@dimensiondev/enums';

// https://github.com/microsoft/TypeScript/issues/29729#issuecomment-1483854699
interface Nothing {}

type LiteralUnion<U, T = U extends string ? string : U extends number ? number : never> = U | (T & Nothing);

interface Token<ChainId, SchemaType> {
    /** For NFT, it could be `${chainId}.${contractAddress}.${tokenId}` */
    id: string;
    chainId: ChainId;
    type: TokenType;
    schema: SchemaType;
    address: string;
    /** NFT has tokenId */
    tokenId?: string;
    /** Added by user */
    isCustomToken?: boolean;
}

export interface FungibleToken<ChainId, SchemaType, Original = unknown> extends Token<ChainId, SchemaType> {
    name: string;
    symbol: string;
    decimals: number;
    logoURL?: string;
    // Sorted by market cap.
    rank?: number;
    __original__?: Original;
}

export interface NonFungibleCollection<ChainId> {
    /** some providers define id, while others don't. For those don't, we will fallback to contract address */
    id?: string;
    chainId: ChainId;
    name: string;
    address?: string;
    iconURL?: string | null;
    /** the amount of holders */
    ownersTotal?: number;
}

export interface NonFungibleTokenTrait {
    /** The type of trait. */
    type: string;
    /** The value of trait. */
    value: string;
    /** The rarity of trait in percentage. */
    rarity?: string;
    displayType?: LiteralUnion<'date' | 'string' | 'number'> | null;
}
