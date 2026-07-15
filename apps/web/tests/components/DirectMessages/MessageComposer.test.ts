/// @vitest-environment jsdom
// cspell:ignore nihao pinyin

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { MessageComposer } from '@/components/DirectMessages/MessageComposer.js';
import { MAX_CHAT_ATTACHMENT_BYTES, MAX_CHAT_ATTACHMENTS } from '@/providers/orb/chat/constants.js';

vi.mock('@/helpers/enqueueMessage.js', () => ({ enqueueErrorMessage: vi.fn() }));
vi.mock('@dimensiondev/assets/emoji.svg', () => ({ default: () => null }));
vi.mock('@dimensiondev/assets/gif.svg', () => ({ default: () => null }));
vi.mock('@dimensiondev/assets/image.svg', () => ({ default: () => null }));
vi.mock('@dimensiondev/assets/play.svg', () => ({ default: () => null }));
vi.mock('@dimensiondev/assets/send.svg', () => ({ default: () => null }));
vi.mock('@lingui/react/macro', () => ({ Trans: ({ children }: { children?: unknown }) => children }));
vi.mock('@lingui/core/macro', () => ({
    t: (strings: TemplateStringsArray, ...values: unknown[]) =>
        strings.reduce((acc, part, index) => acc + part + (index < values.length ? String(values[index]) : ''), ''),
}));
vi.mock('@/components/DirectMessages/DmEmojiPicker.js', async () => {
    const { createElement } = await import('react');
    return {
        DmEmojiPicker: ({ onSelect }: { onSelect: (emoji: string) => void }) =>
            createElement('button', { type: 'button', onClick: () => onSelect('🙂') }, 'Add emoji'),
    };
});
vi.mock('@/components/DirectMessages/DmGifPicker.js', () => ({ DmGifPicker: () => null }));
vi.mock('@/helpers/getVideoMetadata.js', () => ({
    getVideoMetadata: () => Promise.resolve({ duration: 12, width: 1920, height: 1080 }),
}));

afterEach(cleanup);

