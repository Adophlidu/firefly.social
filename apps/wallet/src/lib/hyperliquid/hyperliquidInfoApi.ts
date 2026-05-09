import { HYPERLIQUID_INFO_URL } from '@/constants/hyperliquid.js';

export async function postHyperliquidInfo<T>(body: Record<string, unknown>): Promise<T> {
    const response = await fetch(HYPERLIQUID_INFO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Hyperliquid info HTTP ${response.status}: ${text.slice(0, 240)}`);
    }
    return (await response.json()) as T;
}
