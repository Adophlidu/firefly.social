/// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { StickerMessage } from '@/components/DirectMessages/StickerMessage.js';

vi.mock('@lingui/react/macro', () => ({ Trans: ({ children }: { children?: unknown }) => children }));

afterEach(cleanup);

describe('StickerMessage', () => {
    test('falls back to the metadata resource and opens it in the preview', () => {
        const onPreview = vi.fn();
        render(
            createElement(StickerMessage, {
                url: 'https://cdn.example/sticker.webp',
                fallbackUrl: 'https://origin.example/sticker.webp',
                onPreview,
            }),
        );

        const image = screen.getByRole<HTMLImageElement>('img', { name: 'Sticker' });
        fireEvent.error(image);

        expect(image.src).toBe('https://origin.example/sticker.webp');
        fireEvent.click(screen.getByRole('button', { name: 'Preview sticker' }));
        expect(onPreview).toHaveBeenCalledWith('https://origin.example/sticker.webp');
    });

    test('shows the unsupported fallback when all resources fail', () => {
        render(
            createElement(StickerMessage, {
                url: 'https://cdn.example/sticker.webp',
                fallbackUrl: 'https://origin.example/sticker.webp',
                onPreview: vi.fn(),
            }),
        );

        fireEvent.error(screen.getByRole('img', { name: 'Sticker' }));
        fireEvent.error(screen.getByRole('img', { name: 'Sticker' }));

        expect(screen.getByText('Unsupported message')).toBeTruthy();
    });
});
