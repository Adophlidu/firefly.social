/** Element id of the `<script type="application/json">` dehydration payload. */
export const SSR_DATA_ELEMENT_ID = '__SSR_DATA__';

/** Header that switches the server handler from HTML to a JSON data payload. */
export const SSR_DATA_HEADER = 'x-ssr-data';

/**
 * The payload dehydrated into the HTML stream on the server and read back
 * during client hydration. `data` is keyed by route file path.
 */
export interface SsrPayload {
    url: string;
    params: Record<string, string>;
    data: Record<string, unknown>;
    /** A loader redirected; the client should navigate here instead. */
    redirect?: string;
    /** A loader threw `notFound()`. */
    notFound?: boolean;
    /** A loader threw an unexpected error (serialized message). */
    error?: string;
    /**
     * The matched page is client-only: the server rendered only the pending
     * shell; the client should render the same shell, then load the page.
     */
    pending?: boolean;
    /**
     * True when the page was rendered by the Vite dev server. Written by the
     * server (where dev detection is reliable) so the client renders the dev
     * bootstrap identically — hydration stays consistent by construction.
     */
    dev?: boolean;
    /**
     * Head descriptors computed on the server. Hydration reuses them as-is:
     * `head()` may be async, so recomputing on the client is not always
     * possible (and would diverge from the server-rendered <head>).
     */
    heads?: Array<import('./types.ts').HeadDescriptor>;
}

/**
 * The JSON payload the server returns for client-side navigations (when the
 * request carries `x-ssr-data: true`): everything the client needs to render
 * the target route without a full page load.
 */
export interface NavigationPayload extends SsrPayload {
    heads: Array<import('./types.ts').HeadDescriptor>;
}

/**
 * JSON.stringify hardened for embedding inside a `<script>` tag:
 * `<` is escaped so a literal `</script>` inside user data cannot break out.
 */
export function serializeForHtml(value: unknown): string {
    return JSON.stringify(value).replaceAll('<', '\\u003c');
}

export function parseSsrPayload(json: string): SsrPayload {
    return JSON.parse(json) as SsrPayload;
}
