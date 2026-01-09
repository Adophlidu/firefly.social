import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { type AllConnections, type GetAllConnectionsResponse } from '@/providers/types/Firefly.js';

export function formatFireflyConnections(response: GetAllConnectionsResponse): AllConnections {
    const data = resolveFireflyResponseData(response);

    return {
        ...data,
        twitter: {
            connected: data.twitter.connected,
            unconnected: data.twitter.unconnected.flatMap((x) => x.twitters),
        },
    };
}
