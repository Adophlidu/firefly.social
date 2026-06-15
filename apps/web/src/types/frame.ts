// Frame API shapes are owned by the frame worker; re-export them so app-side
// consumers keep importing from this module.
export type {
    Frame,
    FrameButton,
    FrameInput,
    FrameV1,
    FrameV2,
    Index,
    LinkDigestedResponse,
} from '@dimensiondev/workers-frame';

export enum MethodType {
    ETH_SEND_TRANSACTION = 'eth_sendTransaction',
    ETH_SIGN_TYPED_DATA_V4 = 'eth_signTypedData_v4',
}

export interface RedirectUrlResponse {
    redirectUrl: string;
}
