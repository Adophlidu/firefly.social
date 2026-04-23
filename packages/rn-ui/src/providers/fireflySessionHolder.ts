import urlcat from 'urlcat';

import { FIREFLY_ROOT_URL } from '@/constants/static';
import type { NextFetchersOptions } from '@/helpers/fetch';
import { fetchJson } from '@/helpers/fetchJson';

export class FireflySessionHolder {
    public readonly token?: string;
    public readonly baseUrl?: string;

    constructor(token?: string, baseUrl?: string) {
        this.token = token;
        this.baseUrl = baseUrl;
    }

    get _authToken() {
        return this.token;
    }

    get _baseUrl() {
        return this.baseUrl || FIREFLY_ROOT_URL;
    }

    async fetchWithSession<T>(url: string, init?: RequestInit, options?: NextFetchersOptions) {
        return fetchJson<T>(
            urlcat(this._baseUrl, url),
            {
                ...init,
                headers: { ...init?.headers, Authorization: `Bearer ${this._authToken}` },
            },
            options,
        );
    }

    async fetchWithoutSession<T>(url: string, init?: RequestInit, options?: NextFetchersOptions) {
        return fetchJson<T>(urlcat(this._baseUrl, url), init, options);
    }

    fetch<T>(url: string, init?: RequestInit, options?: NextFetchersOptions & { withSession?: boolean }): Promise<T> {
        if (options?.withSession === true) return this.fetchWithSession<T>(url, init, options);
        if (options?.withSession === false) return this.fetchWithoutSession<T>(url, init, options);
        if (this._authToken) return this.fetchWithSession<T>(url, init, options);
        return this.fetchWithoutSession<T>(url, init, options);
    }
}
