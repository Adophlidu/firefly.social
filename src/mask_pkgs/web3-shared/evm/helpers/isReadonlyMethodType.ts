import { EthereumMethodType } from '@/mask_pkgs/web3-shared/evm/types/index.js';

const READONLY_METHOD_TYPE = [
    EthereumMethodType.NET_VERSION,
    EthereumMethodType.ETH_BLOCK_NUMBER,
    EthereumMethodType.ETH_CALL,
    EthereumMethodType.ETH_ESTIMATE_GAS,
    EthereumMethodType.ETH_FEE_HISTORY,
    EthereumMethodType.ETH_GAS_PRICE,
    EthereumMethodType.ETH_GET_BALANCE,
    EthereumMethodType.ETH_GET_BLOCK_BY_HASH,
    EthereumMethodType.ETH_GET_BLOCK_BY_NUMBER,
    EthereumMethodType.ETH_GET_BLOCK_RECEIPTS,
    EthereumMethodType.ETH_GET_BLOCK_TRANSACTION_COUNT_BY_HASH,
    EthereumMethodType.ETH_GET_BLOCK_TRANSACTION_COUNT_BY_NUMBER,
    EthereumMethodType.ETH_GET_CODE,
    EthereumMethodType.ETH_GET_FILTER_CHANGES,
    EthereumMethodType.ETH_GET_LOGS,
    EthereumMethodType.ETH_GET_PROOF,
    EthereumMethodType.ETH_GET_STORAGE_AT,
    EthereumMethodType.ETH_GET_TRANSACTION_BY_BLOCK_HASH_AND_INDEX,
    EthereumMethodType.ETH_GET_TRANSACTION_BY_BLOCK_NUMBER_AND_INDEX,
    EthereumMethodType.ETH_GET_TRANSACTION_BY_HASH,
    EthereumMethodType.ETH_GET_TRANSACTION_COUNT,
    EthereumMethodType.ETH_GET_TRANSACTION_RECEIPT,
    EthereumMethodType.ETH_GET_UNCLE_COUNT_BY_BLOCK_HASH,
    EthereumMethodType.ETH_GET_UNCLE_COUNT_BY_BLOCK_NUMBER,
    EthereumMethodType.ETH_NEW_PENDING_TRANSACTION_FILTER,
    EthereumMethodType.ETH_SYNCING,
] as const;

export function isReadonlyMethodType(type: EthereumMethodType) {
    return (READONLY_METHOD_TYPE as readonly EthereumMethodType[]).includes(type);
}
