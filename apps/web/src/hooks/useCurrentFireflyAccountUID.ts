import { SessionType } from '@dimensiondev/enums';
import { useMemo } from 'react';

import type { FireflySession } from '@/providers/firefly/Session.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

function getSessionUid(session: unknown): string | undefined {
    if (!session || typeof session !== 'object') return undefined;
    if ((session as FireflySession).type !== SessionType.Firefly) return undefined;
    return (session as FireflySession).payload?.uid;
}

export function useCurrentFireflyAccountUID(): string | undefined {
    const accounts = useFireflyProfileStore((state) => state.accounts);
    const currentProfileSession = useFireflyProfileStore((state) => state.currentProfileSession);

    return useMemo(() => {
        for (const account of accounts) {
            const uid = getSessionUid(account.session);
            if (uid) return uid;
        }

        return getSessionUid(currentProfileSession);
    }, [accounts, currentProfileSession]);
}
