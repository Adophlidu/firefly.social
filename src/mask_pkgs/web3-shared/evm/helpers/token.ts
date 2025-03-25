import { getEnumAsArray } from '@masknet/kit';
import Token from '@masknet/web3-constants/evm/token.json' with { type: 'json' };
import { createFungibleTokensFromConstants } from '@masknet/web3-shared-base';

import { ChainId, SchemaType } from '@/mask_pkgs/web3-shared/evm/types/index.js';

export const createERC20Tokens = createFungibleTokensFromConstants<typeof Token, ChainId, SchemaType.ERC20>(
    getEnumAsArray(ChainId),
    SchemaType.ERC20,
    Token,
);
