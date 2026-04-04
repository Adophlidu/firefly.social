'use client';

import { type HTMLProps, type PropsWithChildren, type ReactNode } from 'react';

import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { type LoginFallbackSource } from '@/constants/enum.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';

interface Props extends HTMLProps<HTMLDivElement> {
    source: LoginFallbackSource;
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
        if (fallback) return fallback;
        return <NotLoginFallback source={source} className={className} />;
    }

    return children;
}
