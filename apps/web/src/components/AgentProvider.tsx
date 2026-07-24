'use client';

import { Agent } from '@dimensiondev/enums';
import { isValidEnumValue } from '@dimensiondev/utils';
import { createContext, type ReactNode, useContext, useMemo } from 'react';

import { usePathname, useSearchParams } from '@/esm/navigation.js';

const AgentContext = createContext<Agent | null>(null);

export function useAgent() {
    return useContext(AgentContext);
}

// Derived from the URL (not window.location in an effect) so it's reactive on navigation
// and server/client consistent (no hydration mismatch). useSearchParams needs a Suspense boundary.
export function AgentProvider({ children }: { children: ReactNode }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const agent = useMemo<Agent | null>(() => {
        const raw = searchParams?.get('agent') ?? null;
        if (raw && isValidEnumValue(raw, Agent)) return raw as Agent;
        if (pathname?.startsWith('/frame')) return Agent.FireflyApp;
        return null;
    }, [searchParams, pathname]);

    return <AgentContext value={agent}>{children}</AgentContext>;
}
