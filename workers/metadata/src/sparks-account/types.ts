import type { FireflyResponse } from '@dimensiondev/workers-shared/types/firefly.js';

export interface OgUser {
    platform: string;
    platform_id: string;
    handle: string;
    IsClaim: boolean;
    IsActive: boolean;
}

export enum OgStatus {
    isOgActive = 1,
    isOgInactive = 2,
    isNotOg = 3,
    isNotBoundX = 4,
}

export enum FansStatus {
    isFansActive = 1,
    isFansInactive = 2,
    isNotFans = 3,
    isNotBoundX = 4,
}

export interface SparksProfile {
    account_id: number;
    account_uuid: string;
    fansActive: boolean;
    name: string;
    ogActive: boolean;
    rank: string;
    uid: string;
    avatar: string;
    isFans: FansStatus;
    isOg: OgStatus;
    OgList?: OgUser[];
    FansList?: OgUser[];
}

export type SparksProfileResponse = FireflyResponse<SparksProfile>;
