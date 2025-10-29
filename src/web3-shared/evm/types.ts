// Learn more about ethereum ChainId https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md
export enum EthereumChainId {
    Mainnet = 1,
    Base = 8453,
    BSC = 56,
    Polygon = 137,
    Optimism = 10,
    Arbitrum = 42161,
    xDai = 100,
    Avalanche = 43114,
    Aurora = 1313161554,
    Conflux = 1030,
    Fantom = 250,
    XLayer = 196,
    Metis = 1088,
    Mantle = 5000,
    Zora = 7777777,
    Scroll = 534352,
    Celo = 42220,
    Lens = 232,
    ZksyncEra = 324,
    Linea = 59144,
    Plasma = 9745,
}

export enum EthereumSchemaType {
    Native = 1,
    ERC20 = 2,
    ERC721 = 3,
    ERC1155 = 4,
    SBT = 5,
}

// Learn more for a full list of supported JSON RPC methods
// https://eth.wiki/json-rpc/API#json-rpc-methods
export enum EthereumMethodType {
    FIREFLY_FRAME_SWITCH_WALLET = 'firefly_frameSwitchWallet',

    WATCH_ASSET = 'wallet_watchAsset',
    WATCH_ASSET_LEGACY = 'metamask_watchAsset',
    PERSONAL_SIGN = 'personal_sign',
    // https://eips.ethereum.org/EIPS/eip-3085
    WALLET_ADD_ETHEREUM_CHAIN = 'wallet_addEthereumChain',
    // https://eips.ethereum.org/EIPS/eip-3326
    WALLET_SWITCH_ETHEREUM_CHAIN = 'wallet_switchEthereumChain',
    ETH_CHAIN_ID = 'eth_chainId',
    ETH_ACCOUNTS = 'eth_accounts',
    ETH_REQUEST_ACCOUNTS = 'eth_requestAccounts',
    ETH_SEND_TRANSACTION = 'eth_sendTransaction',
    ETH_SEND_RAW_TRANSACTION = 'eth_sendRawTransaction',
    ETH_GET_CODE = 'eth_getCode',
    ETH_GAS_PRICE = 'eth_gasPrice',
    ETH_GET_BLOCK_BY_NUMBER = 'eth_getBlockByNumber',
    ETH_GET_BLOCK_BY_HASH = 'eth_getBlockByHash',
    ETH_BLOCK_NUMBER = 'eth_blockNumber',
    ETH_GET_BALANCE = 'eth_getBalance',
    ETH_GET_TRANSACTION_BY_HASH = 'eth_getTransactionByHash',
    ETH_GET_TRANSACTION_RECEIPT = 'eth_getTransactionReceipt',
    ETH_GET_TRANSACTION_COUNT = 'eth_getTransactionCount',
    ETH_GET_FILTER_CHANGES = 'eth_getFilterChanges',
    ETH_GET_FILTER_LOGS = 'eth_getFilterLogs',
    ETH_NEW_BLOCK_FILTER = 'eth_newBlockFilter',
    ETH_NEW_FILTER = 'eth_newFilter',
    ETH_NEW_PENDING_TRANSACTION_FILTER = 'eth_newPendingTransactionFilter',
    ETH_UNINSTALL_FILTER = 'eth_uninstallFilter',
    ETH_ESTIMATE_GAS = 'eth_estimateGas',
    ETH_CALL = 'eth_call',
    ETH_SIGN = 'eth_sign',
    ETH_DECRYPT = 'eth_decrypt',
    ETH_SIGN_TYPED_DATA_OLD_V1 = 'eth_signTypedData',
    ETH_SIGN_TYPED_DATA_OLD_V3 = 'eth_signTypedData_v3',
    ETH_SIGN_TYPED_DATA = 'eth_signTypedData_v4',
    ETH_SIGN_TRANSACTION = 'eth_signTransaction',
    ETH_GET_LOGS = 'eth_getLogs',
    ETH_GET_ENCRYPTION_PUBLIC_KEY = 'eth_getEncryptionPublicKey',
    ETH_FEE_HISTORY = 'eth_feeHistory',
    ETH_GET_BLOCK_RECEIPTS = 'eth_getBlockReceipts',
    ETH_GET_BLOCK_TRANSACTION_COUNT_BY_HASH = 'eth_getBlockTransactionCountByHash',
    ETH_GET_BLOCK_TRANSACTION_COUNT_BY_NUMBER = 'eth_getBlockTransactionCountByNumber',
    ETH_GET_PROOF = 'eth_getProof',
    ETH_GET_STORAGE_AT = 'eth_getStorageAt',
    ETH_GET_TRANSACTION_BY_BLOCK_HASH_AND_INDEX = 'eth_getTransactionByBlockHashAndIndex',
    ETH_GET_TRANSACTION_BY_BLOCK_NUMBER_AND_INDEX = 'eth_getTransactionByBlockNumberAndIndex',
    ETH_GET_UNCLE_COUNT_BY_BLOCK_HASH = 'eth_getUncleCountByBlockHash',
    ETH_GET_UNCLE_COUNT_BY_BLOCK_NUMBER = 'eth_getUncleCountByBlockNumber',
    ETH_SYNCING = 'eth_syncing',
    ETH_SUBSCRIBE = 'eth_subscribe',
    ETH_UNSUBSCRIBE = 'eth_unsubscribe',
    NET_VERSION = 'net_version',

    // Explicitly methods for EIP-5792
    EXT_ETH_WALLET_SEND_CALLS = 'wallet_sendCalls',
    EXT_ETH_WALLET_GET_CALLS_STATUS = 'wallet_getCallsStatus',
    EXT_ETH_WALLET_GET_CAPABILITIES = 'wallet_getCapabilities',
}

export enum EthereumNetworkType {
    Ethereum = 'Ethereum',
    Binance = 'Binance',
    Base = 'Base',
    Polygon = 'Polygon',
    Arbitrum = 'Arbitrum',
    xDai = 'xDai',
    Fantom = 'Fantom',
    Aurora = 'Aurora',
    Avalanche = 'Avalanche',
    Metis = 'Metis',
    Mantle = 'Mantle',
    Optimism = 'Optimism',
    Conflux = 'Conflux',
    Astar = 'Astar',
    Scroll = 'Scroll',
    XLayer = 'XLayer',
    Zora = 'Zora',
    Celo = 'Celo',
    ZksyncEra = 'ZksyncEra',
    Linea = 'Linea',
    Plasma = 'Plasma',
}
export interface Web3Definition {
    ChainId: EthereumChainId;
    SchemaType: EthereumSchemaType;
    NetworkType: EthereumNetworkType;
}
