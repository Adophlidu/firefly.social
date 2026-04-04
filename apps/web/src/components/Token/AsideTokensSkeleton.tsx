'use client';

import { memo } from 'react';

import { useIsLogin } from '@/hooks/useIsLogin.js';

interface Props {
    loginRequired?: boolean;
}

export default memo<Props>(function AsideTokensSkeleton({ loginRequired }) {
    const isLogin = useIsLogin();
    if (!isLogin && loginRequired) return null;

    return <div className="bg-bg flex h-[386.5px] animate-pulse flex-col gap-2 rounded-xl" />;
});
