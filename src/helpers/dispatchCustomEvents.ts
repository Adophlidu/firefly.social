import { bom } from '@dimensiondev/utils';

import type { EVENT_FORBIDDEN, EVENT_SOCIAL_ACCOUNT_EXPIRED } from '@/constants/event.js';
import type { Account } from '@/providers/types/Account.js';

interface CustomEvents {
    [EVENT_FORBIDDEN]: void;
    [EVENT_SOCIAL_ACCOUNT_EXPIRED]: { account: Account; removeFromStore?: boolean };
}

export function dispatchCustomEvent<K extends keyof CustomEvents>(
    eventName: K,
    detail?: CustomEvents[K],
    init?: Omit<CustomEventInit, 'detail'>,
): void {
    bom.document?.dispatchEvent(new CustomEvent(eventName, { detail, ...init }));
}

export function listenCustomEvent<K extends keyof CustomEvents>(
    eventName: K,
    handler: (event: CustomEvent<CustomEvents[K]>) => void,
    options?: boolean | AddEventListenerOptions,
): () => void {
    const handler_ = (event: Event) => handler(event as CustomEvent<CustomEvents[K]>);
    bom.document?.addEventListener(eventName, handler_, options);
    return () => bom.document?.removeEventListener(eventName, handler_, options);
}
