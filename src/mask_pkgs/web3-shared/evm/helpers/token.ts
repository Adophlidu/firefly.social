import { getEnumAsArray } from '@masknet/kit';
import Token from '@masknet/web3-constants/evm/token.json' with { type: 'json' };

import { createFungibleTokensFromConstants } from '@/mask_pkgs/web3-shared/base/index.js';
import { EthereumChainId, EthereumSchemaType } from '@/mask_pkgs/web3-shared/evm/types/index.js';

export const createERC20Tokens = createFungibleTokensFromConstants<
    typeof Token,
    EthereumChainId,
    EthereumSchemaType.ERC20
>(getEnumAsArray(EthereumChainId), EthereumSchemaType.ERC20, Token);
