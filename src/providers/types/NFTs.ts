import type { Address } from 'viem';

import type { EVM, TransEventType } from '@/providers/nft-scan/types.js';
import { type FireflyDisplayInfo, type FollowingSource, type NFTDetail } from '@/providers/types/Firefly.js';

export interface Response<T> {
    code: number;
    data: T;
    error?: string[];
}

export type DiscoverNFTResponseV3 = Response<{
    result: NFTFeedV3[];
    cursor?: string;
}>;

export interface NFTFeedV3 extends EVM.Transaction {
    chain_id: number;
    /** address */
    owner: string;
    aggregate_exchange_name: string;
    detail: EVM.Asset | null;
    displayInfo: FireflyDisplayInfo;
    followingSources: FollowingSource[];
    /** extends at runtime */
    bookmarked?: boolean;
    has_bookmarked?: boolean;
    deployPlatform?: string;
    deployPlatformLogo?: string;
}

export interface FollowingNFT {
    timestamp: string;
    hash: string;
    owner: Address;
    address_from: string;
    address_to: string;
    network: string;
    tag: string;
    type: TransEventType;
    detail: NFTDetail;
    displayInfo: FireflyDisplayInfo;
    followingSources: FollowingSource[];
}

export interface Poap {
    event: {
        id: number;
        fancy_id: string;
        name: string;
        event_url: string;
        image_url: string;
        country: string;
        city: string;
        description: string;
        year: number;
        /** @example "18-Nov-2021" */
        start_date: string;
        /** @example "18-Nov-2021" */
        end_date: string;
        /** @example "18-Nov-2021" */
        expiry_date: string;
        supply: number;
    };
    tokenId: string;
    /** owner address */
    owner: string;
    chain: 'xdai';
    /** @example "2021-11-20 02:17:40" */
    created: string;
    /** extends at runtime */
    hasBookmarked?: boolean;
}

export interface PoapDetail {
    event: {
        id: number;
        fancy_id: string;
        name: string;
        event_url: string;
        image_url: string;
        country: string;
        city: string;
        description: string;
        year: number;
        /** @example "18-Nov-2021" */
        start_date: string;
        /** @example "18-Nov-2021" */
        end_date: string;
        /** @example "18-Nov-2021" */
        expiry_date: string;
    };
    supply: {
        total: number;
        order: number;
    };
    /** address */
    owner: string;
    tokenId: string;
    /** extends at runtime */
    hasBookmarked?: boolean;
}

export type PoapResponse = Response<Poap[]>;

export type NFTDetailResponse = Response<NFTDetail[]>;

export type PoapDetailResponse = Response<PoapDetail>;

export interface PoapHolderToken {
    created: string;
    migrated: string;
    id: string;
    owner: {
        id: string;
        tokensOwned: number;
        ens: string;
    };
    transferCount: string;
}

export type PoapHoldersResponse = Response<{
    limit: number;
    offset: number;
    total: number;
    tokens: PoapHolderToken[];
}>;
