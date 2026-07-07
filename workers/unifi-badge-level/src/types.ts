import type { FireflyResponse } from '@dimensiondev/workers-shared/types/firefly.js';

export type BadgeLevelPlatform = 'eth' | 'twitter' | 'lens' | 'farcaster' | 'account' | 'bsky';

export interface BadgeLevelQuery {
    platform: BadgeLevelPlatform;
    id: string;
}

export interface BadgeLevelResult {
    level: number;
    platform: string;
    profile_id: string;
    token_symbol?: string;
    token_amount?: string;
}

export type BadgeLevelResponse = FireflyResponse<BadgeLevelResult>;

export interface BadgeLevelBatchResponse {
    results: BadgeLevelResult[];
}
