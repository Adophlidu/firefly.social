import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';

import AddIcon from '@/assets/add-small.svg';
import OtherIcon from '@/assets/other.svg';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { type SocialSource } from '@/constants/enum.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { LoginModalRef } from '@/modals/LoginModal/index.js';

interface LoginButtonProps {
    source: SocialSource | 'other';
}

export function LoginButton({ source }: LoginButtonProps) {
    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex items-center rounded-3xl p-3"
            style={{ backgroundColor: 'rgba(124, 127, 163, 0.06)' }}
            onClick={() => {
                if (source === 'other') {
                    LoginModalRef.open({ options: { hideSocialLogin: true, skipWaitForMetricsSyncing: false } });
                    return;
                }

                LoginModalRef.open({ source, options: { noBackButton: true, skipWaitForMetricsSyncing: false } });
            }}
        >
            {source === 'other' ? (
                <span className="flex size-6 items-center justify-center rounded-full bg-[#5E69FF]">
                    <OtherIcon />
                </span>
            ) : (
                <SocialSourceIcon colorful source={source} />
            )}
            <span className="ml-2 mr-4 text-base font-medium text-[#171717]">
                {source === 'other' ? <Trans>Others</Trans> : resolveSourceName(source)}
            </span>
            <span className="flex size-6 items-center justify-center rounded-full bg-white">
                <AddIcon />
            </span>
        </motion.button>
    );
}
