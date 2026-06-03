interface DismissibleLayerEvent {
    target: EventTarget | null;
    preventDefault: () => void;
}

export function isSonnerInteractionTarget(target: EventTarget | null): boolean {
    return target instanceof Element && target.closest('[data-sonner-toaster]') !== null;
}

/** Keep Sonner toasts clickable without closing Radix Dialog / Vaul Drawer underneath. */
export function preventModalDismissOnSonner(event: DismissibleLayerEvent): void {
    if (isSonnerInteractionTarget(event.target)) {
        event.preventDefault();
    }
}
