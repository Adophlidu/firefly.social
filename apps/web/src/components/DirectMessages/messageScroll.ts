const LATEST_MESSAGE_THRESHOLD = 80;
const MESSAGE_THREAD_HEADER_THRESHOLD = 4;

type MessageMediaElement = HTMLImageElement | HTMLVideoElement;

function isMessageMediaReady(media: MessageMediaElement) {
    return media.tagName === 'IMG' ? (media as HTMLImageElement).complete : (media as HTMLVideoElement).readyState >= 1;
}

export function observeMessageMediaReady(container: HTMLElement, onReady: () => void) {
    const pendingMedia = new Set(
        [...container.querySelectorAll<MessageMediaElement>('img, video')].filter(
            (media) => !isMessageMediaReady(media),
        ),
    );
    if (!pendingMedia.size) {
        onReady();
        return () => undefined;
    }

    let isDisposed = false;
    const listeners = new Map<MessageMediaElement, { event: 'load' | 'loadedmetadata'; handler: EventListener }>();
    const removeListeners = (media: MessageMediaElement) => {
        const listener = listeners.get(media);
        if (!listener) return;
        media.removeEventListener(listener.event, listener.handler);
        media.removeEventListener('error', listener.handler);
        listeners.delete(media);
    };
    const settle = (media: MessageMediaElement) => {
        if (isDisposed || !pendingMedia.delete(media)) return;
        removeListeners(media);
        if (!pendingMedia.size) onReady();
    };

    for (const media of pendingMedia) {
        const event = media.tagName === 'IMG' ? 'load' : 'loadedmetadata';
        const handler = () => settle(media);
        listeners.set(media, { event, handler });
        media.addEventListener(event, handler, { once: true });
        media.addEventListener('error', handler, { once: true });
        if (isMessageMediaReady(media)) settle(media);
    }

    return () => {
        isDisposed = true;

        for (const media of listeners.keys()) removeListeners(media);
    };
}

export function isNearLatestMessage(scrollHeight: number, scrollTop: number, clientHeight: number) {
    return scrollHeight - scrollTop - clientHeight <= LATEST_MESSAGE_THRESHOLD;
}

export function shouldElevateMessageThreadHeader(scrollTop: number) {
    return scrollTop > MESSAGE_THREAD_HEADER_THRESHOLD;
}

export function isDmThreadVisible(isDesktop: boolean, isMobileThreadOpen: boolean) {
    return isDesktop || isMobileThreadOpen;
}
