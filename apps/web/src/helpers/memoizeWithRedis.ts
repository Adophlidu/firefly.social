/* cspell:disable */

import type { KeyType } from '@dimensiondev/enums';
import { runInSafeAsync } from '@dimensiondev/utils';
import { sha256, stringToHex } from 'viem';

import { logger } from '@/libs/Logger.js';
import { redis } from '@/libs/Redis.js';

interface MemoizedFunction {
    cache: {
        /**
         * Get the cached value by field key.
         * Returns null if the value is not found or expired.
         */
        get: (fieldKey: string) => Promise<unknown | null>;
        set: (fieldKey: string, fieldValue: string) => Promise<void>;
        has: (fieldKey: string) => Promise<boolean>;
        delete: (fieldKey: string) => Promise<boolean>;
    };
}

const DEFAULT_EXPIRES = 7 * 24 * 60 * 60 * 1000; // a week

function resolveRedisKey(key: KeyType, fieldKey: string) {
    const sum = [...sha256(stringToHex(fieldKey))]
        .map((c) => {
            const code = c.codePointAt(0);
            return typeof code === 'number' ? code : 0;
        })
        .reduce((s, n) => s + n, 0);

    // disperse the keys to 10 buckets
    return `${key}:${sum % 10}`;
}

function resolveRedisFieldKey(...args: any) {
    return [...args].join('_');
}

export function memoizeWithRedis<T extends (...args: any) => Promise<any>>(
    func: T,
    {
        key,
        resolver,
    }: {
        /** the name of KV store in redis */
        key: KeyType;
        /** the resolver returns the field key */
        resolver?: (...args: Parameters<T>) => string;
    },
): T & MemoizedFunction {
    const cache = {
        async get(fieldKey: string) {
            const redisKey = resolveRedisKey(key, fieldKey);
            const fieldValue = await redis.hget(redisKey, fieldKey);
            const fieldValueWithTTL = fieldValue as { expiresAt: number; ttl: number; value: unknown } | null;

            // field value with TTL when set
            if (typeof fieldValueWithTTL?.expiresAt === 'number' && typeof fieldValueWithTTL?.ttl === 'number') {
                if (Date.now() >= fieldValueWithTTL.expiresAt) return null;
                return fieldValueWithTTL.value;
            }

            // throw away the value when no TTL
            return null;
        },
        async set(fieldKey: string, value: unknown, ttl = DEFAULT_EXPIRES) {
            if (value === null || value === undefined) {
                logger.warn(
                    `[memoizeWithRedis] Attempted to set a null or undefined value for key=${key}, fieldKey=${fieldKey}`,
                );
                return;
            }

            const redisKey = resolveRedisKey(key, fieldKey);
            try {
                await redis.hset(redisKey, {
                    [fieldKey]: {
                        expiresAt: Date.now() + ttl,
                        ttl,
                        value,
                    },
                });
            } catch (error) {
                logger.error(
                    `[memoizeWithRedis] Error setting value in Redis, key=${key}, fieldKey=${fieldKey}, redisKey=${redisKey}`,
                    value,
                );
                throw error;
            }
        },
        async has(fieldKey: string) {
            const fieldValue = await this.get(fieldKey);
            return fieldValue !== null;
        },
        async delete(fieldKey: string) {
            return (await redis.hdel(resolveRedisKey(key, fieldKey), fieldKey)) === 1;
        },
    } satisfies MemoizedFunction['cache'];

    const memoized = async (...args: any) => {
        const fieldKey = resolver ? resolver.apply(null, args) : resolveRedisFieldKey(...args);
        const redisKey = resolveRedisKey(key, fieldKey);

        try {
            const cacheHit = await cache.get(fieldKey);
            // null is a reserved value, so we need to check if the cache has the value
            if (cacheHit !== null) return cacheHit;
            logger.debug(`[memoizeWithRedis] Cache miss: key=${key}, fieldKey=${fieldKey}`);
        } catch (error) {
            logger.error(
                `[memoizeWithRedis] Error getting value from Redis, key=${key}, fieldKey=${fieldKey}, redisKey=${redisKey}:`,
                error,
            );
            // Ignore error
        }

        // Cache miss, call the original function
        const fieldValue = await func.apply(null, args);
        if (fieldValue === null || fieldValue === undefined) return fieldValue;

        await runInSafeAsync(() => cache.set(fieldKey, fieldValue));
        return fieldValue;
    };

    memoized.cache = cache;
    return memoized as unknown as T & MemoizedFunction;
}