describe('MessageComposer', () => {
    test('does not send when Enter confirms an IME composition', () => {
        const onSend = vi.fn();
        render(createElement(MessageComposer, { recipientName: 'Alice', onSend }));
        const input = screen.getByRole<HTMLTextAreaElement>('textbox');

        fireEvent.change(input, { target: { value: 'ni' } });
        fireEvent.compositionStart(input);
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', isComposing: true });

        expect(onSend).not.toHaveBeenCalled();
        expect(input.value).toBe('ni');
    });

    test('clears immediately and sends without waiting for a response', () => {
        const onSend = vi.fn();
        render(createElement(MessageComposer, { recipientName: 'Alice', onSend }));
        const input = screen.getByRole<HTMLTextAreaElement>('textbox');

        fireEvent.change(input, { target: { value: '你好' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        expect(onSend).toHaveBeenCalledWith({ content: '你好', attachments: [] });
        expect(input.value).toBe('');
    });

    test('inserts an emoji at the current selection', () => {
        render(createElement(MessageComposer, { recipientName: 'Alice', onSend: vi.fn() }));
        const input = screen.getByRole<HTMLTextAreaElement>('textbox');

        fireEvent.change(input, { target: { value: 'hello' } });
        input.setSelectionRange(2, 4);
        fireEvent.click(screen.getByRole('button', { name: 'Add emoji' }));

        expect(input.value).toBe('he🙂o');
    });

    test('stages an image and clears it immediately when sent', () => {
        const createObjectURL = vi.fn(() => 'blob:preview');
        Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
        const onSend = vi.fn();
        const { container } = render(createElement(MessageComposer, { recipientName: 'Alice', onSend }));
        const input = container.querySelector<HTMLInputElement>('input[type="file"]');
        const file = new File(['image'], 'photo.png', { type: 'image/png' });

        expect(input).not.toBeNull();
        fireEvent.change(input as HTMLInputElement, { target: { files: [file] } });
        const image = container.querySelector<HTMLImageElement>('img');
        expect(image).not.toBeNull();
        Object.defineProperties(image, {
            naturalWidth: { configurable: true, value: 1200 },
            naturalHeight: { configurable: true, value: 800 },
        });
        fireEvent.load(image as HTMLImageElement);
        fireEvent.click(screen.getByRole('button', { name: 'Send' }));

        expect(onSend).toHaveBeenCalledWith({
            content: '',
            attachments: [
                expect.objectContaining({ file, type: 'image/png', url: 'blob:preview', width: 1200, height: 800 }),
            ],
        });
        expect(container.querySelector('img')).toBeNull();
        expect(createObjectURL).toHaveBeenCalledWith(file);
        Reflect.deleteProperty(URL, 'createObjectURL');
    });

    test('does not let a rejected file consume an attachment slot', () => {
        const createObjectURL = vi.fn((file: File) => `blob:${file.name}`);
        Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
        Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
        const { container, unmount } = render(
            createElement(MessageComposer, { recipientName: 'Alice', onSend: vi.fn() }),
        );
        const input = container.querySelector<HTMLInputElement>('input[type="file"]');

        const oversized = new File(['x'], 'huge.png', { type: 'image/png' });
        Object.defineProperty(oversized, 'size', { value: MAX_CHAT_ATTACHMENT_BYTES + 1 });
        const validFiles = Array.from(
            { length: MAX_CHAT_ATTACHMENTS },
            (_, index) => new File(['x'], `img-${index}.png`, { type: 'image/png' }),
        );

        fireEvent.change(input as HTMLInputElement, { target: { files: [oversized, ...validFiles] } });

        // The oversized file is dropped but must not steal a slot: every valid image is staged.
        expect(container.querySelectorAll('img')).toHaveLength(MAX_CHAT_ATTACHMENTS);

        // Unmount while the object-URL stubs are still installed so the cleanup effect can revoke.
        unmount();
        Reflect.deleteProperty(URL, 'createObjectURL');
        Reflect.deleteProperty(URL, 'revokeObjectURL');
    });

    test('pastes an image from the clipboard as an attachment', () => {
        const createObjectURL = vi.fn(() => 'blob:pasted');
        Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
        Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
        const { container, unmount } = render(
            createElement(MessageComposer, { recipientName: 'Alice', onSend: vi.fn() }),
        );
        const input = screen.getByRole<HTMLTextAreaElement>('textbox');
        const file = new File(['image'], 'pasted.png', { type: 'image/png' });

        fireEvent.paste(input, { clipboardData: { files: [file], items: [] } });

        expect(container.querySelector('img')).not.toBeNull();
        expect(createObjectURL).toHaveBeenCalledWith(file);

        unmount();
        Reflect.deleteProperty(URL, 'createObjectURL');
        Reflect.deleteProperty(URL, 'revokeObjectURL');
    });

    test('lets a plain-text paste fall through without adding an attachment', () => {
        const { container } = render(createElement(MessageComposer, { recipientName: 'Alice', onSend: vi.fn() }));
        const input = screen.getByRole<HTMLTextAreaElement>('textbox');

        fireEvent.paste(input, {
            clipboardData: { files: [], items: [{ kind: 'string', getAsFile: () => null }] },
        });

        expect(container.querySelector('img')).toBeNull();
    });

    test('stages a video with metadata and sends it as an attachment', async () => {
        const createObjectURL = vi.fn(() => 'blob:video-preview');
        Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
        const onSend = vi.fn();
        const { container } = render(createElement(MessageComposer, { recipientName: 'Alice', onSend }));
        const input = container.querySelector<HTMLInputElement>('input[type="file"]');
        const file = new File(['video'], 'clip.mp4', { type: 'video/mp4' });

        fireEvent.change(input as HTMLInputElement, { target: { files: [file] } });
        await waitFor(() => expect(container.querySelector('video')).not.toBeNull());
        fireEvent.click(screen.getByRole('button', { name: 'Send' }));

        expect(onSend).toHaveBeenCalledWith({
            content: '',
            attachments: [
                expect.objectContaining({
                    file,
                    type: 'video/mp4',
                    url: 'blob:video-preview',
                    duration: 12,
                    width: 1920,
                    height: 1080,
                }),
            ],
        });
        expect(container.querySelector('video')).toBeNull();
        Reflect.deleteProperty(URL, 'createObjectURL');
    });

    test('undo restores a removed attachment', () => {
        Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:kept') });
        Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
        const { container, unmount } = render(
            createElement(MessageComposer, { recipientName: 'Alice', onSend: vi.fn() }),
        );
        const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
        const file = new File(['x'], 'photo.png', { type: 'image/png' });

        fireEvent.change(fileInput as HTMLInputElement, { target: { files: [file] } });
        expect(container.querySelector('img')).not.toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Remove attachment' }));
        expect(container.querySelector('img')).toBeNull();

        // Ctrl/Cmd+Z brings the attachment back — undo covers attachments, not just text.
        fireEvent.keyDown(screen.getByRole('textbox'), { key: 'z', metaKey: true });
        expect(container.querySelector('img')).not.toBeNull();

        unmount();
        Reflect.deleteProperty(URL, 'createObjectURL');
        Reflect.deleteProperty(URL, 'revokeObjectURL');
    });

    test('commits an IME composition as one undo step, not the intermediate pinyin', () => {
        render(createElement(MessageComposer, { recipientName: 'Alice', onSend: vi.fn() }));
        const input = screen.getByRole<HTMLTextAreaElement>('textbox');

        // Compose Chinese: pinyin updates arrive while composing (a pause between them must not
        // create a snapshot), then the composition is confirmed.
        fireEvent.compositionStart(input);
        fireEvent.change(input, { target: { value: 'ni' } });
        fireEvent.change(input, { target: { value: 'nihao' } });
        fireEvent.change(input, { target: { value: '你好' } });
        fireEvent.compositionEnd(input, { target: { value: '你好' } });
        expect(input.value).toBe('你好');

        // One undo removes the whole word and never lands on 'ni' / 'nihao'.
        fireEvent.keyDown(input, { key: 'z', metaKey: true });
        expect(input.value).toBe('');
    });

    test('undo rewinds a typing burst and redo replays it', () => {
        render(createElement(MessageComposer, { recipientName: 'Alice', onSend: vi.fn() }));
        const input = screen.getByRole<HTMLTextAreaElement>('textbox');

        fireEvent.change(input, { target: { value: 'hello' } });
        expect(input.value).toBe('hello');

        fireEvent.keyDown(input, { key: 'z', metaKey: true });
        expect(input.value).toBe('');

        fireEvent.keyDown(input, { key: 'z', metaKey: true, shiftKey: true });
        expect(input.value).toBe('hello');
    });
});
