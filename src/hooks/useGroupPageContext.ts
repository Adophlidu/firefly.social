'use client';

import { useState } from 'react';
import { createContainer } from 'unstated-next';

import type { ProfileGroup } from '@/providers/types/SocialMedia.js';

interface ChannelPageContext {
    group: ProfileGroup | null;
}

function createEmptyContext(): ChannelPageContext {
    return {
        group: null,
    };
}

function useGroupPageContext(initialState?: ChannelPageContext) {
    const [value, setValue] = useState<ChannelPageContext>(initialState ?? createEmptyContext());

    return {
        ...value,
        update: setValue,
        reset: () => setValue(createEmptyContext()),
    };
}

export const GroupPageContext = createContainer(useGroupPageContext);
