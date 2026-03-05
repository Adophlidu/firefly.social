'use client';

import { useRef, useState } from 'react';

import { Popover } from '@/components/Popover.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { type DraggablePopoverProps, type DraggablePopoverRefType } from '@/modals/DraggablePopover/refs.js';

interface Props {
    ref: React.Ref<DraggablePopoverRefType>;
}

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
