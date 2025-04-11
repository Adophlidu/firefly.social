'use client';

import type { MessageDescriptor } from '@lingui/core';
import { useEffect } from 'react';

import { getLocalFromClientCookies } from '@/helpers/getCookies.js';
import { getI18n } from '@/i18n/index.js';
import { useNavigatorState } from '@/store/useNavigatorStore.js';

export function useNavigatorTitle(descriptor: MessageDescriptor) {
    const updateTitle = useNavigatorState.use.updateTitle();

    useEffect(() => {
        if (descriptor) {
            const locale = getLocalFromClientCookies();
            const { t } = getI18n(locale);
            updateTitle(t(descriptor));
        }
        return () => updateTitle('');
    }, [descriptor, updateTitle]);
}
