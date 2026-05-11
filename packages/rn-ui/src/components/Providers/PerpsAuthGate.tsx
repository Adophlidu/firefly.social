import { useAtomValue } from 'jotai';
import type { ReactNode } from 'react';

import { LoginFallback } from '@/components/LoginFallback';
import { sessionTokenAtom } from '@/store/session';

interface PerpsAuthGateProps {
    children?: ReactNode;
}

/** Renders `LoginFallback` when `sessionTokenAtom` is empty; otherwise `children`. Use inside `TamaguiProvider`. */
export function PerpsAuthGate({ children }: PerpsAuthGateProps) {
    const authToken = useAtomValue(sessionTokenAtom);
    if (!authToken) {
        return <LoginFallback />;
    }
    return <>{children}</>;
}
