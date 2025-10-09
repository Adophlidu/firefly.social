'use client';

import type { PropsWithChildren, ReactNode } from 'react';

import { useSelectedLayoutSegments } from '@/esm/navigation.js';

interface Props extends PropsWithChildren {
    otherwise?: ReactNode;
}

export function WithinDiscover({ children, otherwise }: Props) {
    const segments = useSelectedLayoutSegments();
    const withinDiscover = segments.includes('discover') || segments.includes('explore');
    return withinDiscover ? children : otherwise;
}
