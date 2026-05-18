import type { RequestedLoginSource } from '@dimensiondev/enums';

import { REQUIRE_LOGIN_SOURCES } from '@/constants/static.js';

export function isRequestedLoginSource(source: string): source is RequestedLoginSource {
    return REQUIRE_LOGIN_SOURCES.includes(source as RequestedLoginSource);
}
