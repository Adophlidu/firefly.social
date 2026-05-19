import { SUPPORTED_ANONYMOUS_POST_SOURCES } from '@dimensiondev/constants/computed';
import type { SocialSource } from '@dimensiondev/enums';
import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs';

export const postFeatures = {
    anonymousPost(source?: SocialSource | null) {
        return (
            envs.external.NEXT_PUBLIC_POST_BY_ANONYMOUS === STATUS.Enabled &&
            (!source || SUPPORTED_ANONYMOUS_POST_SOURCES.includes(source))
        );
    },
};
