import { jwtDecode } from 'jwt-decode';

export function isBskyTokenExpired(token?: string, interval = 0) {
    try {
        if (token) {
            const decoded = jwtDecode(token);
            if (decoded.exp) {
                return Date.now() >= decoded.exp * 1000 - interval;
            }
        }
    } catch (e) {
        console.warn('[Bsky]: could not decode jwt');
    }

    return true;
}
