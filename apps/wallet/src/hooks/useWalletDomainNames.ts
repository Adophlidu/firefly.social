import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function useWalletDomainNames(evmAddress?: string | null, solanaAddress?: string | null) {
    const { data: evmProfiles } = useQuery({
        queryKey: ['walletDomainName', 'evm', evmAddress],
        queryFn: () => getFireflyEndpoint().getWalletProfileInfo({ walletAddress: evmAddress! }),
        enabled: !!evmAddress,
        staleTime: 1000 * 60 * 30,
    });

    const { data: solanaProfiles } = useQuery({
        queryKey: ['walletDomainName', 'solana', solanaAddress],
        queryFn: () => getFireflyEndpoint().getWalletProfileInfo({ solanaAddress: solanaAddress! }),
        enabled: !!solanaAddress,
        staleTime: 1000 * 60 * 30,
    });

    const domainNameMap = useMemo(() => {
        const map = new Map<string, string>();

        if (evmProfiles?.walletProfiles) {
            for (const profile of evmProfiles.walletProfiles) {
                if (profile.primary_ens && profile.address) {
                    map.set(profile.address.toLowerCase(), profile.primary_ens);
                }
            }
        }

        if (solanaProfiles?.solanaWalletProfiles) {
            for (const profile of solanaProfiles.solanaWalletProfiles) {
                if (profile.primary_ens && profile.address) {
                    map.set(profile.address, profile.primary_ens);
                }
            }
        }

        return map;
    }, [evmProfiles, solanaProfiles]);

    return domainNameMap;
}
