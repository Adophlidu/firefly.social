import type { TypedMessage } from '@masknet/typed-message';
import { first } from 'lodash-es';

import { RedPacketEncryptedKey, SupportedMetaKeys } from '@/constants/rp.js';
import type { RedPacketMetadata } from '@/types/rp.js';

export function hasRpPayload(message: TypedMessage | null) {
    return SupportedMetaKeys.some((key) => !!message?.meta?.get(key));
}

export function getRpMetadata<K extends SupportedMetaKeys>(message: TypedMessage<K>): RedPacketMetadata;
export function getRpMetadata<K extends string>(message: TypedMessage<K>): null;

export function getRpMetadata<K extends string | SupportedMetaKeys>(message: TypedMessage<K>) {
    const metadata = first(SupportedMetaKeys.map((key) => message.meta?.get(key as K)).filter(Boolean)) ?? null;
    return metadata as RedPacketMetadata | null;
}

export function isRpEncrypted(message: TypedMessage | null) {
    if (hasRpPayload(message)) return message?.meta?.get(RedPacketEncryptedKey) === true;
    return false;
}

export function updateRpEncrypted<T extends TypedMessage>(message: T | null, encrypted = true): T | null {
    if (hasRpPayload(message) && message?.meta) {
        return {
            ...message,
            meta: new Map([[RedPacketEncryptedKey, encrypted], ...(message?.meta?.entries() ?? [])]),
        };
    }
    return message;
}
