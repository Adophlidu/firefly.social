'use client';

import { memo, useEffect, useRef } from 'react';

import { AsyncStatus } from '@/constants/enum.js';
import { useSearchParams } from '@/esm/navigation.js';
import { openComposeModal } from '@/helpers/openComposeModal.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';

export const ComposeWatcher = memo(function ComposeWatcher() {
    const search = useSearchParams();
    const isLogin = useIsLogin();
    const isMedium = useIsMedium();
    const isLoading = useAsyncStatusAll(AsyncStatus.Pending);
    const processedParamsRef = useRef<string | null>(null);

    useEffect(() => {
        if (isLoading) return;

        const modal = search.get('modal');
        const text = search.get('text');
        const paramsKey = `${modal}-${text}`;
        if (processedParamsRef.current === paramsKey) return;

        if (!modal || !text || !isLogin || !isMedium) return;
        processedParamsRef.current = paramsKey;

        openComposeModal({
            type: 'compose',
            chars: [text],
        });
    }, [isLoading, isLogin, isMedium, search]);

    return null;
});
