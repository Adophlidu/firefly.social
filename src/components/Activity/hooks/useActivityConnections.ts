import { useQuery } from '@tanstack/react-query';

import { useCurrentProfileFirstAvailable } from '@/hooks/useCurrentProfile.js';
import { useFireflyBridgeAuthorization } from '@/hooks/useFireflyBridgeAuthorization.js';
import { useFireflyBridgeSupported } from '@/hooks/useFireflyBridgeSupported.js';
import { FireflyActivityProvider } from '@/providers/firefly/Activity.js';

export function useActivityConnections() {
    const currentProfileFirstAvailable = useCurrentProfileFirstAvailable();
    const { data: authToken } = useFireflyBridgeAuthorization();
    const { value: supported } = useFireflyBridgeSupported();
    return useQuery({
        queryKey: ['allConnections', supported, currentProfileFirstAvailable, authToken],
        async queryFn() {
            if (supported) {
                if (!authToken) return; // Not logged in on the mobile
            } else {
                if (!currentProfileFirstAvailable) return; // Not logged in on the web
            }
            return FireflyActivityProvider.getAllConnections();
        },
        refetchInterval: 600000,
    });
}
