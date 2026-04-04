import { logger } from '@/libs/Logger.js';

export type SingletonModalRefCreator<OpenProps = void, CloseProps = void> = (
    onOpen: (props: OpenProps) => void,
    onClose: (props: CloseProps) => void,
    onAbort: (error: Error) => void,
) => {
    peek: () => boolean;
    open: (props: OpenProps) => void;
    close: (props: CloseProps) => void;
    abort?: (error: Error) => void;
};

export class SingletonModal<
    OpenProps = void,
    CloseProps = void,
    T extends SingletonModalRefCreator<OpenProps, CloseProps> = SingletonModalRefCreator<OpenProps, CloseProps>,
> {
    constructor() {
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.abort = this.abort.bind(this);
        this.openAndWaitForClose = this.openAndWaitForClose.bind(this);
    }

    protected onOpen: ReturnType<T>['open'] | undefined;
    protected onClose: ReturnType<T>['close'] | undefined;
    protected onAbort: ReturnType<T>['abort'] | undefined;

    private dispatchPeek: ReturnType<T>['peek'] | undefined;
    private dispatchOpen: ReturnType<T>['open'] | undefined;
    private dispatchClose: ReturnType<T>['close'] | undefined;
    private dispatchAbort: ReturnType<T>['abort'] | undefined;

    /**
     * Register a React modal component that implemented a forwarded ref.
     * The ref item should be fed with open and close methods.
     */
    register = (creator: T | null) => {
        if (!creator) {
            this.dispatchOpen = undefined;
            this.dispatchClose = undefined;
            this.dispatchAbort = undefined;
            return;
        }

        const ref = creator(
            (props) => {
                this.onOpen?.(props);
            },
            (props) => {
                this.onClose?.(props);
            },
            (error) => {
                this.onAbort?.(error);
            },
        );
        this.dispatchPeek = ref.peek;
        this.dispatchOpen = ref.open;
        this.dispatchClose = ref.close;
        this.dispatchAbort = ref.abort;
    };

    /**
     * Peek the open state of the React modal component.
     */
    peek() {
        return this.dispatchPeek?.() ?? false;
    }

    /**
     * Open the registered modal component with props
     * @param props
     */
    open(props: OpenProps) {
        if (typeof this.dispatchOpen === 'undefined') logger.warn("[SingletonModal]: The modal hasn't registered yet.");
        this.dispatchOpen?.(props);
    }

    /**
     * Close the registered modal component with props
     * @param props
     */
    close(props: CloseProps) {
        this.dispatchClose?.(props);
    }

    /**
     * Abort the registered modal component with Error
     */
    abort(error: Error) {
        this.dispatchAbort?.(error);
    }

    /**
     * Open the registered modal component and wait for it closes
     * @param props
     */
    openAndWaitForClose(props: OpenProps): Promise<CloseProps> {
        return new Promise<CloseProps>((resolve, reject) => {
            this.open(props);
            this.onClose = (props) => resolve(props);
            this.onAbort = (error) => reject(error);
        });
    }

    __unsafe_overwrite_methods__(methods: {
        open?: (props: OpenProps) => void;
        close?: (props: CloseProps) => void;
        abort?: (error: Error) => void;
    }) {
        this.open = typeof methods.open === 'function' ? methods.open : this.open;
        this.close = typeof methods.close === 'function' ? methods.close : this.close;
        this.abort = typeof methods.abort === 'function' ? methods.abort : this.abort;
    }
}
