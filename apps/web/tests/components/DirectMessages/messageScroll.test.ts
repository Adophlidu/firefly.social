/// @vitest-environment jsdom

import { describe, expect, test, vi } from 'vitest';

import {
    isDmThreadVisible,
    isNearLatestMessage,
    observeMessageMediaReady,
    shouldElevateMessageThreadHeader,
} from '@/components/DirectMessages/messageScroll.js';

describe('isNearLatestMessage', () => {
    test('treats the latest message threshold as attached to the bottom', () => {
        expect(isNearLatestMessage(1_000, 520, 400)).toBe(true);
    });

    test('detects when the user is browsing older messages', () => {
        expect(isNearLatestMessage(1_000, 400, 400)).toBe(false);
    });
});

describe('isDmThreadVisible', () => {
    test('does not treat a hidden mobile conversation as visible', () => {
        expect(isDmThreadVisible(false, false)).toBe(false);
    });

    test('treats the selected mobile conversation and desktop conversation as visible', () => {
        expect(isDmThreadVisible(false, true)).toBe(true);
        expect(isDmThreadVisible(true, false)).toBe(true);
    });
});

describe('shouldElevateMessageThreadHeader', () => {
    test('elevates the header only after messages move underneath it', () => {
        expect(shouldElevateMessageThreadHeader(0)).toBe(false);
        expect(shouldElevateMessageThreadHeader(4)).toBe(false);
        expect(shouldElevateMessageThreadHeader(5)).toBe(true);
    });
});

describe('observeMessageMediaReady', () => {
    test('reports cached media as ready immediately', () => {
        const container = document.createElement('div');
        const image = document.createElement('img');
        Object.defineProperty(image, 'complete', { configurable: true, value: true });
        container.append(image);
        const onReady = vi.fn();

        observeMessageMediaReady(container, onReady);

        expect(onReady).toHaveBeenCalledOnce();
    });

    test('waits for every image and video to settle', () => {
        const container = document.createElement('div');
        const image = document.createElement('img');
        const video = document.createElement('video');
        Object.defineProperty(image, 'complete', { configurable: true, value: false });
        Object.defineProperty(video, 'readyState', { configurable: true, value: 0 });
        container.append(image, video);
        const onReady = vi.fn();

        observeMessageMediaReady(container, onReady);
        image.dispatchEvent(new Event('load'));
        expect(onReady).not.toHaveBeenCalled();

        video.dispatchEvent(new Event('loadedmetadata'));
        expect(onReady).toHaveBeenCalledOnce();
    });

    test('treats failed media as settled', () => {
        const container = document.createElement('div');
        const image = document.createElement('img');
        Object.defineProperty(image, 'complete', { configurable: true, value: false });
        container.append(image);
        const onReady = vi.fn();

        observeMessageMediaReady(container, onReady);
        image.dispatchEvent(new Event('error'));

        expect(onReady).toHaveBeenCalledOnce();
    });
});
