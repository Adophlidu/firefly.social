'use client';

import { useState } from 'react';
import { createContainer } from 'unstated-next';

import type { Profile } from '@/providers/types/SocialMedia.js';

interface ProfileRelationContext {
    profile: Profile | null;
}

function createEmptyContext(): ProfileRelationContext {
    return {
        profile: null,
    };
}

function useProfileRelationContext(initialState?: ProfileRelationContext) {
    const [value, setValue] = useState<ProfileRelationContext>(initialState ?? createEmptyContext());

    return {
        ...value,
        update: setValue,
        reset: () => setValue(createEmptyContext()),
    };
}

export const ProfileRelationContext = createContainer(useProfileRelationContext);
