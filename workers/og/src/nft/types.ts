import type { ErcType } from '@dimensiondev/enums';
import type { FireflyResponse } from '@dimensiondev/workers-shared/types/firefly.js';

export interface Attribute {
    attribute_name: string;
    attribute_value: string;
    percentage: string;
}

export interface Asset {
    attributes: Attribute[];
    contract_address: string;
    contract_name: string;
    contract_token_id: string;
    token_id: string;
    erc_type: ErcType | string;
    owner: string;
    /** unix timestamp */
    owner_timestamp: number;
    mint_transaction_hash: string;
    /** unix timestamp */
    mint_timestamp: number;
    mint_price: number;
    token_uri?: string;
    minter: string;
    metadata_json?: string;
    name: string;
    /** mime type */
    content_type: string | null;
    content_uri: string | null;
    description: string;
    image_uri?: string;
    external_link: string;
    latest_trade_price: string | null;
    latest_trade_symbol: string | null;
    latest_trade_timestamp: number | null;
    nftscan_id: string | null;
    nftscan_uri: string | null;
    small_nftscan_uri: string | null;
    imageURL: string | null;
    amount: string;
    rarity_rank: number | null;
    rarity_score: number | null;
    /** extends at runtime, Firefly API also extends this. */
    chain_id: number;
    /** extends at runtime, Firefly API also extends this. */
    hasBookmarked?: boolean;
    /** extends at runtime. */
    video_uri?: string;
}

export interface Collection {
    contract_address: string;
    name: string;
    symbol: string;
    description: string;
    website?: string;
    email?: string;
    twitter?: string;
    discord?: string;
    telegram?: string;
    github?: string;
    instagram?: string;
    medium?: string;
    logo_url: string;
    banner_url: string;
    featured_url: string;
    large_image_url: string;
    attributes: Attribute[];
    erc_type: ErcType;
    deploy_block_number: number;
    owner: string;
    verified: boolean;
    opensea_verified: boolean;
    is_spam: boolean;
    royalty: number;
    items_total: number;
    amounts_total: number;
    owners_total: number;
    assets_total?: number;
    opensea_floor_price: number;
    opensea_slug: string;
    floor_price: number;
    collections_with_same_name: Array<string | number>;
    price_symbol: string;
    /** extended by Firefly API */
    chain_id: number;
}

export interface NFTDetail extends Asset {
    collection: Collection;
}

export type NFTDetailResponse = FireflyResponse<NFTDetail[]>;
export type CollectionResponse = FireflyResponse<Collection>;
