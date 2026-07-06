import { EthereumMethodType } from '@dimensiondev/web3/enums';
import { isValidAddressEthereum as isAddress } from '@dimensiondev/web3/utils';
import type { Address, Hex } from 'viem';

import type { RequestArguments } from '@/types/ethereum.js';

interface Call {
    to?: Hex; // allow contract creation if omitted
    data?: Hex;
    value?: Hex;
    from?: Address;
    gas?: Hex;
    gasPrice?: Hex;
    maxFeePerGas?: Hex;
    maxPriorityFeePerGas?: Hex;
}

interface SendCallsParams {
    version?: string;
    from?: Address;
    calls: Call[];
    chainId?: Hex;
    atomicRequired?: boolean;
    capabilities?: Record<string, { supported?: boolean }>;
}

interface InternalReceiptLog {
    address: Address;
    topics: Hex[];
    data: Hex;
    blockNumber?: Hex;
    transactionHash?: Hex;
    transactionIndex?: Hex;
    blockHash?: Hex;
    logIndex?: Hex;
}

interface InternalReceipt {
    transactionHash: Hex;
    transactionIndex: Hex;
    blockHash: Hex;
    blockNumber: Hex;
    from: Address;
    to?: Address;
    gasUsed: Hex;
    effectiveGasPrice?: Hex;
    contractAddress?: Address | null;
    logs: InternalReceiptLog[];
    status: Hex; // '0x1' for success, '0x0' for failure
}

interface CallStatus {
    status: 'pending' | 'confirmed';
    transactionHash?: Hex;
    effectiveGasPrice?: Hex;
    receipt?: InternalReceipt;
}

interface CallStatusResponse {
    version: string;
    id: string;
    status: number; // 0=pending, 1=success, 2=failed
    atomic: boolean;
    receipts?: InternalReceipt[];
}

interface WalletCapabilities {
    [chainId: Hex]: {
        atomicBatch: {
            status: 'supported' | 'ready' | 'unsupported';
        };
        paymasterService?: {
            supported: boolean;
        };
        [capabilityName: string]: Record<string, boolean | string> | undefined;
    };
}

interface JsonRpcError extends Error {
    code: number;
    data?: unknown;
}

interface RpcTransactionReceiptLog {
    address: Address;
    topics: Hex[];
    data: Hex;
    blockNumber?: Hex;
    transactionHash?: Hex;
    transactionIndex?: Hex;
    blockHash?: Hex;
    logIndex?: Hex;
}

interface RpcTransactionReceipt {
    transactionHash: Hex;
    transactionIndex: Hex;
    blockHash: Hex;
    blockNumber: Hex;
    from: Address;
    to?: Address;
    gasUsed: Hex;
    effectiveGasPrice?: Hex;
    contractAddress?: Address | null;
    logs?: RpcTransactionReceiptLog[];
    status: Hex;
}

type CallRecord = Record<(typeof CALL_HEX_FIELDS)[number], unknown> & {
    to?: unknown;
    from?: unknown;
};

type SendCallsParamsRecord = Record<string, unknown> & {
    calls?: unknown;
    from?: unknown;
    chainId?: unknown;
    atomicRequired?: unknown;
};

const CALL_HEX_FIELDS = ['data', 'value', 'gas', 'gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas'] as const;

// In-memory storage for tracking call batches
const callBatches = new Map<
    string,
    { calls: Call[]; chainIds: Hex[]; statuses: CallStatus[]; createdAt: number; version?: string }
>();

// JSON-RPC error helper
function makeJsonRpcError(code: number, message: string, data?: unknown): JsonRpcError {
    const err = new Error(message) as JsonRpcError;
    err.code = code;
    if (data !== undefined) err.data = data;
    return err;
}

function isHex(value: unknown): value is Hex {
    return typeof value === 'string' && /^0x[0-9a-fA-F]*$/.test(value);
}

function isCall(x: unknown): x is Call {
    if (!x || typeof x !== 'object') return false;
    const c = x as CallRecord;
    if (c.to !== undefined && (typeof c.to !== 'string' || !isAddress(c.to))) return false;
    if (c.from !== undefined && (typeof c.from !== 'string' || !isAddress(c.from))) return false;

    for (const k of CALL_HEX_FIELDS) {
        if (c[k] !== undefined && !isHex(c[k])) return false;
    }

    return true;
}

function isSendCallsParams(x: unknown): x is SendCallsParams {
    if (!x || typeof x !== 'object') return false;
    const p = x as SendCallsParamsRecord;
    if (!Array.isArray(p.calls)) return false;
    if (p.from !== undefined && (typeof p.from !== 'string' || !isAddress(p.from))) return false;
    if (p.chainId !== undefined && !isHex(p.chainId)) return false;
    if (p.atomicRequired !== undefined && typeof p.atomicRequired !== 'boolean') return false;
    return p.calls.every(isCall);
}

