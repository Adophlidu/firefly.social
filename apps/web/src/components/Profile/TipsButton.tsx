'use client';

import TipsIcon from '@dimensiondev/assets/tips.svg';
import { Source } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { openLoginModalWithGuard } from '@/controllers/openLoginModal.js';
import { openTipsModal } from '@/controllers/openTipsModal.js';
import { enqueueInfoMessage } from '@/helpers/enqueueMessage.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import type { FireflyIdentity, FireflyProfile } from '@/providers/types/Firefly.js';

interface Props {
    identity: FireflyIdentity;
    handle?: string | null;
    profiles?: FireflyProfile[];
}

export function TipsButton({ identity, handle, profiles }: Props) {
    const isLogin = useIsLoginFirefly();
    const [{ loading }, handleClick] = useAsyncFn(async () => {
        try {
            if (!isLogin) {
                openLoginModalWithGuard({ source: narrowToSocialSource(identity.source) });
                return;
            }
            if (!profiles?.some((profile) => profile.identity.source === Source.Wallet)) {
                throw new Error('No available profiles');
            }
            openTipsModal({
                identity,
                handle: handle ?? null,
                profiles,
            });
        } catch (error) {
            enqueueInfoMessage(
                <Trans>Sorry, we are not able to find a wallet for {handle ? '@' + handle : identity.id}.</Trans>,
            );
            throw error;
        }
    }, [isLogin, handle, profiles, identity]);
    return (
        <ClickableButton
            className="inline-flex size-8 items-center justify-center rounded-lg bg-bg text-second active:opacity-50 md:hover:opacity-60"
            loading={loading}
            onClick={handleClick}
        >
            <TipsIcon />
        </ClickableButton>
    );
}
