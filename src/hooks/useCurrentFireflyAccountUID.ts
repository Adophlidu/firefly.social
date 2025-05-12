import { useMemo } from 'react';

import { FireflySession } from '@/providers/firefly/Session.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { useFireflyStateStore } from '@/store/useProfileStore.js';

export function useCurrentFireflyAccountUID(): string | undefined {
    const accounts = useFireflyStateStore((state) => state.accounts);
    return useMemo(() => {
        for (const account of accounts) {
            if (account.session.type !== SessionType.Firefly) continue;
            return (account.session as FireflySession).payload?.uid;
        }
        return undefined;
    }, [accounts]);
}
