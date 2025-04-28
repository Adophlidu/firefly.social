import { first } from 'lodash-es';

import { THE_GRAPH_API_URL } from '@/constants/index.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import type { DomainAPI } from '@/mask_pkgs/web3-providers/types/DomainAPI.js';
import { EthereumChainId } from '@/mask_pkgs/web3-shared/evm/types/index.js';

class TheGraphDomainAPI implements DomainAPI.Provider<EthereumChainId> {
    async lookup(chainId: EthereumChainId, name: string): Promise<string | undefined> {
        const response = await fetchJSON<{
            data: {
                domains: Array<{
                    name: string;
                    labelName: string;
                    resolvedAddress: {
                        id: string;
                    };
                }>;
            };
        }>(THE_GRAPH_API_URL, {
            method: 'POST',
            body: JSON.stringify({
                query: `{
                    domains(where: { name: "${name}" }) {
                        name
                        labelName
                        resolvedAddress {
                          id
                        }
                    }
                  }`,
            }),
        });

        return first(response.data.domains)?.resolvedAddress.id;
    }
    async reverse(chainId: EthereumChainId, address: string): Promise<string | undefined> {
        const response = await fetchJSON<{
            data: {
                domains: Array<{
                    name: string;
                    labelName: string;
                }>;
            };
        }>(THE_GRAPH_API_URL, {
            method: 'POST',
            body: JSON.stringify({
                query: `{
                    domains(where: { owner: "${address}", resolvedAddress: "${address}" }, orderBy: createdAt) {
                      name
                      labelName
                    }
                  }`,
            }),
        });

        return first(response.data.domains)?.name;
    }
}
export const TheGraphDomain = new TheGraphDomainAPI();
