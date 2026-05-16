import type { MessageDataPatch } from '@/farcaster-message/src/encodeMessageData.js';

/**
 * Type for hash objects with numeric string keys representing byte values
 */
type HashObject = Record<string, number>;

/**
 * Converts a hash object with numeric keys to a Uint8Array
 * @param hashObj - Object with numeric string keys representing byte values
 * @returns Uint8Array representation of the hash
 */
function convertHashObjectToUint8Array(hashObj: HashObject): Uint8Array {
    const keys = Object.keys(hashObj)
        .map(Number)
        .sort((a, b) => a - b);
    const bytes = new Uint8Array(keys.length);
    keys.forEach((key, index) => {
        bytes[index] = hashObj[key.toString()];
    });
    return bytes;
}

/**
 * Checks if an object is a hash object (has numeric keys representing bytes)
 */
function isHashObject(obj: unknown): obj is HashObject {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }

    const keys = Object.keys(obj);
    return (
        keys.length > 0 &&
        keys.every((key) => /^\d+$/.test(key)) &&
        keys.every(
            (key) =>
                typeof (obj as Record<string, unknown>)[key] === 'number' &&
                (obj as Record<string, number>)[key] >= 0 &&
                (obj as Record<string, number>)[key] <= 255,
        )
    );
}

/**
 * Predefined paths to hash fields in MessageData structure
 * Based on @farcaster/core MessageData interface analysis
 */
const HASH_FIELD_PATHS = [
    // CastAddBody fields
    ['castAddBody', 'parentCastId', 'hash'],

    // CastRemoveBody fields
    ['castRemoveBody', 'targetHash'],

    // ReactionBody fields
    ['reactionBody', 'targetCastId', 'hash'],

    // VerificationAddAddressBody fields
    ['verificationAddAddressBody', 'address'],
    ['verificationAddAddressBody', 'claimSignature'],
    ['verificationAddAddressBody', 'blockHash'],

    // VerificationRemoveBody fields
    ['verificationRemoveBody', 'address'],

    // FrameActionBody fields
    ['frameActionBody', 'url'],
    ['frameActionBody', 'castId', 'hash'],
    ['frameActionBody', 'inputText'],
    ['frameActionBody', 'state'],
    ['frameActionBody', 'transactionId'],
    ['frameActionBody', 'address'],

    // UserNameProof fields
    ['usernameProofBody', 'name'],
    ['usernameProofBody', 'owner'],
    ['usernameProofBody', 'signature'],
] as const;

/**
 * Array paths that contain objects with hash fields
 * Format: [arrayPath, ...nestedPathToHash]
 */
const ARRAY_HASH_PATHS = [
    // CastAddBody embeds array - each embed can have castId.hash
    [
        ['castAddBody', 'embeds'],
        ['castId', 'hash'],
    ],
] as const;

/**
 * Safely navigates to a nested property using a path array
 * @param obj - The object to navigate
 * @param path - Array of property names representing the path
 * @returns The value at the end of the path, or undefined if any step fails
 */
function getNestedValue(obj: unknown, path: readonly string[]): unknown {
    let current = obj;
    for (const key of path) {
        if (current === null || current === undefined || typeof current !== 'object') {
            return undefined;
        }
        current = (current as Record<string, unknown>)[key];
    }
    return current;
}

/**
 * Safely sets a nested property using a path array
 * @param obj - The object to modify
 * @param path - Array of property names representing the path
 * @param value - The value to set
 */
function setNestedValue(obj: Record<string, unknown>, path: readonly string[], value: unknown): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (current[key] === null || current[key] === undefined || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
    }
    current[path[path.length - 1]] = value;
}

/**
 * Processes arrays that may contain objects with hash fields
 * @param arr - Array to process
 * @param hashPath - Path within each array element that may contain hash fields
 * @returns Processed array
 */
function processArrayWithHashFields(arr: unknown[], hashPath: readonly string[]): unknown[] {
    return arr.map((item) => {
        if (typeof item !== 'object' || item === null) {
            return item;
        }

        const processedItem = { ...(item as Record<string, unknown>) };

        // Check if this array item has the hash field
        const value = getNestedValue(processedItem, hashPath);
        if (value !== undefined && isHashObject(value)) {
            const convertedValue = convertHashObjectToUint8Array(value);
            setNestedValue(processedItem, hashPath, convertedValue);
        }

        return processedItem;
    });
}

/**
 * Processes message data by converting hash objects at specific known paths to Uint8Arrays
 * @param data - The message data object to process
 * @returns Processed message data with converted hash fields
 */
export function processMessageData(data: MessageDataPatch): MessageDataPatch {
    if (data === null || data === undefined || typeof data !== 'object') {
        return data;
    }

    // Create a deep copy to avoid mutating the original
    const processed = JSON.parse(JSON.stringify(data)) as Record<string, unknown>;

    // Process each known hash field path
    for (const path of HASH_FIELD_PATHS) {
        const value = getNestedValue(processed, path);
        if (value !== undefined) {
            if (isHashObject(value)) {
                // Convert hash object (numeric keys) to Uint8Array
                const convertedValue = convertHashObjectToUint8Array(value);
                setNestedValue(processed, path, convertedValue);
            } else if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) {
                // Convert empty objects to empty Uint8Array for fields that expect bytes
                setNestedValue(processed, path, new Uint8Array(0));
            }
        }
    }

    // Process arrays that may contain objects with hash fields
    for (const [arrayPath, hashPath] of ARRAY_HASH_PATHS) {
        const arrayValue = getNestedValue(processed, arrayPath);
        if (Array.isArray(arrayValue)) {
            const processedArray = processArrayWithHashFields(arrayValue, hashPath);
            setNestedValue(processed, arrayPath, processedArray);
        }
    }

    return processed as MessageDataPatch;
}
