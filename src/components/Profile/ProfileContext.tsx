'use client';

import { createContext, type PropsWithChildren } from 'react';

import type { FireflyIdentity, FireflyProfile } from '@/providers/types/Firefly.js';

interface WalletProfileProps {
    profiles: FireflyProfile[];
    identity?: FireflyIdentity;
}

export const ProfileContext = createContext<WalletProfileProps>({
    profiles: [],
});

export function WalletProfileProvider({ children, ...value }: PropsWithChildren<WalletProfileProps>) {
    return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
