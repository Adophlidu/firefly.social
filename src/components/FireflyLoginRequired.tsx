'use client';

import type { PropsWithChildren } from 'react';

import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';

export function FireflyLoginRequired({ children }: PropsWithChildren) {
    const isLoginFirefly = useIsLoginFirefly();
    if (!isLoginFirefly) {
        return null;
    }
    return children;
}
