/// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { MessageCaption } from '@/components/DirectMessages/MessageCaption.js';

vi.mock('@/components/DirectMessages/MessageText.js', () => ({
    MessageText: ({ content }: { content: string }) => content,
}));

afterEach(cleanup);

describe('MessageCaption', () => {
    test('preserves line breaks in captions', () => {
        render(createElement(MessageCaption, { content: 'hello\nworld', variant: 'attached' }));

        expect(screen.getByText(/hello\s+world/).classList.contains('whitespace-pre-wrap')).toBe(true);
    });
});
