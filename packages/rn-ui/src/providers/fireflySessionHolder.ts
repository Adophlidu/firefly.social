import urlcat from 'urlcat';

import { FIREFLY_ROOT_URL_DEV } from '@/constants/static';
import type { NextFetchersOptions } from '@/helpers/fetch';
import { fetchJson } from '@/helpers/fetchJson';

class FireflySessionHolder {
    private _authToken: string | null = null;
    private _baseUrl = FIREFLY_ROOT_URL_DEV;

    setAuthToken(token: string | null) {
        this._authToken = token;
    }

    setBaseUrl(url: string) {
        this._baseUrl = url;
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

export const fireflySessionHolder = new FireflySessionHolder();
