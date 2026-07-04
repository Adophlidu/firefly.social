'use client';

import { createContext, type PropsWithChildren, useContext } from 'react';

import type { ExploreChannelsInitialData } from '@/helpers/buildExploreChannelsInitialData.js';

interface ExploreChannelsContextValue {
    initialChannelsPage?: ExploreChannelsInitialData;
}

const ExploreChannelsContext = createContext<ExploreChannelsContextValue>({});

export function useExploreChannelsContext() {
    return useContext(ExploreChannelsContext);
}

export function ExploreChannelsProvider({
    children,
    initialChannelsPage,
}: PropsWithChildren<ExploreChannelsContextValue>) {
    return (
        <ExploreChannelsContext.Provider value={{ initialChannelsPage }}>{children}</ExploreChannelsContext.Provider>
    );
}
