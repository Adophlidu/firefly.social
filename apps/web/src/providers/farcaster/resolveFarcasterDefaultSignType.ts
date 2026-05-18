import { FarcasterSignType } from '@dimensiondev/enums';

export function resolveFarcasterDefaultSignType(count?: number) {
    if (typeof count !== 'number') return FarcasterSignType.RelayService;
    return (count ?? 0) > 0 ? FarcasterSignType.RelayService : FarcasterSignType.FireflySponsorship;
}
