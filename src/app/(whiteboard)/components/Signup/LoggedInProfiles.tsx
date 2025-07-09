import { motion } from 'framer-motion';
import { Fragment } from 'react';

import { ProfileSourceIcon } from '@/components/ProfileSourceIcon.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { formatThirdPartyProfileName } from '@/helpers/formatThirdPartyProfileName.js';
import { useProfileStoreAll } from '@/hooks/useProfileStore.js';
import { useThirdPartyStateStore } from '@/store/useProfileStore.js';

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

export function LoggedInProfilesThirdParty() {
    const { accounts } = useThirdPartyStateStore();

    if (!accounts.length) return null;

    return (
        <Fragment>
            {accounts.map((account) => (
                <motion.button
                    key={`${account.profile.profileSource}-${account.profile.profileId}`}
                    whileTap={{ scale: 0.95 }}
                    style={{ backgroundColor: 'rgba(94, 105, 255, 0.50)' }}
                    className="flex items-center rounded-3xl p-3"
                >
                    <ProfileSourceIcon source={account.profile.profileSource} size={20} />
                    <span className="ml-2 mr-4 text-base font-medium text-white">
                        {formatThirdPartyProfileName(account.profile) || '-'}
                    </span>
                </motion.button>
            ))}
        </Fragment>
    );
}