type RequestHandler = (requestArguments: RequestArguments) => Promise<unknown>;

/**
 * EIP-5792 Polyfill for wallets that don't support batch transaction operations
 * This provides fallback implementations for EIP-5792 methods by converting them to individual transactions
 */
export function eip5792Polyfill(requestHandler: RequestHandler) {
    return async function polyfilledRequest(requestArguments: RequestArguments): Promise<unknown> {
        const { method, params = [] } = requestArguments;

        switch (method) {
            case EthereumMethodType.EXT_ETH_WALLET_GET_CAPABILITIES:
                return handleGetCapabilities(params as Array<`0x${string}`>);
            case EthereumMethodType.EXT_ETH_WALLET_SEND_CALLS:
                return handleSendCalls(params, requestHandler);
            case EthereumMethodType.EXT_ETH_WALLET_GET_CALLS_STATUS:
                return handleGetCallsStatus(params[0] as string, requestHandler);
            default:
                return requestHandler(requestArguments);
        }
    };
}

/**
 * Handles wallet_getCapabilities - returns supported capabilities
 */
function handleGetCapabilities(chainIds: Hex[]): WalletCapabilities {
    const capabilities: WalletCapabilities = {};

    for (const chainId of chainIds) {
        capabilities[chainId] = {
            atomicBatch: { status: 'unsupported' },
            paymasterService: { supported: false },
        };
    }

    return capabilities;
}

/**
 * Handles wallet_sendCalls - converts batch calls to individual transactions
 */
async function handleSendCalls(params: unknown[], requestHandler: RequestHandler): Promise<string> {
    if (!params || params.length === 0) {
        throw makeJsonRpcError(32602, 'No parameters provided for wallet_sendCalls');
    }

    // Parse and validate parameters (support multiple parameter objects)
    const parsedParams: SendCallsParams[] = [];
    for (const p of params) {
        if (!isSendCallsParams(p)) {
            throw makeJsonRpcError(32602, 'Invalid params for wallet_sendCalls');
        }
        parsedParams.push(p);
    }

    // Collect calls and metadata
    const callItems: Array<{ call: Call; chainId: Hex; paramFrom?: Address }> = [];
    let atomicRequired = false;
    let globalFrom: Address | undefined;
    let version: string | undefined;

    // Fetch current chain as default if chainId omitted
    const currentChainId = (await requestHandler({
        method: EthereumMethodType.ETH_CHAIN_ID,
        params: [],
    })) as Hex;

    for (const param of parsedParams) {
        if (!Array.isArray(param.calls) || param.calls.length === 0) {
            throw makeJsonRpcError(32602, 'Invalid params: calls must be a non-empty array');
        }
        if (param.atomicRequired) atomicRequired = true;
        if (!version && param.version) version = param.version;
        if (!globalFrom && param.from) globalFrom = param.from;

        const chainIdForParam: Hex = param.chainId ?? (currentChainId as Hex);

        for (const call of param.calls) {
            // Validate required fields per-call (allow contract creation if no `to` but require data)
            if (!call.to && !call.data) {
                throw makeJsonRpcError(32602, 'Invalid call: missing both to and data');
            }
            if (call.to && !isAddress(call.to)) {
                throw makeJsonRpcError(32602, 'Invalid call: to must be a 20-byte hex address');
            }
            callItems.push({ call, chainId: chainIdForParam, paramFrom: param.from });
        }
    }

    // Check if atomic batch is required but not supported
    if (atomicRequired) {
        throw makeJsonRpcError(5760, 'Atomic batch execution is not supported');
    }

    const batchId = generateBatchId();

    // Initialize batch tracking with all calls
    callBatches.set(batchId, {
        calls: callItems.map((i) => i.call),
        chainIds: callItems.map((i) => i.chainId),
        statuses: callItems.map(() => ({ status: 'pending' as const })),
        createdAt: Date.now(),
        version,
    });

    try {
        // Prepare mutable statuses to update by index as we send transactions
        const batch = callBatches.get(batchId);
        if (!batch) throw makeJsonRpcError(-32603, 'Internal error: batch not initialized');

        // Group calls by chainId to minimize switches
        const groups = new Map<
            Hex,
            Array<{ index: number; item: { call: Call; chainId: Hex; paramFrom?: Address } }>
        >();
        callItems.forEach((item, index) => {
            const arr = groups.get(item.chainId) ?? [];
            arr.push({ index, item });
            groups.set(item.chainId, arr);
        });

        // Current chain id, switch as needed
        let activeChainId = currentChainId;

        for (const [chainId, entries] of groups.entries()) {
            if (activeChainId !== chainId) {
                await requestHandler({
                    method: EthereumMethodType.WALLET_SWITCH_ETHEREUM_CHAIN,
                    params: [{ chainId }],
                });
                activeChainId = chainId;
            }

            for (const { index, item } of entries) {
                const { call, paramFrom } = item;

                // Resolve from: call.from > param.from > globalFrom > eth_accounts[0]
                let effectiveFrom = call.from ?? paramFrom ?? globalFrom;
                if (!effectiveFrom) {
                    const accounts = (await requestHandler({
                        method: EthereumMethodType.ETH_ACCOUNTS,
                        params: [],
                    })) as string[];
                    if (accounts?.[0] && isAddress(accounts[0])) {
                        effectiveFrom = accounts[0] as Address;
                    }
                }
                if (!effectiveFrom) {
                    throw makeJsonRpcError(32602, 'Missing from address for call');
                }

                const transactionParams: Record<string, unknown> = {
                    from: effectiveFrom,
                    ...(call.to ? { to: call.to } : {}),
                    data: call.data ?? ('0x' as Hex),
                    value: call.value ?? ('0x0' as Hex),
                };
                if (call.gas) transactionParams.gas = call.gas;
                if (call.gasPrice) transactionParams.gasPrice = call.gasPrice;
                if (call.maxFeePerGas) transactionParams.maxFeePerGas = call.maxFeePerGas;
                if (call.maxPriorityFeePerGas) transactionParams.maxPriorityFeePerGas = call.maxPriorityFeePerGas;

                const txHash = (await requestHandler({
                    method: EthereumMethodType.ETH_SEND_TRANSACTION,
                    params: [transactionParams],
                })) as Hex;
                // Update status mapping for the correct call index
                batch.statuses[index] = {
                    status: 'pending',
                    transactionHash: txHash,
                };
            }
        }

        return batchId;
    } catch (error) {
        // Clean up on failure
        callBatches.delete(batchId);
        throw error;
    }
}

