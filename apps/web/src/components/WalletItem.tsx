'use client';

import { Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { formatAddress, isValidAddressEthereum, isValidAddressSolana } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { memo } from 'react';
import { useAsyncFn } from 'react-use';

import { ToggleMutedButton } from '@/components/Actions/ToggleMutedButton.js';
import { Avatar } from '@/components/Avatar.js';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { Link } from '@/components/Link.js';
import { enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { openLoginModalWithGuard } from '@/helpers/openLoginModal.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal/refs.js';
import { fireflyWalletProvider } from '@/providers/firefly/Wallet.js';
import type { WalletProfile } from '@/providers/types/Firefly.js';

interface WalletItemProps {
    profile: WalletProfile;
}

export const WalletItem = memo<WalletItemProps>(function WalletItem({
    profile: { address, primary_ens, avatar: ensAvatar, blocked },
}) {
    const isMuted = blocked ?? false;
    const isValidAddress = isValidAddressEthereum(address) || isValidAddressSolana(address);

    const profileLink = getProfileUrl({ source: Source.Wallet, profileId: address });
    const walletHandle = primary_ens || formatAddress(address, 10, 0);
    const avatar = ensAvatar || getStampAvatarByProfileId(Source.Wallet, address);

    const isLogin = useIsLogin();
    const mutation = useMutation({
        mutationFn: () => {
            if (isMuted) return fireflyWalletProvider.unblockWallet(address);
            return fireflyWalletProvider.blockWallet(address);
        },
    });

    const [{ loading }, onToggle] = useAsyncFn(async () => {
        if (!isLogin) {
            openLoginModalWithGuard();
            return;
        }
        if (!isMuted) {
            const confirmed = await ConfirmModalRef.openAndWaitForClose({
                title: <Trans>Mute {walletHandle}</Trans>,
                variant: 'normal',
                content: (
                    <div className="text-main">
                        <Trans>Articles from {walletHandle} will now be hidden in your home timeline</Trans>
                    </div>
                ),
            });
            if (!confirmed) return;
        }
        await mutation.mutateAsync();

        enqueueSuccessMessage(isMuted ? <Trans>Unmuted {walletHandle}.</Trans> : <Trans>Muted {walletHandle}.</Trans>);
    }, [isLogin, isMuted, mutation, walletHandle]);

    const isLoading = mutation.isPending || loading;

    return (
        <div className="mb-3 flex h-[72px] w-full items-center justify-start gap-2.5 border-b border-line text-medium text-lightMain md:p-3">
            <Link href={profileLink}>
                <Avatar src={avatar} size={48} alt={walletHandle} />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col truncate text-left">
                {primary_ens ? (
                    <Link href={profileLink} className="truncate text-lg font-bold">
                        {walletHandle}
                    </Link>
                ) : null}
                <div
                    className={classNames(
                        'flex items-center gap-1',
                        primary_ens ? 'text-second' : 'text-lg font-bold text-lightMain',
                    )}
                >
                    <Link href={profileLink} className="truncate">
                        {formatAddress(address, 10, 0)}
                    </Link>
                    <CopyTextButton text={address} />
                </div>
            </div>
            {isValidAddress ? (
                <ToggleMutedButton className="shrink-0" isMuted={isMuted} loading={isLoading} onClick={onToggle} />
            ) : null}
        </div>
    );
});
