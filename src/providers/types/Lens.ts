import type {
    AccessToken,
    FrameLensManagerSignatureResultFragment,
    IdToken,
    RefreshToken,
    SelfFundedTransactionRequest,
    SponsoredTransactionRequest,
    TxHash,
} from '@lens-protocol/client';

export interface FrameSignaturePacket {
    clientProtocol: string;
    untrustedData: FrameLensManagerSignatureResultFragment['signedTypedData']['value'] & {
        deadline: number;
        identityToken: string;
    };
    trustedData: {
        messageBytes: string;
    };
}

export enum LensMetadataAttributeKey {
    Poll = 'pollId',
}

type OperationResponse<T extends string> = {
    __typename: T;
    hash: TxHash;
};

type ErrorResponse<T extends string> = {
    __typename: T;
    reason: string;
};

type DelegableOperationResult<O extends string, E extends string> =
    | OperationResponse<O>
    | SponsoredTransactionRequest
    | SelfFundedTransactionRequest
    | ErrorResponse<E>;

type RestrictedOperationResult<E extends string> =
    | SponsoredTransactionRequest
    | SelfFundedTransactionRequest
    | ErrorResponse<E>;

export type OperationResult<O extends string, E extends string> =
    | DelegableOperationResult<O, E>
    | RestrictedOperationResult<E>;

export interface LensCredentials {
    accessToken: AccessToken;
    refreshToken: RefreshToken;
    idToken: IdToken;
}

declare module '@lens-protocol/client' {
    export interface Account {
        hasSubscribed: boolean;
    }
}
