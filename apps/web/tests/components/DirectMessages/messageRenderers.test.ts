/// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { MESSAGE_RENDERERS } from '@/components/DirectMessages/messageRenderers.js';
import type { DirectMessageItem } from '@/components/DirectMessages/types.js';

// Stub the heavy content components; this suite only exercises the registry dispatch and the two
// self-contained renderers (text, unknown).
vi.mock('@lingui/react/macro', () => ({ Trans: ({ children }: { children?: unknown }) => children }));
vi.mock('@/controllers/openPreviewMediaModal.js', () => ({ openPreviewMediaModal: vi.fn() }));
vi.mock('@/components/DirectMessages/MediaMessage.js', () => ({ MediaMessage: () => null }));
vi.mock('@/components/DirectMessages/StickerMessage.js', () => ({ StickerMessage: () => null }));
vi.mock('@/components/DirectMessages/TipMessage.js', () => ({ TipMessage: () => null }));

afterEach(cleanup);

const ALL_KINDS: Array<DirectMessageItem['kind']> = ['text', 'media', 'sticker', 'tip', 'unknown'];
const baseItem = { id: 'm1', createdAt: '2026-01-01T00:00:00.000Z', timestamp: '10:00', isSelf: false };

describe('MESSAGE_RENDERERS', () => {
    test('registers a renderer for every message kind', () => {
        for (const kind of ALL_KINDS) {
            expect(typeof MESSAGE_RENDERERS[kind]).toBe('function');
        }

        // A new kind added to the registry without updating this list should trip here, mirroring the
        // compile-time guarantee that every kind must be registered.
        expect(Object.keys(MESSAGE_RENDERERS).sort()).toEqual([...ALL_KINDS].sort());
    });

    test('preserves line breaks in text messages', () => {
        const TextRenderer = MESSAGE_RENDERERS.text;
        render(
            createElement(TextRenderer, {
                item: { ...baseItem, kind: 'text', content: 'hello\nworld' },
                account: '0x',
            }),
        );

        expect(screen.getByText(/hello\s+world/).classList.contains('whitespace-pre-wrap')).toBe(true);
    });

    test('renders a fallback for unknown messages', () => {
        const UnknownRenderer = MESSAGE_RENDERERS.unknown;
        render(createElement(UnknownRenderer, { item: { ...baseItem, kind: 'unknown' }, account: '0x' }));

        expect(screen.getByText('Unsupported message')).toBeTruthy();
    });

    test('a renderer renders nothing when the item kind does not match its slot', () => {
        const TextRenderer = MESSAGE_RENDERERS.text;
        const { container } = render(
            createElement(TextRenderer, { item: { ...baseItem, kind: 'unknown' }, account: '0x' }),
        );

        expect(container.firstChild).toBeNull();
    });
});
