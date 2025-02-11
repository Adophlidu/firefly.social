'use client';

import { createContext, type PropsWithChildren, type ReactNode, useMemo } from 'react';

interface ActivityPremiumListItem {
    label: ReactNode;
    verified?: boolean;
}

interface ActivityPremiumListContext {
    list: ActivityPremiumListItem[];
}

export const ActivityPremiumListContext = createContext<ActivityPremiumListContext>({
    list: [],
});

export function ActivityPremiumListProvider({
    children,
    list,
}: PropsWithChildren<Pick<ActivityPremiumListContext, 'list'>>) {
    const value = useMemo(() => {
        return {
            list,
        };
    }, [list]);
    return <ActivityPremiumListContext.Provider value={value}>{children}</ActivityPremiumListContext.Provider>;
}
