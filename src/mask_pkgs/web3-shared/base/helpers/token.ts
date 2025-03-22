import { keyBy, mapValues } from 'lodash-es';
import { type FungibleToken } from '../specs/index.js';
import type { Constants } from './types.js';
import { TokenType } from '@/constants/enum.js';

export function createFungibleToken<ChainId, SchemaType>(
    chainId: ChainId,
    schema: SchemaType,
    address: string,
    name: string,
    symbol: string,
    decimals: number,
    logoURL?: string,
): FungibleToken<ChainId, SchemaType> {
    return {
        chainId,
        type: TokenType.Fungible,
        schema,
        id: address,
        address,
        name,
        symbol,
        decimals,
        logoURL,
    };
}

export function createFungibleTokensFromConstants<T extends Constants<string>, ChainId extends number, SchemaType>(
    chainIds: Array<{
        key: string;
        value: ChainId;
    }>,
    schema: SchemaType,
    constants: T,
) {
    return (
        key: keyof T,
        name: string | ((chainId: ChainId) => string),
        symbol: string | ((chainId: ChainId) => string),
        decimals: number | ((chainId: ChainId) => number),
    ) => {
        const chainIdGroup = keyBy(chainIds, 'value');
        return mapValues(chainIdGroup, ({ key: chainName, value: chainId }) => {
            function evaluator<R extends string | number>(f: ((chainId: ChainId) => R) | R): R {
                return typeof f === 'function' ? f(chainId) : f;
            }

            return createFungibleToken<ChainId, SchemaType>(
                chainId,
                schema,
                constants[key][chainName as 'Mainnet'] ?? '',
                evaluator(name),
                evaluator(symbol),
                evaluator(decimals),
            );
        });
    };
}
