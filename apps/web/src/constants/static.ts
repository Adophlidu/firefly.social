import { SITE_URL_OFFICIAL } from '@dimensiondev/constants/static';
import type { RequestedLoginSource, SocialSource } from '@dimensiondev/enums';
import { NODE_ENV, Source, STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';

export const SITE_URL = envs.external.NEXT_PUBLIC_SITE_URL ?? SITE_URL_OFFICIAL;

export const MAX_POST_SIZE_PER_THREAD = envs.shared.NODE_ENV === NODE_ENV.Development ? 10 : 25;

export const REQUIRE_LOGIN_SOURCES: RequestedLoginSource[] =
    envs.external.NEXT_PUBLIC_NITTER === STATUS.Enabled ? [] : [Source.Twitter];
export const REQUIRE_LOGIN_SOURCES_IN_SEARCH: SocialSource[] =
    envs.external.NEXT_PUBLIC_NITTER === STATUS.Enabled ? [Source.Bsky] : [Source.Twitter, Source.Bsky];
