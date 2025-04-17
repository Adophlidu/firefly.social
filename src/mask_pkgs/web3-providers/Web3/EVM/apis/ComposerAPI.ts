import type { ConnectionContext } from '@/mask_pkgs/web3-providers/Web3/EVM/libs/ConnectionContext.js';
import { Nonce } from '@/mask_pkgs/web3-providers/Web3/EVM/middleware/Nonce.js';
import { Composer as EVMComposer } from '#masknet/web3-shared-evm';

let instance: EVMComposer<ConnectionContext> | undefined;

export class Composer {
    static compose() {
        if (instance) return instance;
        instance = EVMComposer.from<ConnectionContext>(Nonce);
        return instance;
    }
}
