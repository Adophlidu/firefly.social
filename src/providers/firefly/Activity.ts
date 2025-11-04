import urlcat from 'urlcat';

import { STATUS, WalletSource } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { formatFireflyConnections } from '@/helpers/formatFireflyConnections.js';
import { formatWalletConnections } from '@/helpers/formatWalletConnection.js';
import { createIndicator, createNextIndicator, createPageable, type PageIndicator } from '@/helpers/pageable.js';
import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { Provider } from '@/providers/types/Activity.js';
import type {
    ActivityInfoResponse,
    ActivityListResponse,
    GetAllConnectionsResponse,
} from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

class FireflyActivity implements Provider {
    async getFireflyActivityInfo(name: string) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/activity/info', {
            name,
        });
        const response = await fetchJson<ActivityInfoResponse>(url);
        return resolveFireflyResponseData(response);
    }

    async getFireflyActivityList({ indicator, size }: { indicator?: PageIndicator; size?: number } = {}) {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/activity/list', {
            cursor: indicator?.id,
            size,
        });
        const response = await fetchJson<ActivityListResponse>(url);
        const data = resolveFireflyResponseData(response);
        if (!data.list) {
            return createPageable(EMPTY_LIST, createIndicator(indicator));
        }
        return createPageable(
            data.list,
            createIndicator(indicator),
            data.cursor ? createNextIndicator(indicator, `${data.cursor}`) : undefined,
        );
    }

    async getAllConnections() {
        const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/accountConnection');
        const response = await fireflySessionHolder.fetchWithSession<GetAllConnectionsResponse>(url, {
            method: 'GET',
        });
        const connections = formatFireflyConnections(response);
        if (env.external.NEXT_PUBLIC_ACTIVITY_PARTICLE === STATUS.Disabled) {
            connections.wallet.connected = connections.wallet.connected.filter(
                (x) => x.source !== WalletSource.Particle,
            );
        }
        return {
            connected: formatWalletConnections(connections.wallet.connected, connections),
            related: formatWalletConnections(connections.wallet.unconnected, connections),
            rawConnections: connections,
        };
    }
}

export const FireflyActivityProvider = new FireflyActivity();
