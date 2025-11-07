'use client';

import { type ReactNode, useRef, useState } from 'react';

import { Popover } from '@/components/Popover.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

interface DraggablePopoverProps {
    backdrop?: boolean;
    content?: ReactNode;
    enableOverflow?: boolean;
    onClose?: () => void;
}
type Props = {
    ref: React.Ref<SingletonModalRefCreator<DraggablePopoverProps>>;
};

export function DraggablePopover({ ref }: Props) {
    const [props, setProps] = useState<DraggablePopoverProps>();
    const timerRef = useRef<NodeJS.Timeout>(undefined);

    const [open, dispatch] = useSingletonModal(ref, {
        onOpen(props) {
            clearTimeout(timerRef.current);
            setProps({
                ...props,
                backdrop: props.backdrop ?? true,
                enableOverflow: props.enableOverflow ?? true,
            });
        },
        onClose() {
            props?.onClose?.();
            timerRef.current = setTimeout(() => {
                setProps(undefined);
            }, 200); // 200, duration of popover leaving
        },
    });

    if (!props) return null;

    return (
        <Popover
            open={open}
            enableBackdrop={props.backdrop}
            onClose={() => dispatch?.close()}
            enableOverflow={props.enableOverflow}
        >
            {props.content}
        </Popover>
    );
}

export const DraggablePopoverRef = new SingletonModal<DraggablePopoverProps>();
