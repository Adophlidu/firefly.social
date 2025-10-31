'use client';
import { memo } from 'react';

import { useIsLogin } from '@/hooks/useIsLogin.js';

interface Props {
    loginRequired?: boolean;
}
export default memo<Props>(function AsideTokensSkeleton({ loginRequired }) {
    const isLogin = useIsLogin();
    if (!isLogin && loginRequired) return null;

    return <div className="flex h-[372px] animate-pulse flex-col gap-2 rounded-xl bg-bg" />;
});
