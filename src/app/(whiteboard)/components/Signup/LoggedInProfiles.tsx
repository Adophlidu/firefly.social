import { motion } from 'framer-motion';
import { Fragment } from 'react';

import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { useProfileStoreAll } from '@/hooks/useProfileStore.js';

interface LoggedInProfilesProps {
    source: SocialSource;
}

const bgColor: Record<SocialSource, string> = {
    [Source.Lens]: '#00B641',
    [Source.Farcaster]: '#855DCD',
    [Source.Twitter]: '#000000',
    [Source.Bsky]: '#0A7AFF',
};

export function LoggedInProfiles({ source }: LoggedInProfilesProps) {
    const profileStore = useProfileStoreAll();
    const accounts = profileStore[source]?.accounts;

    if (!accounts?.length) return null;

    return (
        <Fragment>
            {accounts.map((account) => (
                <motion.button
                    key={`${account.profile.source}-${account.profile.profileId}`}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center rounded-3xl p-3"
                    style={{ backgroundColor: bgColor[source] }}
                >
                    <SocialSourceIcon colorful mono source={source} />
                    <span className="ml-2 mr-4 text-base font-medium text-white">@{account.profile.handle || '-'}</span>
                </motion.button>
            ))}
        </Fragment>
    );
}
