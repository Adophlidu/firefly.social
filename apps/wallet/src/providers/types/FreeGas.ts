export enum FreeGasTxType {
    TokenApprove = 'token_approve',
    PolymarketDeposit = 'polymarket_deposit',
    RedpacketSend = 'redpacket_send',
    TokenTransfer = 'token_transfer',
}

export interface FreeGasTx {
    data: string;
    from: string;
    gas: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    to: string;
    value: string;
}

export interface FreeGasRequestBody {
    txId: string;
    chainId: number;
    txType: FreeGasTxType;
    nonce: number;
    tx: FreeGasTx;
    privy_code_hash?: string;
}

export interface FreeGasResponse {
    canFreeGas: boolean;
    hash: string;
    failedReason: string;
}
