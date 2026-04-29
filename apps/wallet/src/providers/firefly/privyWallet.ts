import { resolveFireflyResponseData } from '@/helpers/resolveFireflyResponseData.js';
import { Fetch } from '@/lib/Fetch.js';
import type {
    GetPrivyUserResponse,
    PersonalSignRequest,
    PersonalSignResponse,
    SendEvmTransactionRequest,
    SendEvmTransactionResponse,
    SendSolanaTransactionRequest,
    SendSolanaTransactionResponse,
    SignEip712TypedDataRequest,
    SignEip712TypedDataResponse,
    SignEvmTransactionRequest,
    SignEvmTransactionResponse,
    SignSolanaMessageRequest,
    SignSolanaMessageResponse,
} from '@/providers/types/Privy.js';

export class PrivyWalletApi extends Fetch {
    async getPrivyUser() {
        const result = await this.get<GetPrivyUserResponse>('/v1/privy-api/user');
        return resolveFireflyResponseData(result.data);
    }

    // #region EVM Methods
    async personalSign(options: PersonalSignRequest) {
        const result = await this.post<PersonalSignResponse>('/v1/privy/eth/personal-sign', options);
        return resolveFireflyResponseData(result.data);
    }

    async signEvmTransaction(options: SignEvmTransactionRequest) {
        const result = await this.post<SignEvmTransactionResponse>('/v1/privy/eth/sign-transaction', options);
        return resolveFireflyResponseData(result.data);
    }

    async signEip712TypedData(options: SignEip712TypedDataRequest) {
        const result = await this.post<SignEip712TypedDataResponse>('/v1/privy/eth/sign-typed-data-v4', options);
        return resolveFireflyResponseData(result.data);
    }

    async sendEvmTransaction(options: SendEvmTransactionRequest) {
        const result = await this.post<SendEvmTransactionResponse>('/v1/privy/eth/send-transaction', options);
        return resolveFireflyResponseData(result.data);
    }
    // #endregion

    // #region Solana Methods
    async signSolanaMessage(options: SignSolanaMessageRequest) {
        const result = await this.post<SignSolanaMessageResponse>('/v1/privy/solana/sign-message', options);
        return resolveFireflyResponseData(result.data);
    }

    async signAndSendSolanaTransaction(options: SendSolanaTransactionRequest) {
        const result = await this.post<SendSolanaTransactionResponse>('/v1/privy/solana/send-transaction', options);
        return resolveFireflyResponseData(result.data);
    }
    // #endregion
}
