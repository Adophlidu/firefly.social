import { createContext, type ReactNode, useMemo } from 'react';

interface SessionProviderProps {
    children: ReactNode;
    token?: string;
    onLogin?: () => Promise<void>;
}

export interface SessionContextType {
    token: string | null;
    isLogin: boolean;
    onLogin: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children, token, onLogin }: SessionProviderProps) {
    const contextValue = useMemo(
        () => ({
            token: token || null,
            isLogin: !!token,
            onLogin: onLogin || (async () => {}),
        }),
        [token, onLogin],
    );

    return <SessionContext.Provider value={contextValue}>{children}</SessionContext.Provider>;
}
