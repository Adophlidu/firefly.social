import { useMemo } from 'react';

import type { FireflySession } from '@/providers/firefly/Session.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

export function useCurrentFireflyAccountUID(): string | undefined {
    const accounts = useFireflyProfileStore((state) => state.accounts);
    return useMemo(() => {
        for (const account of accounts) {
            if (account.session.type !== SessionType.Firefly) continue;
            return (account.session as FireflySession).payload?.uid;
        }

        return undefined;
    }, [accounts]);
}
