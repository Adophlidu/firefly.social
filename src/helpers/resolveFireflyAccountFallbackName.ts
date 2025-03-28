import { compact } from 'lodash-es';

import { formatFireflyAccountProfileFromFireflyConnections } from '@/helpers/formatFireflyAccountProfileFromFireflyConnections.js';
import type { AllConnections } from '@/providers/types/Firefly.js';

export function resolveFireflyAccountFallbackName(connections?: AllConnections): string | undefined {
    if (!connections) return;
    const fireflyProfile = formatFireflyAccountProfileFromFireflyConnections(connections.account);
    if (fireflyProfile?.displayName) return fireflyProfile.displayName;
    return compact([
        ...connections.farcaster.connected.map((x) => x.display_name),
        ...connections.lens.connected.flatMap((x) => x.lens.map((lens) => lens.localName)),
        ...connections.twitter.connected.map((x) => x.name),
        ...connections.bsky.connected.map((x) => x.name),
    ])[0];
}
