import { EthereumChainId, EthereumSchemaType } from '@masknet/web3-shared-evm';

import type { NonFungibleCollection } from '@/mask_pkgs/web3-shared/base/index.js';

export type Collection = NonFungibleCollection<EthereumChainId, EthereumSchemaType>;
