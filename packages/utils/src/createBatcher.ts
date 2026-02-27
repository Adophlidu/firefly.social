/**
 * Creates a batcher function that batches multiple requests together to reduce API calls.
 *
 * @param fetcher - Function that accepts an array of payloads and returns a Promise with a Record mapping keys to results
 * @param options - Configuration options
 * @param options.size - Maximum number of items per batch (default: 30)
 * @param options.wait - Wait time in milliseconds before flushing the batch (default: 30)
 * @param options.makeKey - Function to generate a unique key from a payload (used for deduplication and result mapping)
 * @returns A function that accepts a single payload and returns a Promise with the corresponding result
 *
 * @example
 * ```ts
 * const batchedFetch = createBatcher(
 *   async (users) => {
 *     const response = await fetch('/api/users', {
 *       method: 'POST',
 *       body: JSON.stringify({ ids: users.map(u => u.id) })
 *     });
 *     const data = await response.json();
 *     return Object.fromEntries(data.map(u => [u.id, u]));
 *   },
 *   { size: 5, wait: 50, makeKey: (user) => user.id }
 * );
 *
 * // Multiple calls will be batched together
 * const user1 = await batchedFetch({ id: '1', name: 'Alice' });
 * const user2 = await batchedFetch({ id: '2', name: 'Bob' });
 * ```
 */
export function createBatcher<Payload extends object, Result>(
    name: string,
    fetcher: (payloads: Payload[]) => Promise<Record<string, Result>>,
    options: {
        size?: number;
        wait?: number; // ms
        makeKey: (payload: Payload) => string; // determines deduping and mapping
    },
) {
    const size = options.size ?? 30;
    const wait = options.wait ?? 30;
    const makeKey = options.makeKey;

    type ResolveFn = (value: Result | undefined) => void;
    type RejectFn = (reason: unknown) => void;

    let queue: Array<{ payload: Payload; resolve: ResolveFn; reject: RejectFn }> = [];
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function flush() {
        const current = queue;

        console.info(`[batcher] ${name} flushing ${current.length} items`);

        // Clean
        queue = [];
        timer = null;

        // Deduplicate by key
        const map = new Map<string, Payload>();
        current.forEach(({ payload }) => {
            map.set(makeKey(payload), payload);
        });

        const uniquePayloads = Array.from(map.values());

        // Chunking
        const chunks: Payload[][] = [];
        for (let i = 0; i < uniquePayloads.length; i += size) {
            chunks.push(uniquePayloads.slice(i, i + size));
        }

        const results = await Promise.allSettled(chunks.map((chunk) => fetcher(chunk)));
        const mergedResults: Record<string, Result> = results.reduce((final, x) => {
            if (x.status === 'fulfilled') return Object.assign(final, x.value);
            console.error(`[batcher] ${name} failed to fetch`, x.reason);
            return final;
        }, {});

        // Resolve callers
        for (const { payload, resolve, reject } of current) {
            const key = makeKey(payload);

            if (Object.hasOwn(mergedResults, key)) resolve(mergedResults[key]);
            else reject(new Error(`Key ${key} not found in merged results`));
        }
    }

    return function batched(payload: Payload): Promise<Result | undefined> {
        return new Promise((resolve, reject) => {
            queue.push({ payload, resolve, reject });
            if (!timer) timer = setTimeout(flush, wait);
        });
    };
}
