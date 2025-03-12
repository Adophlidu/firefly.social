import { useQueries } from '@tanstack/react-query';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';
import { useConfig } from 'wagmi';
import { getEnsAddress } from 'wagmi/actions';
import { getEnsAddressQueryKey } from 'wagmi/query';

export function useResolveEnsDomains(domains: string[]) {
    const config = useConfig();

    return useQueries({
        queries: config
            ? domains.map((domain) => {
                  const options = { chainId: mainnet.id, name: normalize(domain) };
                  return {
                      queryKey: getEnsAddressQueryKey(options),
                      queryFn: () => getEnsAddress(config, options),
                  };
              })
            : [],
    });
}