/**
 * Handles wallet_getCallsStatus - returns status of batch calls
 */
async function handleGetCallsStatus(batchId: string, requestHandler: RequestHandler): Promise<CallStatusResponse> {
    const batch = callBatches.get(batchId);

    if (!batch) {
        throw makeJsonRpcError(-32004, `Batch ID ${batchId} not found`);
    }

    // Get current chain id to reduce unnecessary switches
    let activeChainId = (await requestHandler({
        method: EthereumMethodType.ETH_CHAIN_ID,
        params: [],
    })) as Hex;

    // Try to update pending statuses by fetching receipts
    for (let i = 0; i < batch.statuses.length; i += 1) {
        const st = batch.statuses[i];
        const hash = st.transactionHash;
        const callChainId = batch.chainIds[i];
        if (!hash || st.status === 'confirmed') continue;

        if (activeChainId !== callChainId) {
            await requestHandler({
                method: EthereumMethodType.WALLET_SWITCH_ETHEREUM_CHAIN,
                params: [{ chainId: callChainId }],
            });
            activeChainId = callChainId;
        }

        const rc = (await requestHandler({
            method: EthereumMethodType.ETH_GET_TRANSACTION_RECEIPT,
            params: [hash],
        })) as RpcTransactionReceipt | null;

        if (rc) {
            // Normalize receipt to our internal shape
            const normalized: InternalReceipt = {
                transactionHash: rc.transactionHash,
                transactionIndex: rc.transactionIndex,
                blockHash: rc.blockHash,
                blockNumber: rc.blockNumber,
                from: rc.from,
                to: rc.to,
                gasUsed: rc.gasUsed,
                effectiveGasPrice: rc.effectiveGasPrice,
                contractAddress: rc.contractAddress ?? null,
                logs: (rc.logs ?? []).map((log) => ({
                    address: log.address,
                    topics: log.topics,
                    data: log.data,
                    blockNumber: log.blockNumber,
                    transactionHash: log.transactionHash,
                    transactionIndex: log.transactionIndex,
                    blockHash: log.blockHash,
                    logIndex: log.logIndex,
                })),
                status: rc.status,
            };
            st.status = 'confirmed';
            st.receipt = normalized;
            st.effectiveGasPrice = normalized.effectiveGasPrice;
        }
    }

    // Receipts of confirmed calls
    const receipts: InternalReceipt[] = batch.statuses.map((s) => s.receipt).filter((r): r is InternalReceipt => !!r);

    // Determine batch status
    let statusCode = 0; // pending
    if (receipts.length === batch.calls.length) {
        const anyFailed = receipts.some((r) => r.status === '0x0');
        statusCode = anyFailed ? 2 : 1;
    }

    return {
        version: batch.version ?? '1',
        id: batchId,
        status: statusCode,
        atomic: false,
        receipts: receipts.length > 0 ? receipts : undefined,
    };
}

/**
 * Generates a unique batch ID for tracking call batches
 */
function generateBatchId(): string {
    return `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
}
