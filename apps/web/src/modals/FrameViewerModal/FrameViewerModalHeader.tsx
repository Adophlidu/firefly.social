import { NetworkType } from '@dimensiondev/enums';
import { delay, parseUrl } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useCallback } from 'react';
import { useAsyncFn } from 'react-use';

import { CloseButton } from '@/components/IconButton.js';
import { Image } from '@/components/Image.js';
import { ProfileVerifyBadge } from '@/components/ProfileVerifyBadge/index.js';
import { useFrameAuthor } from '@/hooks/frame/useFrameAuthor.js';
import type { FrameViewerModalOpenProps } from '@/modals/FrameViewerModal/FrameViewerModalContent.js';
import { MoreAction } from '@/modals/FrameViewerModal/FrameViewerMoreAction.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/refs.js';

interface FrameViewerModalHeaderProps {
    onClose?: () => void;
    props: FrameViewerModalOpenProps;
    setProps: React.Dispatch<React.SetStateAction<FrameViewerModalOpenProps | null>>;
}

export function FrameViewerModalHeader({ props, setProps, onClose }: FrameViewerModalHeaderProps) {
    const [{ loading: reloading }, onReload] = useAsyncFn(async () => {
        if (!props) return;

        setProps(null);
        await delay(1000);
        setProps({
            ...props,
            ready: false,
        });
    }, [props, setProps]);

    const onSwitchWallet = useCallback(() => {
        WalletConnectModalRef.open({ networkType: NetworkType.Ethereum });
    }, []);

    const { frame } = props;
    const u = parseUrl(frame.button.action.url);

    const { data: author } = useFrameAuthor(frame);

    return (
        <div className="flex h-[60px] items-center justify-between bg-lightBg px-4 py-3 text-black dark:bg-fireflyBrand dark:text-white">
            <div className="cursor-pointer">
                <CloseButton onClick={() => onClose?.()} />
            </div>
            <div className="mx-4 flex max-w-[280px] flex-1 items-center justify-center gap-2">
                {frame.x_manifest?.frame.iconUrl ? (
                    <Image
                        src={frame.x_manifest?.frame.iconUrl}
                        alt={frame.button.title}
                        width={24}
                        height={24}
                        className="rounded-md"
                    />
                ) : null}
                <div className={frame.x_manifest?.frame.iconUrl ? 'text-left' : ''}>
                    <h2 className="font-bold">{frame.x_manifest?.frame.name || frame.button.action.name}</h2>
                    {author ? (
                        <div className="flex gap-1 text-xs text-secondary">
                            <Trans>by {author.fullHandle || author.displayName}</Trans>
                            <ProfileVerifyBadge className="flex shrink-0 items-center space-x-1" profile={author} />
                        </div>
                    ) : u ? (
                        <div className="text-xs text-secondary">{u.host}</div>
                    ) : null}
                </div>
            </div>
            <div>
                <MoreAction frame={frame} disabled={reloading} onReload={onReload} onSwitchWallet={onSwitchWallet} />
            </div>
        </div>
    );
}
