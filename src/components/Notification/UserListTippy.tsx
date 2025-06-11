import {
    autoUpdate,
    flip,
    offset,
    safePolygon,
    useClick,
    useDismiss,
    useFloating,
    useHover,
    useInteractions,
    useTransitionStyles,
} from '@floating-ui/react';
import { memo, type PropsWithChildren, useState } from 'react';
import { createPortal } from 'react-dom';

import { ProfileCell } from '@/components/Profile/ProfileCell.js';
import { Tippy } from '@/esm/Tippy.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface Props extends PropsWithChildren {
    users: Profile[];
    className?: string;
    open?: boolean;
    old?: boolean;
}

export const UserListTippy = memo<Props>(function UserListTippy(props) {
    const { users, className, children, old } = props;
    if (!old) return <NewTooltip {...props} />;
    return (
        <Tippy
            appendTo={() => document.body}
            maxWidth={350}
            className="tippy-card"
            placement="bottom"
            delay={[100, 0]}
            duration={1000}
            arrow={false}
            hideOnClick
            interactive
            content={
                <div
                    className="max-h-[330px] w-[346px] overflow-auto rounded-2xl border border-secondaryLine bg-primaryBottom"
                    data-hide-scrollbar
                >
                    {users.map((profile) => (
                        <ProfileCell key={profile.profileId} profile={profile} source={profile.source} />
                    ))}
                </div>
            }
        >
            <span className={className}>{children}</span>
        </Tippy>
    );
});

const NewTooltip = memo<Props>(function NewTooltip(props) {
    const { users, className, children, open } = props;
    const [isOpen, setIsOpen] = useState(false);
    const GAP = 5;
    const { refs, floatingStyles, context } = useFloating({
        placement: 'bottom',
        open: isOpen,
        onOpenChange: setIsOpen,
        whileElementsMounted: autoUpdate,
        middleware: [offset(GAP), flip()],
    });
    const dismiss = useDismiss(context);
    const click = useClick(context, {
        stickIfOpen: false,
    });
    const hover = useHover(context, {
        handleClose: safePolygon({}),
        delay: { open: 100, close: 0 },
    });
    const { isMounted, styles } = useTransitionStyles(context, {
        duration: 1000,
    });
    const { getReferenceProps, getFloatingProps } = useInteractions([hover, click, dismiss]);

    const floating = (
        <div
            data-floating-root
            ref={refs.setFloating}
            {...getFloatingProps()}
            style={{ ...floatingStyles, ...styles }}
            className="floating-box floating-card !rounded-lg !text-xs !leading-6 tracking-wide sm:block"
        >
            <div className="floating-content">
                <div
                    className="max-h-[330px] w-[346px] overflow-auto rounded-2xl border border-secondaryLine bg-primaryBottom"
                    data-hide-scrollbar
                >
                    {users.map((profile) => (
                        <ProfileCell key={profile.profileId} profile={profile} source={profile.source} />
                    ))}
                </div>
            </div>
        </div>
    );
    return (
        <span className={className} ref={refs.setReference} {...getReferenceProps()}>
            {children}
            {isMounted || open ? createPortal(floating, document.body) : undefined}
        </span>
    );
});
