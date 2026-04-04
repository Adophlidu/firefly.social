'use client';

import { type PropsWithChildren } from 'react';

import { ProfileRelationContext } from '@/hooks/useProfileRelationContext.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

export function ProfileRelationContextProvider({
    profile,
    children,
}: PropsWithChildren<{
    profile: Profile;
}>) {
    return <ProfileRelationContext.Provider initialState={{ profile }}>{children}</ProfileRelationContext.Provider>;
}
