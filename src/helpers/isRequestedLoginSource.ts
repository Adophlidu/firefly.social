import { REQUIRE_LOGIN_SOURCES } from '@/constants/index.js';
import type { RequestedLoginSource } from '@/constants/enum.js';

export function isRequestedLoginSource(source: string): source is RequestedLoginSource {
    return REQUIRE_LOGIN_SOURCES.includes(source as RequestedLoginSource);
}
