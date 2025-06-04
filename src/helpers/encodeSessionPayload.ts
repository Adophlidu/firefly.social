import { parseJson } from '@/helpers/parseJson.js';

export function encodeAsciiPayload(payload: unknown) {
    return btoa(JSON.stringify(payload));
}

export function decodeAsciiPayload<T>(payload: string) {
    return parseJson<T>(atob(payload));
}

export function encodeNoAsciiPayload(payload: unknown) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

export function decodeNoAsciiPayload<T>(payload: string) {
    return parseJson<T>(decodeURIComponent(escape(atob(payload))));
}
