import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { resolveInternalLensHandle } from '@/helpers/resolveInternalLensHandle.js';
import type { AllConnections, GetAllConnectionsResponse, LensConnection } from '@/providers/types/Firefly.js';

export function formatFireflyConnections(response: GetAllConnectionsResponse): AllConnections {
    const data = resolveFireflyResponseData(response);

    // The auto-registered Lens account (handle `ff-<uid>`) is created for internal
    // use only — exclude it from every connection consumer. See FW-7824.
    const fireflyUid = data.account.find((x) => x.connected && x.uid)?.uid;
    const autoRegisteredLensHandle = resolveInternalLensHandle(fireflyUid);

    function excludeAutoRegisteredLens(groups: AllConnections['lens']['connected']) {
        if (!autoRegisteredLensHandle) return groups;
        const isAutoRegistered = (x: LensConnection) => x.localName.toLowerCase() === autoRegisteredLensHandle;
        return groups
            .map((group) => ({ ...group, lens: group.lens.filter((x) => !isAutoRegistered(x)) }))
            .filter((group) => group.lens.length > 0);
    }

    return {
        ...data,
        lens: {
            connected: excludeAutoRegisteredLens(data.lens.connected),
            unconnected: excludeAutoRegisteredLens(data.lens.unconnected),
        },
        twitter: {
            connected: data.twitter.connected,
            unconnected: data.twitter.unconnected.flatMap((x) => x.twitters),
        },
    };
}
