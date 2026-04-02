'use client';

import FlagIcon from '@dimensiondev/assets/flag.svg';
import { Trans } from '@lingui/react/macro';

import { MenuButton } from '@/components/Actions/MenuButton.js';
import { type ClickableButtonProps } from '@/components/ClickableButton.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal/refs.js';
import { type Post } from '@/providers/types/SocialMedia.js';

interface Props extends Omit<ClickableButtonProps, 'children'> {
    post: Post;
    onReport?(post: Post): Promise<boolean>;
}

export function ReportPostButton({ post, ref, onReport, onClick, ...rest }: Props) {
    return (
        <MenuButton
            {...rest}
            onClick={async (event) => {
                onClick?.(event);
                const confirmed = await ConfirmModalRef.openAndWaitForClose({
                    title: <Trans>Report post</Trans>,
                    content: (
                        <div className="text-main">
                            <Trans>Are you sure you want to report this post?</Trans>
                        </div>
                    ),
                    variant: 'normal',
                });
                if (!confirmed || !onReport) return;
                await onReport(post);
            }}
            ref={ref}
        >
            <FlagIcon width={18} height={18} />
            <span className="font-bold leading-[22px] text-main">
                <Trans>Report post</Trans>
            </span>
        </MenuButton>
    );
}
