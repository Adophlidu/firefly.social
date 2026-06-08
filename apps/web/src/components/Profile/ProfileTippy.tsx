'use client';

import type { TippyProps } from '@tippyjs/react';
import { memo, useState } from 'react';

import { InteractiveTippy } from '@/components/InteractiveTippy.js';
import { ProfileCard } from '@/components/Profile/ProfileCard.js';
import { TippyContext, useTippyContext } from '@/components/TippyContext/index.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useMounted } from '@/hooks/useMounted.js';
import type { FireflyIdentity } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface ProfileTippyProps extends TippyProps {
    className?: string;
    profile?: Profile;
    identity: FireflyIdentity;
}

export const ProfileTippy = memo<ProfileTippyProps>(function ProfileTippy({ identity, profile, children, ...rest }) {
    const isMedium = useIsMedium();
    const isMounted = useMounted();
    const [enabled, setEnabled] = useState(false);

    const insideTippy = useTippyContext();
    if (!isMounted || !isMedium || !children || insideTippy) return children;

    return (
        <TippyContext.Provider value>
            <InteractiveTippy
                maxWidth={350}
                className="tippy-card"
                placement="bottom"
                // Snappier than the shared 1000ms default: show after a short intent delay,
                // hide almost immediately. The small hide delay keeps the card reachable when
                // moving the cursor from the trigger into the interactive popover.
                delay={[300, 100]}
                duration={200}
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
