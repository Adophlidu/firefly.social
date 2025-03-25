'use client';

import SettingIcon from '@/assets/setting.svg';
import { Link } from '@/components/Link.js';
import { PageRoute } from '@/constants/enum.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function SettingButton({ profile }: { profile: Profile }) {
    return (
        <Link
            href={PageRoute.SettingConnected}
            className="inline-flex size-8 items-center justify-center rounded-lg bg-lightBg text-second active:opacity-50 md:hover:opacity-60"
        >
            <SettingIcon />
        </Link>
    );
}
