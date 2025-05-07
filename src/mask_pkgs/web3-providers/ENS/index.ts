import { NameServiceID } from '@/constants/enum.js';
import { attemptUntil } from '@/helpers/attemptUntil.js';
import { ChainbaseDomain } from '@/mask_pkgs/web3-providers/Chainbase/DomainAPI.js';
import { R2D2Domain } from '@/mask_pkgs/web3-providers/R2D2/DomainAPI.js';
import { TheGraphDomain } from '@/mask_pkgs/web3-providers/TheGraph/DomainAPI.js';
import type { NameServiceAPI } from '@/mask_pkgs/web3-providers/types/NameService.js';
import { Unstoppable } from '@/mask_pkgs/web3-providers/Unstoppable/DomainAPI.js';
import { EthereumChainId } from '@/mask_pkgs/web3-shared/evm/types/index.js';

class ENS_API implements NameServiceAPI.Provider {
    readonly id = NameServiceID.ENS;

    async lookup(name: string) {
        return attemptUntil(
            [ChainbaseDomain, Unstoppable, TheGraphDomain].map((x) => () => x.lookup(EthereumChainId.Mainnet, name)),
            undefined,
        );
    }

    async reverse(address: string) {
        return attemptUntil(
            [ChainbaseDomain, R2D2Domain, TheGraphDomain].map((x) => () => x.reverse(EthereumChainId.Mainnet, address)),
            undefined,
            undefined,
            true,
        );
    }
}
export const ENS = new ENS_API();
