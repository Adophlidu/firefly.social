import { Trans } from '@lingui/react/macro';
import { type HTMLProps, memo } from 'react';
import { useAsyncFn } from 'react-use';
import type { Address } from 'viem';
import { useEnsName } from 'wagmi';

import MuteIcon from '@/assets/mute.svg';
import { MenuButton } from '@/components/Actions/MenuButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { queryClient } from '@/configs/queryClient.js';
import { Source } from '@/constants/enum.js';
import { setBlockStatus } from '@/decorators/SetQueryDataForBlockProfile.js';
import { setWalletBlockStatus } from '@/decorators/SetQueryDataForBlockWallet.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { isProfilePageSource } from '@/helpers/isSource.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { resolveSourceFromUrl } from '@/helpers/resolveSource.js';
import { useFireflyIdentity } from '@/hooks/useFireflyIdentity.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { captureMuteEvent } from '@/providers/telemetry/captureMuteEvent.js';
import type { FireflyIdentity } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { muteAllSocialProfiles } from '@/services/muteAllSocialProfiles.js';

interface MuteAllProfileBaseProps extends HTMLProps<'button'> {
    identity: FireflyIdentity;
    handleOrEnsOrAddress: string;
    blocking?: boolean;
    onClose?(): void;
}

function waitForConfirmation() {
    return ConfirmModalRef.openAndWaitForClose({
        title: <Trans>Mute all</Trans>,
        content: (
            <p className="text-lightMain">
                <Trans>All posts and activities from this user will be hidden from you</Trans>
            </p>
        ),
        variant: 'normal',
    });
}

function MuteAllProfileBase({ identity, onClose, className }: MuteAllProfileBaseProps) {
    const isLogin = useIsLogin();
    const [{ loading }, handleMuteAll] = useAsyncFn(async () => {
        try {
            onClose?.();
            const confirmed = await waitForConfirmation();
            if (!confirmed) return;
            const source = identity.source;
            if (!isProfilePageSource(source)) return;
            const isMutedAll = await FireflyEndpointProvider.isProfileMutedAll(source, identity.id);
            if (!isMutedAll) {
                await FireflyEndpointProvider.muteProfileAll(identity);

                const mutedIdentities = await muteAllSocialProfiles(identity);
                const relationships = [...mutedIdentities, { snsId: identity.id, snsPlatform: identity.source }];

                relationships.forEach(({ snsId, snsPlatform }) => {
                    const source = resolveSourceFromUrl(snsPlatform);
                    const platformId = source === Source.Farcaster && typeof snsId === 'number' ? `${snsId}` : snsId;
                    queryClient.setQueryData(['profile', 'mute-all', source, platformId], true);

                    if (source === Source.Wallet) {
                        setWalletBlockStatus(snsId, true);
                    } else {
                        setBlockStatus(narrowToSocialSource(source), platformId, true);
                    }
                });
            }
            enqueueSuccessMessage(<Trans>All wallets and accounts are muted.</Trans>);
            captureMuteEvent(EventId.MUTE_ALL_SUCCESS, identity);
        } catch (error) {
            enqueueMessageFromError(error, <Trans>Failed to mute all wallets and accounts.</Trans>);
            throw error;
        }
    }, [identity, onClose]);

    if (!isLogin) return null;

    return (
        <MenuButton onClick={handleMuteAll} disabled={loading} className={className}>
            {loading ? <LoadingIcon size={18} /> : <MuteIcon width={18} height={18} />}
            <span className="font-bold leading-[22px] text-main">
                <Trans>Mute all</Trans>
            </span>
        </MenuButton>
    );
}

export const MuteAllByProfile = memo<{
    profile: Profile;
    onClose: MuteAllProfileBaseProps['onClose'];
    className?: MuteAllProfileBaseProps['className'];
}>(function MuteAllByProfile({ profile, onClose, className }) {
    const identity = useFireflyIdentity(profile.source, profile.profileId);
    return (
        <MuteAllProfileBase
            identity={identity}
            handleOrEnsOrAddress={`@${profile.handle}`}
            blocking={profile.viewerContext?.blocking}
            onClose={onClose}
            className={className}
        />
    );
});

export const MuteAllByWallet = memo<{
    address: Address;
    handle?: string;
    onClose: MuteAllProfileBaseProps['onClose'];
    className?: MuteAllProfileBaseProps['className'];
}>(function MuteAllByWallet({ address, handle, onClose, className }) {
    const identity = useFireflyIdentity(Source.Wallet, address);
    const { data: ens } = useEnsName({ address });

    return (
        <MuteAllProfileBase
            identity={identity}
            handleOrEnsOrAddress={handle?.replace('@', '') || ens || formatAddress(address, 4)}
            onClose={onClose}
            className={className}
        />
    );
});
