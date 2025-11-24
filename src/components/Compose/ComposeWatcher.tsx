'use client';

import { memo } from 'react';
import { useMount } from 'react-use';

import { useSearchParams } from '@/esm/navigation.js';
import { openComposeModal } from '@/helpers/openComposeModal.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';

export const ComposeWatcher = memo(function ComposeWatcher() {
    const search = useSearchParams();
    const isLogin = useIsLogin();
    const isMedium = useIsMedium();

    useMount(() => {
        const modal = search.get('modal');
        const text = search.get('text');

        if (!modal || !text || !isLogin || !isMedium) return;

        openComposeModal({
            type: 'compose',
            chars: [text],
        });
    });
    return null;
});
