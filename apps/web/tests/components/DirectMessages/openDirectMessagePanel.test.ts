/// @vitest-environment jsdom

import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
    type DirectMessagePanelTarget,
    OPEN_DIRECT_MESSAGE_PANEL_EVENT,
    openDirectMessagePanel,
} from '@/controllers/openDirectMessagePanel.js';

const target: DirectMessagePanelTarget = {
    targetUserId: '0x1234',
    name: 'Alice',
    handle: 'alice',
};

function mockViewport(isDesktop: boolean) {
    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: vi.fn().mockReturnValue({ matches: isDesktop }),
    });
}

describe('openDirectMessagePanel', () => {
    beforeEach(() => mockViewport(true));

    test('opens the floating panel on desktop', () => {
        const handleOpen = vi.fn();
        window.addEventListener(OPEN_DIRECT_MESSAGE_PANEL_EVENT, handleOpen);

        expect(openDirectMessagePanel(target)).toBe(true);
        expect(handleOpen).toHaveBeenCalledOnce();
        expect((handleOpen.mock.calls[0]?.[0] as CustomEvent).detail).toEqual(target);

        window.removeEventListener(OPEN_DIRECT_MESSAGE_PANEL_EVENT, handleOpen);
    });

    test('keeps the route-link fallback on mobile', () => {
        mockViewport(false);
        const handleOpen = vi.fn();
        window.addEventListener(OPEN_DIRECT_MESSAGE_PANEL_EVENT, handleOpen);

        expect(openDirectMessagePanel(target)).toBe(false);
        expect(handleOpen).not.toHaveBeenCalled();

        window.removeEventListener(OPEN_DIRECT_MESSAGE_PANEL_EVENT, handleOpen);
    });
});
