import type { TokenType } from '@dimensiondev/enums';

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

export interface FungibleToken<ChainId, SchemaType> extends Token<ChainId, SchemaType> {
    name: string;
    symbol: string;
    decimals: number;
    logoURL?: string;
    // Sorted by market cap.
    rank?: number;
}
