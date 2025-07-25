interface TokenPayload {
    sub: string;
    exp: number;
    sid: string;
    act: { sub: string };
}

export function parseLensAccessToken(token: string): TokenPayload | undefined {
    try {
        const payload = token.split('.')[1];
        const decodedPayload = atob(payload);
        return JSON.parse(decodedPayload) as TokenPayload | undefined;
    } catch {
        return {
            sub: '',
            exp: 0,
            sid: '',
            act: { sub: '' },
        };
    }
}
