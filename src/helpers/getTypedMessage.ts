import {
    isTypedMessageText,
    makeTypedMessageText,
    type TypedMessage,
    type TypedMessageTextV1,
} from '@masknet/typed-message';
import { editTypedMessageMeta } from '@masknet/typed-message-react';

import { SupportedMetaKeys } from '@/constants/rp.js';
import { hasRpPayload } from '@/helpers/rpPayload.js';

export function getTypedMessageText<T extends Record<string, never>>(metas: T): null;
export function getTypedMessageText<T extends Record<string, unknown>>(metas: T): TypedMessageTextV1;

export function getTypedMessageText(metas: Record<string, any>): TypedMessageTextV1 | null {
    const message = Object.entries(metas).reduce((message, [metaField, data]) => {
        return editTypedMessageMeta(message, (map) => map.set(metaField, data));
    }, makeTypedMessageText(''));

    if (!isTypedMessageText(message)) return null;

    return message;
}

export function getTypedMessageRedPacket<T extends Record<string, never>>(metas: T): null;
export function getTypedMessageRedPacket<T extends Partial<Record<SupportedMetaKeys, unknown>>>(
    metas: T,
): TypedMessage<SupportedMetaKeys>;

export function getTypedMessageRedPacket(metas: Record<string, unknown>) {
    const message = getTypedMessageText(metas);
    if (!message) return null;

    if (!hasRpPayload(message)) return null;

    editTypedMessageMeta(message, (map) => {
        map.forEach((_, key) => {
            if (!SupportedMetaKeys.includes(key)) map.delete(key);
        });
    });

    return message as TypedMessage<SupportedMetaKeys>;
}
