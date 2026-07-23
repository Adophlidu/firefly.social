'use client';

import { AttachmentType, Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import type { ComponentType } from 'react';

import { MediaMessage } from '@/components/DirectMessages/MediaMessage.js';
import { MessageCaption } from '@/components/DirectMessages/MessageCaption.js';
import { MessageText } from '@/components/DirectMessages/MessageText.js';
import { StickerMessage } from '@/components/DirectMessages/StickerMessage.js';
import { TipMessage } from '@/components/DirectMessages/TipMessage.js';
import type { DirectMessageItem } from '@/components/DirectMessages/types.js';
import { openPreviewMediaModal } from '@/controllers/openPreviewMediaModal.js';

// Props a message content renderer receives. `item` is narrowed to the matching kind so each
// renderer works with a concrete shape; `account` is the shared context the tip renderer needs.
export interface MessageContentProps<K extends DirectMessageItem['kind'] = DirectMessageItem['kind']> {
    item: Extract<DirectMessageItem, { kind: K }>;
    account: string;
}

// A registry entry accepts the whole union so it can live in a Record keyed by kind. defineRenderer
// bridges the two: it checks the kind at runtime, then forwards to a renderer typed for that kind.
type MessageRenderer = ComponentType<{ item: DirectMessageItem; account: string }>;

function defineRenderer<K extends DirectMessageItem['kind']>(
    kind: K,
    Component: ComponentType<MessageContentProps<K>>,
): MessageRenderer {
    return function MessageContent({ item, account }) {
        // The registry key guarantees kind agreement; TS cannot narrow a generic discriminant, so
        // assert the concrete member here (this is a type narrowing, never `any`).
        if (item.kind !== kind) return null;
        return <Component item={item as Extract<DirectMessageItem, { kind: K }>} account={account} />;
    };
}

function TextMessage({ item }: MessageContentProps<'text'>) {
    return (
        <div
            className={classNames(
                'max-w-full whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-5 [overflow-wrap:anywhere]',
                {
                    'rounded-br-md bg-fireflyBrand text-white': item.isSelf,
                    'rounded-bl-md border border-line bg-lightBg text-main': !item.isSelf,
                },
            )}
        >
            <MessageText content={item.content} isSelf={item.isSelf} />
        </div>
    );
}

function StickerMessageContent({ item }: MessageContentProps<'sticker'>) {
    return (
        <div>
            <StickerMessage
                key={`${item.id}-${item.url}`}
                url={item.url}
                fallbackUrl={item.fallbackUrl}
                onPreview={(url) =>
                    openPreviewMediaModal({
                        index: 0,
                        source: Source.Lens,
                        medias: [{ type: AttachmentType.Image, uri: url }],
                    })
                }
            />
            <MessageCaption content={item.content} variant="detached" />
        </div>
    );
}

function TipMessageContent({ item, account }: MessageContentProps<'tip'>) {
    return (
        <div>
            <TipMessage
                account={account}
                interactiveActionId={item.interactiveActionId}
                pendingTip={item.pendingTip}
                isSelf={item.isSelf}
                isSending={item.status === 'pending'}
            />
            <MessageCaption content={item.content} variant="detached" />
        </div>
    );
}

function UnknownMessage() {
    return (
        <div className="rounded-2xl border border-line bg-lightBg px-4 py-3 text-sm text-second">
            <Trans>Unsupported message</Trans>
        </div>
    );
}

// To add a message type: write its content component (here or its own file) and add one entry below.
// The Record type forces every DirectMessageItem kind to be covered — a missing kind fails to compile.
export const MESSAGE_RENDERERS: Record<DirectMessageItem['kind'], MessageRenderer> = {
    text: defineRenderer('text', TextMessage),
    media: defineRenderer('media', MediaMessage),
    sticker: defineRenderer('sticker', StickerMessageContent),
    tip: defineRenderer('tip', TipMessageContent),
    unknown: defineRenderer('unknown', UnknownMessage),
};
