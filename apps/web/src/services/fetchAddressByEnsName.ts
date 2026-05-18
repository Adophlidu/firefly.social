import { EnsNameSource } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';

import { resolveAddressFromProfile } from '@/helpers/resolveAddressFromProfile.js';
import { searchIdentity } from '@/providers/firefly/endpoint/searchIdentity.js';
import { lookup } from '@/services/ens.js';

async function searchAddressByEnsName(ensName: string, nameSource: EnsNameSource) {
    const identitiesData = await searchIdentity(ensName, { web3Platforms: [nameSource] });
    const identity = identitiesData?.data
        ?.flatMap((x) => {
            switch (nameSource) {
                case EnsNameSource.Eth:
                    return x.ens || [];
                case EnsNameSource.Base:
                    return x['base.eth'] || [];
                case EnsNameSource.Skr:
                    return x.skr || [];
                case EnsNameSource.Sns:
                    return x.sns || [];
                default:
                    safeUnreachable(nameSource);
                    return [];
            }
        })
        .find((x) => x.hit && x.handle?.toLowerCase() === ensName?.toLowerCase());
    return identity ? resolveAddressFromProfile(identity) : null;
}

export async function fetchAddressByEnsName(ensName: string, nameSource: EnsNameSource) {
    switch (nameSource) {
        case EnsNameSource.Eth:
            return lookup(ensName);
        case EnsNameSource.Base:
        case EnsNameSource.Skr:
        case EnsNameSource.Sns:
            return searchAddressByEnsName(ensName, nameSource);
        default:
            safeUnreachable(nameSource);
            return null;
    }
}
