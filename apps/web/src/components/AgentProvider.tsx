'use client';

import { Agent } from '@dimensiondev/enums';
import { isValidEnumValue } from '@dimensiondev/utils';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

const AgentContext = createContext<Agent | null>(null);

export function useAgent() {
    return useContext(AgentContext);
}

function detectAgent(): Agent | null {
    if (typeof window === 'undefined') return null;

    const url = new URL(window.location.href);
    const raw = url.searchParams.get('agent');
    if (raw && isValidEnumValue(raw, Agent)) return raw as Agent;

    if (url.pathname.startsWith('/frame')) return Agent.FireflyApp;
    return null;
}

export function AgentProvider({ children }: { children: ReactNode }) {
    // Lazy initializer runs synchronously on client first render — no flash
    const [agent, setAgent] = useState<Agent | null>(null);
    useEffect(() => {
        setAgent(detectAgent());
    }, []);

    return <AgentContext value={agent}>{children}</AgentContext>;
}
