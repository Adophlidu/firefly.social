import { Trans } from '@lingui/react/macro';
import { memo, type ReactNode } from 'react';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { resolveAppKitNetworkName } from '@/helpers/resolveAppKitNetworkName.js';
import { WalletConnectContext } from '@/hooks/useWalletConnectContext.js';
import type { ChainNamespace } from '@/types/utility.js';

interface WalletItemProps extends ClickableButtonProps {
    icon?: string;
    name?: string;
    chains?: ChainNamespace[];
    installed: boolean;
    tagIcon?: ReactNode;
    connected?: boolean;
}

export const WalletItem = memo<WalletItemProps>(function WalletItem({
    icon,
    name,
    installed,
    chains,
    tagIcon,
    connected,
    ...rest
}) {
    const { chainNamespace } = WalletConnectContext.useContainer();

    return (
        <ClickableButton
            {...rest}
            className="border-secondaryLine even:bg-lightBg flex w-full cursor-pointer items-center gap-2 rounded-lg border p-2"
        >
            <Image
                src={icon?.trim() || ''}
                alt={name || 'Unknown'}
                fallback="avatar"
                width={40}
                height={40}
                className="border-secondaryLine size-10 rounded-xl border"
            />
            <div className="flex flex-1 flex-col items-start text-sm">
                <span className="text-main">{name || 'Unknown'}</span>
                {!chains?.length || chainNamespace ? null : chains.length === 1 ? (
                    <span className="text-secondary">
                        <Trans>Only {resolveAppKitNetworkName(chains[0])}</Trans>
                    </span>
                ) : (
                    <span className="text-secondary">
                        {chains
                            .sort((chain) => (chain === 'eip155' ? -1 : 1))
                            .map((x) => resolveAppKitNetworkName(x))
                            .join(' & ')}
                    </span>
                )}
            </div>
            {tagIcon ? (
                tagIcon
            ) : installed || connected ? (
                <span className="bg-success/20 text-success flex h-7 items-center rounded px-1 text-sm">
                    {connected ? <Trans>Connected</Trans> : <Trans>Installed</Trans>}
                </span>
            ) : null}
        </ClickableButton>
    );
});
