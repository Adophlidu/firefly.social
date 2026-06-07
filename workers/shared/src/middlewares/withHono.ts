import type { Context } from 'hono';

export async function withHono<T>(c: Context, fn: () => Promise<T>) {
    const data = await fn();
    return c.json({ success: true as const, data });
}
