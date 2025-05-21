/* cspell:disable */

import { kv } from '@vercel/kv';

import type { KeyType } from '@/constants/enum.js';

interface MemoizedFunction {
    cache: {
        get: (fieldKey: string) => Promise<string>;
        set: (fieldKey: string, fieldValue: string) => Promise<void>;
        has: (fieldKey: string) => Promise<boolean>;
        delete: (fieldKey: string) => Promise<boolean>;
    };
}

const DEFAULT_EXPIRES = 7 * 24 * 60 * 60 * 1000; // a week

function resolveRedisKey(key: KeyType, fieldKey: string) {
    const sum = [...fieldKey]
        .map((c) => {
            const code = c.codePointAt(0);
            return typeof code === 'number' ? code : 0;
        })
        .reduce((s, n) => s + n, 0);

    // disperse the keys to 10 buckets
    return `${key}:${sum % 10}`;
}

export function resolveRedisFieldKey(...args: any) {
    return [...args].join('_');
}

export function memoizeWithRedis<T extends (...args: any) => Promise<any>>(
    func: T,
    {
        key,
        resolver,
        ignoreCacheWhen,
        expiresWhen,
    }: {
        /** the name of KV store in redis */
        key: KeyType;
        /** the resolver returns the field key */
        resolver?: (...args: Parameters<T>) => string;
        /** the function to determine whether to ignore the cache */
        ignoreCacheWhen?: (result: Awaited<ReturnType<T>> | null) => boolean;
        /** the function to determine when to expire the cache */
        expiresWhen?: () => number;
    },
): T & MemoizedFunction {
    const memoized = async (...args: any) => {
        const fieldKey = resolver ? resolver.apply(null, args) : resolveRedisFieldKey(...args);
        const redisKey = resolveRedisKey(key, fieldKey);

        try {
            const fieldExists = await kv.hexists(redisKey, fieldKey);

            // Cache hit, return the cached value
            if (fieldExists) {
                const fieldValue = await kv.hget<ReturnType<T>>(redisKey, fieldKey);

                if (!ignoreCacheWhen?.(fieldValue)) {
                    return fieldValue;
                }
            }
        } catch (error) {
            console.log(
                `[memoizeWithRedis] Error getting value from Redis, key=${key}, fieldKey=${fieldKey}, redisKey=${redisKey}:`,
                error,
            );
            // Ignore error
        }

        // Cache miss, call the original function
        const fieldValue = await func.apply(null, args);

        try {
            // Set the value in Redis
            await kv.hset(redisKey, {
                [fieldKey]: fieldValue,
            });
        } catch (error) {
            console.log(
                `[memoizeWithRedis] Error setting value in Redis, key=${key}, fieldKey=${fieldKey}, redisKey=${redisKey}, fieldValue=${fieldValue}:`,
                error,
            );
            // Ignore error
        }

        return fieldValue;
    };

    memoized.cache = {
        get: async (fieldKey: string) => {
            const fieldValue = await kv.hget(resolveRedisKey(key, fieldKey), fieldKey);
            const fieldValueWithTTL = fieldValue as { expiresAt: number; ttl: number; value: unknown };

            // field value with TTL when set
            if (typeof fieldValueWithTTL.expiresAt === 'number' && typeof fieldValueWithTTL.ttl === 'number') {
                if (Date.now() >= fieldValueWithTTL.expiresAt) return null;
                return fieldValueWithTTL.value;
            }

            // throw away the value when no TTL
            return null;
        },
        set: async (fieldKey: string, value: unknown, ttl = DEFAULT_EXPIRES) => {
            const redisKey = resolveRedisKey(key, fieldKey);
            try {
                await kv.hset(redisKey, {
                    [fieldKey]: {
                        expiresAt: expiresWhen?.() ?? Date.now() + ttl,
                        ttl,
                        value,
                    },
                });
            } catch (error) {
                console.log(
                    `[memoizeWithRedis] Error setting value in Redis, key=${key}, fieldKey=${fieldKey}, redisKey=${redisKey}, fieldValue=${value}:`,
                    error,
                );
                throw error;
            }
        },
        has: async (fieldKey: string) => (await kv.hexists(resolveRedisKey(key, fieldKey), fieldKey)) === 1,
        delete: async (fieldKey: string) => (await kv.hdel(resolveRedisKey(key, fieldKey), fieldKey)) === 1,
    };

    return memoized as unknown as T & MemoizedFunction;
}
