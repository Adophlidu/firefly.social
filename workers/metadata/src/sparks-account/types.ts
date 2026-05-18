import type { FansStatus, OgStatus } from '@dimensiondev/enums';
import type { FireflyResponse } from '@dimensiondev/workers-shared/types/firefly.js';

export interface OgUser {
    platform: string;
    platform_id: string;
    handle: string;
    IsClaim: boolean;
    IsActive: boolean;
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
