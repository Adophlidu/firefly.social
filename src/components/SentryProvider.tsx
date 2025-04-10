'use client';

import { type PropsWithChildren } from 'react';
import { useEffectOnce } from 'react-use';

import { sentryClient } from '@/configs/sentryClient.js';
import { bom } from '@/helpers/bom.js';

type SentryProviderProps = PropsWithChildren<{}>;

export function SentryProvider({ children }: SentryProviderProps) {
    useEffectOnce(() => {
        if (bom.document) sentryClient.init();
    });
    return children;
}
