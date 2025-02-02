'use client';

import type { HTMLProps, PropsWithChildren, ReactNode } from 'react';

import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { type SocialSource } from '@/constants/enum.js';
import { isSocialSource } from '@/helpers/isSocialSource.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';

interface Props extends HTMLProps<HTMLDivElement> {
    source: SocialSource;
    fallback?: ReactNode;
    required?: boolean;
}

export function LoginRequiredGuard({
    source,
    children,
    fallback,
    className,
    required = true,
}: PropsWithChildren<Props>) {
    const isLogin = useIsLogin(isSocialSource(source) ? source : undefined);

    if (!required) return children;

    if (!isLogin) {
        return fallback ?? <NotLoginFallback source={source} className={className} />;
    }

    return children;
}
