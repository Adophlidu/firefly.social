import type { NonFungibleCollection } from '@masknet/web3-shared-base';

import type { Pageable, PageIndicator } from '@/helpers/pageable.js';
import type { BaseHubOptions } from '@/mask_pkgs/web3-providers/entry-types.js';

export namespace NonFungibleTokenAPI {
    export interface AttributesValue {
        attributes_value: string;
        total: number;
    }
    export interface Attributes {
        attributes_name: string;
        attributes_values: AttributesValue[];
        total: number;
    }
    export enum ErcType {
        ERC721 = 'erc721',
        ERC1155 = 'erc1155',
    }

    export interface Collection {
        contract_address: string;
        name: string;
        symbol: string;
        description: string;
        website: string | null;
        email: string | null;
        twitter: string | null;
        discord: string | null;
        telegram: string | null;
        reddit: string | null;
        github: string | null;
        instagram: string | null;
        medium: string | null;
        youtube: string | null;
        logo_url: string;
        banner_url: string;
        featured_url: string;
        large_image_url: string;
        attributes: Attributes[];
        erc_type: ErcType | string;
        deploy_block_number: number;
        owner: string;
        verified: boolean;
        opensea_verified: boolean;
        items_total: number;
        owners_total: number;
        royalty: number;
        opensea_floor_price: number;
        floor_price: number | undefined;
        price_symbol: string;
    }
    export interface Provider<ChainId, SchemaType, Indicator = PageIndicator> {
        /** Get non-fungible collections owned by the given account. */
        getCollectionsByOwner?: (
            account: string,
            options?: BaseHubOptions<ChainId, Indicator>,
        ) => Promise<Pageable<NonFungibleCollection<ChainId, SchemaType>, Indicator>>;
    }
}
