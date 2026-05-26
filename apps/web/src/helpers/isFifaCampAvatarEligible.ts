import type { FifaCampAccountInfo } from '@/providers/types/Firefly.js';

export function isFifaCampAvatarEligible(info?: FifaCampAccountInfo | null) {
    return !!info?.joined && !!info.country_logo?.trim();
}

export function getFifaCampAvatarFromInfo(info?: FifaCampAccountInfo | null) {
    if (!isFifaCampAvatarEligible(info)) return undefined;
    return {
        countryCode: info!.country_code!,
        flagUrl: info!.country_logo!.trim(),
    };
}
