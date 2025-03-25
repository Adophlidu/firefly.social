import {
    ChainId,
    createJsonRpcPayload,
    createJsonRpcResponse,
    ErrorEditor,
    EthereumMethodType,
    PayloadEditor,
    type RequestArguments,
} from '@masknet/web3-shared-evm';

import type { EVMConnectionOptions } from '@/mask_pkgs/web3-providers/Web3/EVM/types/index.js';

let pid = 0;

export class ConnectionContext {
    private id = 0;
    private _writable = true;
    private _error: Error | null = null;
    private _result: unknown;

    constructor(
        private _requestArguments: RequestArguments,
        private _options?: EVMConnectionOptions,
    ) {
        // increase pid
        pid += 1;
        this.id = pid;
    }

    private get errorEditor() {
        return ErrorEditor.from(this._error, this.response, 'Failed to send request.');
    }

    private get payloadEditor() {
        return PayloadEditor.fromPayload(this.request, this._options);
    }

    get writable() {
        return this._writable;
    }

    get account() {
        return this.payloadEditor.from ?? this._options?.overrides?.from ?? this._options?.account ?? '';
    }

    get chainId(): ChainId {
        return (
            this.payloadEditor.chainId ?? this._options?.overrides?.chainId ?? this._options?.chainId ?? ChainId.Mainnet
        );
    }

    get providerURL() {
        return this._options?.providerURL ?? this._options?.providerURL;
    }

    get method() {
        return this.request.method as EthereumMethodType;
    }

    get requestArguments() {
        return this._requestArguments;
    }

    /**
     * JSON RPC request payload
     */
    get request() {
        return createJsonRpcPayload(this.id, this._requestArguments);
    }

    /**
     * JSON RPC response object
     */
    get response() {
        if (this._writable) return;
        return createJsonRpcResponse(this.id, this._result);
    }

    get error() {
        if (this._writable) return null;
        if (this.errorEditor.presence) return this.errorEditor.error;
        return null;
    }

    set error(error: Error | null) {
        this._error = error;
    }

    get result() {
        return this._result;
    }

    set result(result: unknown) {
        this._result = result;
    }

    /**
     * Resolve a request and write down the result into the context. Alias of end(null, result)
     */
    write(result?: unknown) {
        this.end(null, result);
    }

    /**
     * Reject a request and throw an error. Alias of end(error)
     */
    abort(error: unknown, fallback = 'Failed to send request.') {
        this.end((error as Error) || new Error(fallback));
    }

    /**
     * Seal a request by resolving or rejecting it.
     */
    end(error: Error | null = null, result?: unknown) {
        if (!this._writable) return;
        this._writable = false;
        this.error = error;
        this.result = result;
    }

    toJSON() {
        return {};
    }
}
