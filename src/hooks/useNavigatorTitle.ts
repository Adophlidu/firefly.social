'use client';

import type { MessageDescriptor } from '@lingui/core';
import { useLingui } from '@lingui/react';
import { useEffect } from 'react';

import { useNavigatorState } from '@/store/useNavigatorStore.js';

export function useNavigatorTitle(descriptor: MessageDescriptor) {
    const lingui = useLingui();
    const updateTitle = useNavigatorState.use.updateTitle();

    useEffect(() => {
        if (descriptor) updateTitle(lingui.i18n._(descriptor));
        return () => updateTitle('');
    }, [lingui, descriptor, updateTitle]);
}
