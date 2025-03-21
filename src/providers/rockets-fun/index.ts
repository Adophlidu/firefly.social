import urlcat from 'urlcat';

import { ROCKET_FUN_API_BASE_URL } from '@/constants/index.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import type { PaginationResponse, RocketsFunResponse, RocketsFunToken } from '@/providers/types/RocketsFun.js';

function createNextPageIndicator<T>(res: PaginationResponse<T>) {
    if (!res.pagination) {
        return undefined;
    }
    const { currentPage, totalPages } = res.pagination;
    if (Number.isNaN(Number(currentPage)) || Number.isNaN(Number(totalPages))) return undefined;

    return currentPage < totalPages ? createNextIndicator(undefined, `${Number(currentPage) + 1}`) : undefined;
}

class RocketsFun {
    async getTokensByDeployer(address: string, indicator?: PageIndicator, pageSize = 25) {
        const url = urlcat(ROCKET_FUN_API_BASE_URL, `/api/tokens`, {
            deployer: address,
            pageSize,
            page: indicator?.id,
        });

        const response = await fetchJSON<PaginationResponse<RocketsFunToken>>(url);
        if (response.code !== 0) {
            throw new Error('Failed to fetch tokens');
        }

        return createPageable(
            response.data,
            createIndicator(indicator),
            createNextPageIndicator(response),
            response.pagination?.total,
        );
    }

    async getMarketTokens(
        options?: {
            search?: string;
            sort?: 'created_at' | 'market_cap';
            order?: 'asc' | 'desc';
        },
        indicator?: PageIndicator,
        pageSize = 25,
    ) {
        const url = urlcat(ROCKET_FUN_API_BASE_URL, `/api/tokens`, {
            pageSize,
            page: indicator?.id,
            search: options?.search,
            sort: options?.sort || 'market_cap',
            order: options?.order || 'desc',
        });

        const response = await fetchJSON<PaginationResponse<RocketsFunToken>>(url);
        if (response.code !== 0) {
            throw new Error('Failed to fetch tokens');
        }

        return createPageable(
            response.data as RocketsFunToken[],
            createIndicator(indicator),
            createNextPageIndicator(response),
            response.pagination?.total,
        );
    }

    async getTokenByAddress(address: string) {
        const url = urlcat(ROCKET_FUN_API_BASE_URL, `/api/tokens/${address}`);

        const response = await fetchJSON<RocketsFunResponse<RocketsFunToken>>(url);
        if (response.code !== 0) {
            throw new Error('Failed to fetch token');
        }

        return response.data;
    }
}

export const RocketsFunProvider = new RocketsFun();
