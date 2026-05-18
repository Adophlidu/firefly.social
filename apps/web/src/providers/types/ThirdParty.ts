import type { SessionType } from '@dimensiondev/enums';

export interface ThirdPartySessionType {
    type: SessionType.Apple | SessionType.Google | SessionType.Telegram | SessionType.Twitter;
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        id?: string;
    };
    token?: {
        nonce: string;
        id_token: string;
        createdAt: number;
        expiresAt: number;
    };
}
