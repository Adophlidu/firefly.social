'use client';

import type { PropsWithChildren } from 'react';

import { GroupPageContext } from '@/hooks/useGroupPageContext.js';
import type { ProfileGroup } from '@/providers/types/SocialMedia.js';

export function GroupPageProvider({ group, children }: PropsWithChildren<{ group: ProfileGroup | null }>) {
    return <GroupPageContext.Provider initialState={{ group }}>{children}</GroupPageContext.Provider>;
}
