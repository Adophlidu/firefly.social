export interface ORBSignInResponseData {
    qrCode: string;
    secret: string;
    deepLink: string;
}

export interface ORBSignInResponse {
    status: string;
    data: ORBSignInResponseData;
}

export interface ORBPollSignInResponseData {
    processed: boolean;
    source: string;
    user_id: string;
    handle: string;
    idToken: string | null;
    accessToken: string | null;
    refreshToken: string | null;
}

export interface ORBPollSignInResponse {
    status: string;
    data: ORBPollSignInResponseData;
}
