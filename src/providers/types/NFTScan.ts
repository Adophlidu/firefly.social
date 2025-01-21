export namespace NFTScan {
    interface Attribute {
        attributes_name: string;
        attributes_values: Array<{
            attributes_value: string;
            total: number;
        }>;
        total: number;
    }

    export interface Collection {
        amounts_total: number;
        attributes: Attribute[];
        banner_url?: string;
        collections_with_same_name: Collection[];
        contract_address: string;
        deploy_block_number: number;
        description: string;
        discord?: string;
        email?: string;
        erc_type: string;
        featured_url: string;
        floor_price: number;
        github?: string;
        instagram?: string;
        is_spam: boolean;
        items_total: number;
        large_image_url: string;
        logo_url: string;
        medium?: string;
        name: string;
        opensea_floor_price: number;
        opensea_slug: string;
        opensea_verified: boolean;
        owner: string;
        owners_total: number;
        price_symbol: string;
        royalty: number;
        symbol: string;
        telegram?: string;
        twitter?: string;
        verified: boolean;
        website?: string;
        chain_id?: number;
    }
}

interface Response<T> {
    msg: string;
    code: number;
    data: T;
}

export type GetCollectionResponse = Response<NFTScan.Collection>;
