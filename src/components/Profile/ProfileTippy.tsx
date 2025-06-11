'use client';

import { memo, useState } from 'react';

import { InteractiveTippy, type InteractiveTippyProps } from '@/components/InteractiveTippy.js';
import { ProfileCard } from '@/components/Profile/ProfileCard.js';
import { TippyContext, useTippyContext } from '@/components/TippyContext/index.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import type { FireflyIdentity } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface ProfileTippyProps extends InteractiveTippyProps {
    className?: string;
    profile?: Profile;
    identity: FireflyIdentity;
}

export const ProfileTippy = memo<ProfileTippyProps>(function ProfileTippy({ identity, profile, children, ...rest }) {
    const isMedium = useIsMedium();
    const [enabled, setEnabled] = useState(false);

    const insideTippy = useTippyContext();
    if (!isMedium || !children || insideTippy) return children;

    return (
        <TippyContext.Provider value>
            <InteractiveTippy
                maxWidth={350}
                className="tippy-card"
                placement="bottom"
                onOpenChange={setEnabled}
                onTrigger={() => {
                    setEnabled(true);
                }}
                content={enabled ? <ProfileCard identity={identity} defaultProfile={profile} /> : null}
                {...rest}
            >
                {children}
            </InteractiveTippy>
        </TippyContext.Provider>
    );
});
