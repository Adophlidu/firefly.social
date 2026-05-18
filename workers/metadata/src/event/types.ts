import type { ActivityStatus } from '@dimensiondev/enums';
import type { FireflyResponse } from '@dimensiondev/workers-shared/types/firefly.js';

export interface ActivityInfo {
    id: number;
    name: string;
    title: string;
    sort: number;
    is_offline: number;
    sub_title: string;
    description: string;
    url: string;
    banner_url: string;
    cover_url: string;
    icon_url: string;
    ext: string;
    start_time: string;
    end_time: string;
    open_graph_url: string;
    status: ActivityStatus;
}

export type GetActivityInfoResponse = FireflyResponse<ActivityInfo>;
