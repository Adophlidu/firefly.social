import { describe, it, expect, vi } from 'vitest';
import { MemoizePromise } from '@/decorators/MemoizePromise.js';

vi.mock('@firefly/utils', () => ({
    bom: { window: {} },
}));

describe('MemoizePromise', () => {
    it('should cache promise results based on resolver', async () => {
        class TestService {
            callCount = 0;

            @MemoizePromise((id: number) => `key:${id}`)
            async fetchData(id: number): Promise<string> {
                this.callCount++;
                return `data-${id}`;
            }
        }

        const service = new TestService();

        const result1 = await service.fetchData(1);
        const result2 = await service.fetchData(1);
        const result3 = await service.fetchData(2);

        expect(result1).toBe('data-1');
        expect(result2).toBe('data-1');
        expect(result3).toBe('data-2');

        expect(service.callCount).toBe(2);
    });

    it('should not cache the result of a failed function call', async () => {
        let callCount = 0;
        class TestService {
            @MemoizePromise((id: number) => id.toString())
            async fetchData(id: number): Promise<string> {
                callCount++;
                if (id === 1) {
                    throw new Error('Failed to fetch');
                }
                return `data-${id}`;
            }
        }

        const service = new TestService();

        await expect(service.fetchData(1)).rejects.toThrow('Failed to fetch');
        expect(callCount).toBe(1);

        await expect(service.fetchData(1)).rejects.toThrow('Failed to fetch');
        expect(callCount).toBe(2);
    });
});
