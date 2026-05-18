import type { ErcType, TransEventType } from '@dimensiondev/enums';

export namespace EVM {
    export interface Attribute {
        attribute_name: string;
        attribute_value: string;
        percentage: string;
    }

    export interface Payload {
        name?: string;
        description?: string;
        image?: string;
        attributes?: Array<{
            trait_type: string;
            value: string;
            percentage?: string;
        }>;
    }

    /**
     * @see https://docs.nftscan.com/reference/evm/get-single-nft
     */
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
        deployPlatform?: string;
        deployPlatformLogo?: string;
    }

    export interface AssetsGroup {
        contract_address: string;
        contract_name: string | null;
        verified?: boolean;
        opensea_verified?: boolean;
        logo_url?: string | null;
        owns_total: number;
        items_total: number;
        description: string | null;
        assets: Asset[];
        symbol: string | null;
        is_spam?: boolean;
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
        deployPlatform?: Asset['deployPlatform'];
        deployPlatformLogo?: Asset['deployPlatformLogo'];
    }

    export type CollectionBasics = Pick<
        Collection,
        'chain_id' | 'contract_address' | 'name' | 'large_image_url' | 'logo_url' | 'assets_total'
    >;

    export interface Transaction {
        amount: string;
        block_hash: string;
        block_number: number;
        contract_address: string;
        contract_name: string;
        contract_token_id: string;
        erc_type: string;
        event_type: TransEventType;
        exchange_name: string;
        from: string;
        gas_fee: number;
        gas_price: string;
        gas_used: string;
        hash: string;
        nftscan_tx_id: string;
        receive: string;
        send: string;
        timestamp: number;
        to: string;
        token_id: string;
        trade_price: number;
        trade_symbol: string;
        trade_symbol_address: string | null;
        trade_value: string;
    }

    export type CollectionTrendingRange = '1h' | '4h' | '12h' | '1d' | '3d' | '7d' | '30d' | '90d' | '1y' | 'all';
    export interface CollectionTrendingRecord {
        begin_timestamp: number;
        end_timestamp: number;
        average_price: number;
        volume: number;
    }
}
