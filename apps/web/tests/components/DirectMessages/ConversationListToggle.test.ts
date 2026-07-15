/// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { ConversationListToggle } from '@/components/DirectMessages/ConversationListToggle.js';

vi.mock('@/components/Tooltip.js', () => ({
    Tooltip: ({ children }: { children: ReactNode }) => children,
}));

afterEach(cleanup);

describe('ConversationListToggle', () => {
    test('collapses the expanded conversation list', () => {
        const onToggle = vi.fn();
        render(createElement(ConversationListToggle, { isCollapsed: false, onToggle }));

        const button = screen.getByRole('button', { name: 'Hide conversations' });
        expect(button.getAttribute('aria-expanded')).toBe('true');

        fireEvent.click(button);
        expect(onToggle).toHaveBeenCalledOnce();
    });

    test('exposes the action to restore a collapsed conversation list', () => {
        render(createElement(ConversationListToggle, { isCollapsed: true, onToggle: vi.fn() }));

        expect(screen.getByRole('button', { name: 'Show conversations' }).getAttribute('aria-expanded')).toBe('false');
    });
});
