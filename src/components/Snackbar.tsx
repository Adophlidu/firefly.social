import { Transition } from '@headlessui/react';
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import {
    createContext,
    forwardRef,
    type HTMLAttributes,
    type JSX,
    type ReactNode,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from 'react';

import { CloseButton } from '@/components/IconButton.js';

type SnackbarVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export type SnackbarKey = string;

export type OptionsObject = Omit<Snackbar, 'id' | 'message'>;

interface Snackbar {
    id: string;
    message: SnackbarMessage;
    key?: SnackbarKey;
    preventDuplicate?: boolean;
    action?: (key: SnackbarKey) => JSX.Element;
    content?: (key: SnackbarKey, message?: SnackbarMessage) => JSX.Element;
    variant?: SnackbarVariant;
    persist?: boolean;
    duration?: number;
    anchorOrigin?: {
        vertical: 'top' | 'bottom';
        horizontal: 'left' | 'center' | 'right';
    };
    autoHide?: boolean;
    isClosing?: boolean;
    isMoving?: boolean;
    isCustom?: boolean;
}

interface SnackbarContextType {
    enqueueSnackbar: (message: SnackbarMessage, options?: OptionsObject) => string;
    closeSnackbar: (id?: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | null>(null);

export const useSnackbar = (): SnackbarContextType => {
    const ctx = useContext(SnackbarContext);
    if (!ctx) throw new Error('useSnackbar must be used within SnackbarProvider');
    return ctx;
};

interface SnackbarProviderProps {
    maxSnack: number;
    anchorOrigin: {
        vertical: 'top' | 'bottom';
        horizontal: 'left' | 'center' | 'right';
    };
    autoHideDuration: number;
    classes: Record<string, string | undefined>;
    children: ReactNode;
}

export function SnackbarProvider({ maxSnack, autoHideDuration, children }: SnackbarProviderProps) {
    const [items, setItems] = useState<Snackbar[]>([]);
    const timers = useRef<Record<string, NodeJS.Timeout>>({});
    const pausedTimers = useRef<Record<string, { remainingTime: number; startTime: number }>>({});

    const closeSnackbar = useCallback(
        (id?: string) => {
            const targetId = id || (items.length > 0 ? items[0].id : null);

            if (!targetId) return;

            // Mark the snackbar as closing to trigger the fade animation
            setItems((prev) => prev.map((s) => (s.id === targetId ? { ...s, isClosing: true } : s)));
        },
        [items],
    );

    const handleSnackbarLeave = useCallback((id: string) => {
        // After the closing animation, trigger the slide animation for remaining items
        setItems((prev) => {
            const filtered = prev.filter((s) => s.id !== id);
            // Mark remaining items as moving to trigger slide animation
            return filtered.map((s) => ({ ...s, isMoving: true }));
        });

        // Clear timer if it exists
        if (timers.current[id]) {
            clearTimeout(timers.current[id]);
            delete timers.current[id];
        }
    }, []);

    const handleSlideAnimationEnd = useCallback(() => {
        // Clear moving state after slide animation completes
        setItems((prev) => prev.map((s) => ({ ...s, isMoving: false })));
    }, []);

    const pauseTimer = useCallback(
        (id: string) => {
            if (timers.current[id]) {
                clearTimeout(timers.current[id]);
                delete timers.current[id];

                // Store the remaining time and start time for resuming
                const now = Date.now();
                const elapsed = now - (pausedTimers.current[id]?.startTime || now);
                const remainingTime = Math.max(0, (items.find((s) => s.id === id)?.duration || 0) - elapsed);

                pausedTimers.current[id] = {
                    remainingTime,
                    startTime: now,
                };
            }
        },
        [items],
    );

    const resumeTimer = useCallback(
        (id: string) => {
            const pausedTimer = pausedTimers.current[id];
            if (pausedTimer && pausedTimer.remainingTime > 0) {
                timers.current[id] = setTimeout(() => closeSnackbar(id), pausedTimer.remainingTime);
                delete pausedTimers.current[id];
            }
        },
        [closeSnackbar],
    );

    const enqueueSnackbar = useCallback(
        (message: SnackbarMessage, options: OptionsObject = {}) => {
            if (options.preventDuplicate && options.key) {
                const existing = items.find((item) => item.key === options.key);
                if (existing) {
                    // If a snackbar with the same key already exists, update it
                    setItems((prev) =>
                        prev.map((item) =>
                            item.key === options.key
                                ? { ...item, message: options.content?.(item.id, message) || message }
                                : item,
                        ),
                    );
                    return existing.id;
                }
            }

            const id = crypto.randomUUID();
            const isCustom = typeof options.content === 'function';
            const snackbar: Snackbar = {
                id,
                isCustom,
                key: options.key,
                message: isCustom ? options.content?.(id, message) : message,
                variant: options.variant || 'default',
                duration: options.duration ?? autoHideDuration ?? 10000,
                autoHide: options.autoHide ?? true,
                isClosing: false,
                isMoving: false,
            };
            setItems((prev) => [...prev, snackbar]);

            if (snackbar.duration !== null && snackbar.duration !== undefined && snackbar.autoHide) {
                timers.current[id] = setTimeout(() => closeSnackbar(id), snackbar.duration);
                // Store the start time for pause/resume functionality
                pausedTimers.current[id] = {
                    remainingTime: snackbar.duration,
                    startTime: Date.now(),
                };
            }

            return id;
        },
        [autoHideDuration, items, closeSnackbar],
    );

    const snackbarContent = useMemo(() => {
        return {
            enqueueSnackbar,
            closeSnackbar,
        };
    }, [enqueueSnackbar, closeSnackbar]);

    return (
        <SnackbarContext.Provider value={snackbarContent}>
            {children}
            <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
                {items.map((snack, index) => (
                    <Transition
                        key={snack.id}
                        show={!snack.isClosing}
                        enter="transition ease-out duration-300"
                        enterFrom="translate-x-full opacity-0"
                        enterTo="translate-x-0 opacity-100"
                        leave="transition ease-in duration-200"
                        leaveFrom="translate-x-0 opacity-100"
                        leaveTo="translate-x-full opacity-0"
                        afterLeave={() => handleSnackbarLeave(snack.id)}
                    >
                        <div
                            className="transition-all duration-300 ease-out"
                            style={{
                                transitionDelay: snack.isMoving ? `${index * 75}ms` : '0ms',
                            }}
                            onTransitionEnd={(e) => {
                                // Only handle the transform transition end for slide animations
                                if (e.propertyName === 'transform' && snack.isMoving) {
                                    handleSlideAnimationEnd();
                                }
                            }}
                        >
                            {snack.isCustom ? (
                                <div
                                    onMouseEnter={() => pauseTimer(snack.id)}
                                    onMouseLeave={() => resumeTimer(snack.id)}
                                >
                                    {snack.message}
                                </div>
                            ) : (
                                <SnackbarContent
                                    variant={snack.variant}
                                    onClose={() => closeSnackbar(snack.id)}
                                    onMouseEnter={() => pauseTimer(snack.id)}
                                    onMouseLeave={() => resumeTimer(snack.id)}
                                >
                                    {snack.message}
                                </SnackbarContent>
                            )}
                        </div>
                    </Transition>
                ))}
            </div>
        </SnackbarContext.Provider>
    );
}

const variantClasses: Record<SnackbarVariant, string> = {
    default: 'bg-gray-600 text-white',
    success: 'bg-success text-white shadow-lg',
    error: 'bg-commonDanger text-white',
    warning: 'bg-commonWarn text-white',
    info: 'bg-blue-500 text-white',
};

const variantIcons: Record<SnackbarVariant, JSX.Element> = {
    default: (
        <div className="flex size-6 items-center justify-center rounded-full">
            <InformationCircleIcon width={24} height={24} />
        </div>
    ),
    success: (
        <div className="flex size-6 items-center justify-center rounded-full">
            <CheckCircleIcon width={24} height={24} />
        </div>
    ),
    error: (
        <div className="flex size-6 items-center justify-center rounded-full">
            <XCircleIcon width={24} height={24} />
        </div>
    ),
    warning: (
        <div className="flex size-6 items-center justify-center rounded-full">
            <ExclamationCircleIcon width={24} height={24} />
        </div>
    ),
    info: (
        <div className="flex size-6 items-center justify-center rounded-full">
            <InformationCircleIcon width={24} height={24} />
        </div>
    ),
};

export type SnackbarMessage = ReactNode;

const SnackbarContent = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement> & {
        children: SnackbarMessage;
        variant?: SnackbarVariant;
        onClose?: () => void;
        onMouseEnter?: () => void;
        onMouseLeave?: () => void;
    }
>(({ children, variant = 'default', onClose, onMouseEnter, onMouseLeave, className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={`relative flex min-w-[300px] max-w-[400px] items-center justify-between rounded-lg px-4 py-3 text-sm shadow-lg ${variantClasses[variant]} ${className || ''}`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            {...props}
        >
            <div className="flex flex-1 items-center gap-3">
                {variantIcons[variant]}
                <div className="flex-1">{children}</div>
            </div>
            {onClose ? <CloseButton className="ml-4 p-2" size={16} onClick={onClose} /> : null}
        </div>
    );
});

SnackbarContent.displayName = 'SnackbarContent';
