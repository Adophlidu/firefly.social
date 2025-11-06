import urlcat from 'urlcat';

import { STATUS, WalletSource } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { formatFireflyConnections } from '@/helpers/formatFireflyConnections.js';
import { formatWalletConnections } from '@/helpers/formatWalletConnection.js';
import { fireflySessionHolder } from '@/providers/firefly/SessionHolder.js';
import type { GetAllConnectionsResponse } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

export async function getAllConnections() {
    const url = urlcat(settings.FIREFLY_ROOT_URL, '/v1/accountConnection');
    const response = await fireflySessionHolder.fetchWithSession<GetAllConnectionsResponse>(url, {
        method: 'GET',
    });
    const connections = formatFireflyConnections(response);
    if (env.external.NEXT_PUBLIC_ACTIVITY_PARTICLE === STATUS.Disabled) {
        connections.wallet.connected = connections.wallet.connected.filter((x) => x.source !== WalletSource.Particle);
    }
    return {
        connected: formatWalletConnections(connections.wallet.connected, connections),
        related: formatWalletConnections(connections.wallet.unconnected, connections),
        rawConnections: connections,
    };
}
