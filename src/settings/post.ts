import { SUPPORTED_ANONYMOUS_POST_SOURCES } from '@/constants/computed.js';
import { type SocialSource, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';

export const postFeatures = {
    anonymousPost(source?: SocialSource | null) {
        return (
            env.external.NEXT_PUBLIC_POST_BY_ANONYMOUS === STATUS.Enabled &&
            (!source || SUPPORTED_ANONYMOUS_POST_SOURCES.includes(source))
        );
    },
};
