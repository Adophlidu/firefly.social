'use client';

import GalleryIcon from '@dimensiondev/assets/gallery.svg';
import GifIcon from '@dimensiondev/assets/gif.svg';
import PlayIcon from '@dimensiondev/assets/play.svg';
import SendIcon from '@dimensiondev/assets/send.svg';
import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import {
    type ChangeEvent,
    type ClipboardEvent,
    type KeyboardEvent,
    memo,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

import { ComposerToolButton } from '@/components/DirectMessages/ComposerToolButton.js';
import { DmEmojiPicker } from '@/components/DirectMessages/DmEmojiPicker.js';
import { DmGifPicker } from '@/components/DirectMessages/DmGifPicker.js';
import type { MessageDraft } from '@/components/DirectMessages/types.js';
import { useComposerHistory } from '@/components/DirectMessages/useComposerHistory.js';
import { Tips } from '@/components/Tips/index.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { getVideoMetadata } from '@/helpers/getVideoMetadata.js';
import type { TipsSuccessResult } from '@/modals/TipsModal/refs.js';
import {
    MAX_CHAT_ATTACHMENT_BYTES,
    MAX_CHAT_ATTACHMENTS,
    MAX_CHAT_MESSAGE_LENGTH,
} from '@/providers/orb/chat/constants.js';
import type { DmAttachmentDraft } from '@/providers/orb/chat/types.js';
import type { FireflyIdentity } from '@/providers/types/Firefly.js';

// Show the character counter as the message approaches the limit.
const MESSAGE_LENGTH_COUNTER_THRESHOLD = MAX_CHAT_MESSAGE_LENGTH - 80;
const MIN_COMPOSER_HEIGHT_PX = 24;
const MAX_COMPOSER_HEIGHT_PX = 112;

interface MessageComposerProps {
    recipientName: string;
    onSend: (draft: MessageDraft) => void;
    tip?: {
        identity: FireflyIdentity;
        handle: string;
        onSuccess: (result: TipsSuccessResult) => Promise<void>;
    };
}

// The full editable state of the composer. Every edit produces a snapshot of this, so a future
// message type is covered by undo simply by living here.
interface ComposerState {
    content: string;
    selection: { start: number; end: number };
    attachments: DmAttachmentDraft[];
}

const EMPTY_COMPOSER_STATE: ComposerState = { content: '', selection: { start: 0, end: 0 }, attachments: [] };

export const MessageComposer = memo(function MessageComposer({ recipientName, onSend, tip }: MessageComposerProps) {
    const history = useComposerHistory<ComposerState>(EMPTY_COMPOSER_STATE);
    const { content, attachments } = history.state;
    const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
    const mediaInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isComposingRef = useRef(false);
    // The composer state captured when an IME composition starts, so compositionend can commit one
    // undo step whose target is the pre-composition state rather than an intermediate pinyin string.
    const compositionBaselineRef = useRef<ComposerState | null>(null);
    // Object URLs the composer created for local attachments. We revoke lazily (on unmount) rather
    // than when an attachment is removed, so undo can restore a removed attachment without its
    // preview breaking. URLs handed to a sent message are dropped from the set so unmount does not
    // revoke a blob the optimistic message is still rendering.
    const createdUrlsRef = useRef<Set<string>>(new Set());
    // Set by programmatic edits (undo, redo, emoji insert) so the layout effect restores the caret.
    const pendingSelectionRef = useRef(false);
    const canSend = Boolean(content.trim() || attachments.length);
    const isAttachmentsFull = attachments.length >= MAX_CHAT_ATTACHMENTS;

    useEffect(
        () => () => {
            for (const url of createdUrlsRef.current) URL.revokeObjectURL(url);
        },
        [],
    );

    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.style.height = 'auto';
        const nextHeight = Math.max(MIN_COMPOSER_HEIGHT_PX, Math.min(textarea.scrollHeight, MAX_COMPOSER_HEIGHT_PX));
        textarea.style.height = `${nextHeight}px`;
        textarea.style.overflowY = textarea.scrollHeight > MAX_COMPOSER_HEIGHT_PX ? 'auto' : 'hidden';
    }, [content]);

    useLayoutEffect(() => {
        if (!pendingSelectionRef.current) return;
        pendingSelectionRef.current = false;
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.focus();
        textarea.setSelectionRange(history.state.selection.start, history.state.selection.end);
    }, [history.state]);

    const readSelection = useCallback((fallback: number) => {
        const textarea = textareaRef.current;
        const start = textarea?.selectionStart ?? fallback;
        const end = textarea?.selectionEnd ?? start;
        return { start, end };
    }, []);

    const handleSend = () => {
        const nextContent = content.trim();
        if (!nextContent && !attachments.length) return;

        const draft: MessageDraft = { content: nextContent, attachments };
        // The sent attachments' URLs now belong to the outgoing (optimistic) message, so stop
        // tracking them here — unmount must not revoke a blob the message list still shows.
        for (const attachment of attachments) {
            if (attachment.file) createdUrlsRef.current.delete(attachment.url);
        }

        history.reset(EMPTY_COMPOSER_STATE);
        onSend(draft);
    };

    const addFiles = (files: File[]) => {
        if (!files.length) return;

        const availableSlots = MAX_CHAT_ATTACHMENTS - attachments.length;

        // Validate before slicing so rejected files (wrong type or oversize) do not consume slots
        // that valid files could have taken. Object URLs are created only for the kept files to
        // avoid leaking blobs for attachments dropped past the slot limit.
        const validFiles = files.filter((file) => {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            if (!isImage && !isVideo) {
                enqueueErrorMessage(<Trans>Only images, GIFs, and videos are supported.</Trans>);
                return false;
            }
            if (file.size > MAX_CHAT_ATTACHMENT_BYTES) {
                enqueueErrorMessage(<Trans>Files must be under 50 MB.</Trans>);
                return false;
            }
            return true;
        });
        if (!validFiles.length) return;

        if (validFiles.length > availableSlots) {
            enqueueErrorMessage(<Trans>You can attach up to {MAX_CHAT_ATTACHMENTS} files.</Trans>);
        }

        const nextAttachments = validFiles.slice(0, availableSlots).map((file): DmAttachmentDraft => {
            const url = URL.createObjectURL(file);
            createdUrlsRef.current.add(url);
            return { id: crypto.randomUUID(), url, type: file.type, file };
        });
        if (!nextAttachments.length) return;

        history.commit((prev) => ({ ...prev, attachments: [...prev.attachments, ...nextAttachments] }));

        for (const attachment of nextAttachments) {
            if (!attachment.file || !attachment.type.startsWith('video/')) continue;
            void getVideoMetadata(attachment.file)
                .then((metadata) => {
                    // Metadata arrives asynchronously; fold it into the current snapshot rather than
                    // creating an undo step for it.
                    history.replace((prev) => ({
                        ...prev,
                        attachments: prev.attachments.map((item) =>
                            item.id === attachment.id ? { ...item, ...metadata } : item,
                        ),
                    }));
                })
                .catch(() => undefined);
        }
    };

    const handleMediaChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = [...(event.currentTarget.files ?? [])];
        event.currentTarget.value = '';
        addFiles(files);
    };

    const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
        const { clipboardData } = event;
        // Prefer clipboardData.files (screenshots, copied image files); fall back to the item list
        // for browsers that only expose pasted images there. Text pastes yield no files and fall
        // through so the default paste still inserts the text.
        const files = clipboardData.files.length
            ? [...clipboardData.files]
            : [...clipboardData.items]
                  .filter((item) => item.kind === 'file')
                  .map((item) => item.getAsFile())
                  .filter((file): file is File => Boolean(file));
        if (!files.length) return;

        event.preventDefault();
        addFiles(files);
    };

    const handleRemoveAttachment = (id: string) => {
        // Keep the object URL alive (revoked on unmount) so an undo can restore this attachment.
        history.commit((prev) => ({ ...prev, attachments: prev.attachments.filter((a) => a.id !== id) }));
    };

    const handleGifSelected = (attachment: DmAttachmentDraft) => {
        if (attachments.length >= MAX_CHAT_ATTACHMENTS) return;
        history.commit((prev) => ({ ...prev, attachments: [...prev.attachments, attachment] }));
    };

    const handleImageReady = (id: string, image: HTMLImageElement) => {
        const width = image.naturalWidth;
        const height = image.naturalHeight;
        if (!width || !height) return;

        history.replace((prev) => ({
            ...prev,
            attachments: prev.attachments.map((attachment) =>
                attachment.id === id && (attachment.width !== width || attachment.height !== height)
                    ? { ...attachment, width, height }
                    : attachment,
            ),
        }));
    };

    const handleEmojiSelected = (emoji: string) => {
        const { start, end } = readSelection(content.length);
        const nextContent = `${content.slice(0, start)}${emoji}${content.slice(end)}`;
        if (nextContent.length > MAX_CHAT_MESSAGE_LENGTH) return;

        const caret = start + emoji.length;
        pendingSelectionRef.current = true;
        history.commit((prev) => ({ ...prev, content: nextContent, selection: { start: caret, end: caret } }));
    };

    const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        const { value, selectionStart, selectionEnd } = event.target;
        const selection = { start: selectionStart, end: selectionEnd };
        if (isComposingRef.current) {
            // IME composition in progress: update the preview in place without a snapshot, so a
            // paused pinyin string never becomes its own undo step — the composition is committed
            // as one step on compositionend instead.
            history.replace((prev) => ({ ...prev, content: value, selection }));
            return;
        }
        // Ignore no-op changes (e.g. a cancelled composition restoring the prior value).
        if (value === content) return;
        history.editText((prev) => ({ ...prev, content: value, selection }));
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        // Own undo/redo so it covers attachments too, not just the textarea's native text history.
        if ((event.metaKey || event.ctrlKey) && (event.key === 'z' || event.key === 'Z')) {
            event.preventDefault();
            if (event.shiftKey) {
                pendingSelectionRef.current = true;
                history.redo();
            } else {
                pendingSelectionRef.current = true;
                history.undo();
            }
            return;
        }
        if ((event.metaKey || event.ctrlKey) && (event.key === 'y' || event.key === 'Y')) {
            event.preventDefault();
            pendingSelectionRef.current = true;
            history.redo();
            return;
        }
        if (event.key !== 'Enter' || event.shiftKey) return;
        if (isComposingRef.current || event.nativeEvent.isComposing || event.keyCode === 229) return;

        event.preventDefault();
        handleSend();
    };

    return (
        <div className="shrink-0 border-t border-line bg-primaryBottom px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 md:px-5 md:pb-4">
            <div className="rounded-xl border border-line bg-lightBg px-3 py-2 transition-colors focus-within:border-fireflyBrand focus-within:bg-primaryBottom">
                {attachments.length ? (
                    <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto px-1">
                        {attachments.map((attachment) => (
                            <div
                                key={attachment.id}
                                className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-line"
                            >
                                {attachment.type.startsWith('video/') ? (
                                    <>
                                        <video
                                            src={attachment.url}
                                            muted
                                            playsInline
                                            preload="metadata"
                                            className="size-full object-cover"
                                        />
                                        <span className="pointer-events-none absolute inset-0 grid place-items-center bg-black/10 text-white">
                                            <span className="grid size-7 place-items-center rounded-full bg-black/55">
                                                <PlayIcon width={12} height={12} />
                                            </span>
                                        </span>
                                    </>
                                ) : (
                                    // Local object URLs and GIF hosts are not compatible with the Next Image allowlist.
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={attachment.url}
                                        alt=""
                                        className="size-full object-cover"
                                        onLoad={(event) => handleImageReady(attachment.id, event.currentTarget)}
                                    />
                                )}
                                <button
                                    type="button"
                                    className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/65 text-xs font-bold text-white"
                                    aria-label={t`Remove attachment`}
                                    onClick={() => handleRemoveAttachment(attachment.id)}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                ) : null}
                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={content}
                    maxLength={MAX_CHAT_MESSAGE_LENGTH}
                    className="block max-h-28 min-h-6 w-full resize-none border-0 bg-transparent px-1 py-0 text-sm leading-5 text-main outline-none placeholder:text-second focus:ring-0"
                    placeholder={t`Message ${recipientName}`}
                    onChange={handleTextChange}
                    onPaste={handlePaste}
                    onCompositionStart={() => {
                        isComposingRef.current = true;
                        compositionBaselineRef.current = history.state;
                    }}
                    onCompositionEnd={(event) => {
                        isComposingRef.current = false;
                        const baseline = compositionBaselineRef.current;
                        compositionBaselineRef.current = null;
                        if (!baseline) return;

                        const textarea = event.currentTarget;
                        const value = textarea.value;
                        // A cancelled composition restores the prior value: the present is already
                        // back in place, so there is no undo step to add.
                        if (value === baseline.content) return;

                        // Fold the whole composition into a single undo step whose target is the
                        // pre-composition state, so one undo removes the finished word, not pinyin.
                        history.commitFrom(baseline, (prev) => ({
                            ...prev,
                            content: value,
                            selection: {
                                start: textarea.selectionStart ?? value.length,
                                end: textarea.selectionEnd ?? value.length,
                            },
                        }));
                    }}
                    onKeyDown={handleKeyDown}
                />
                <div className="mt-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-0.5 text-second">
                        <ComposerToolButton
                            icon={<GalleryIcon width={18} height={18} />}
                            label={t`Add media`}
                            disabled={isAttachmentsFull}
                            onClick={() => mediaInputRef.current?.click()}
                        />
                        <input
                            ref={mediaInputRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            className="hidden"
                            onChange={handleMediaChange}
                        />
                        <ComposerToolButton
                            icon={<GifIcon width={18} height={18} viewBox="0 0 24 24" />}
                            label={t`Add GIF`}
                            disabled={isAttachmentsFull}
                            onClick={() => setIsGifPickerOpen(true)}
                        />
                        <DmEmojiPicker onSelect={handleEmojiSelected} />
                        {tip ? (
                            <Tips
                                identity={tip.identity}
                                handle={tip.handle}
                                closeOnSuccess
                                toolbar
                                tooltipDisabled
                                onSuccess={tip.onSuccess}
                            />
                        ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                        {content.length > MESSAGE_LENGTH_COUNTER_THRESHOLD ? (
                            <span
                                className={classNames('text-[10px] font-medium', {
                                    'text-red-500': content.length >= MAX_CHAT_MESSAGE_LENGTH,
                                    'text-second': content.length < MAX_CHAT_MESSAGE_LENGTH,
                                })}
                            >
                                {content.length}/{MAX_CHAT_MESSAGE_LENGTH}
                            </span>
                        ) : null}
                        <button
                            type="button"
                            disabled={!canSend}
                            className={classNames(
                                'flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold transition-colors',
                                {
                                    'bg-fireflyBrand text-white hover:opacity-90': canSend,
                                    'cursor-not-allowed bg-transparent text-second': !canSend,
                                },
                            )}
                            onClick={handleSend}
                        >
                            <Trans>Send</Trans>
                            <SendIcon width={14} height={14} />
                        </button>
                    </div>
                </div>
            </div>
            <p className="mt-2 hidden text-center text-xs text-second md:block">
                <Trans>Press Enter to send · Shift + Enter for a new line</Trans>
            </p>
            <DmGifPicker
                open={isGifPickerOpen}
                onClose={() => setIsGifPickerOpen(false)}
                onSelect={handleGifSelected}
            />
        </div>
    );
});
