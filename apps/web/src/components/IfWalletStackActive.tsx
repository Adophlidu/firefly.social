'use client';

import type { ReactNode } from 'react';

import { useWalletStackStore } from '@/store/useWalletStackStore.js';

interface Props {
    children: ReactNode;
}

/**
 * Renders children only once the deferred wallet stack is active, so consumers
 * that pull wallet-only chunks (e.g. FireflyWallet with its AppKit controllers)
 * stay unmounted — and unloaded — on read-only page views.
 */
export function IfWalletStackActive({ children }: Props) {
    const active = useWalletStackStore((state) => state.active);
    if (!active) return null;
    return children;
}
