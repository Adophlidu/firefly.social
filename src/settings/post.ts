import { envs, STATUS } from '@dimensiondev/envs';

import { SUPPORTED_ANONYMOUS_POST_SOURCES } from '@/constants/computed.js';
import { type SocialSource } from '@/constants/enum.js';

export const postFeatures = {
    anonymousPost(source?: SocialSource | null) {
        return (
            envs.external.NEXT_PUBLIC_POST_BY_ANONYMOUS === STATUS.Enabled &&
            (!source || SUPPORTED_ANONYMOUS_POST_SOURCES.includes(source))
        );
    },
};
