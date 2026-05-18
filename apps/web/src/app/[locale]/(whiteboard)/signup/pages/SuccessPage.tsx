'use client';

import { PageRoute } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import urlcat from 'urlcat';

import { GamePlayer } from '@/app/[locale]/(whiteboard)/components/Signup/GamePlayer.js';
import { LoggedInSources } from '@/app/[locale]/(whiteboard)/components/Signup/LoggedInSources.js';
import { MusicTogglePlay } from '@/app/[locale]/(whiteboard)/components/Signup/MusicTogglePlay.js';
import { ShadowInAndOut } from '@/app/[locale]/(whiteboard)/components/Signup/ShadowInAndOut.js';
import { SquareButton } from '@/app/[locale]/(whiteboard)/components/Signup/SquareButton.js';
import { FIREFLY_MENTION } from '@/constants/mentions.js';
import { SITE_URL } from '@/constants/static.js';
import { useSearchParams } from '@/esm/navigation.js';
import { bedStead } from '@/fonts/bedStead/index.js';
import { openComposeModal } from '@/helpers/openComposeModal.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

export function SuccessPage() {
    const searchParams = useSearchParams();
    const { currentProfileSession } = useFireflyProfileStore();

    const nickname = searchParams.get('nickname') || '';
    const avatar = searchParams.get('avatar');
    const isBack = searchParams.get('isBack') === '1';
    const accountId = currentProfileSession?.profileId;

    return (
        <ShadowInAndOut className="no-scrollbar z-1 absolute inset-0 flex flex-col items-center justify-center gap-5 p-6 pt-20 sm:gap-[6.875%] md:flex-row md:pt-6">
            <MusicTogglePlay />
            <GamePlayer
                avatar={avatar ? decodeURIComponent(avatar) : ''}
                nickname={nickname ? decodeURIComponent(nickname) : undefined}
            />
            <div className="flex flex-col">
                {nickname ? (
                    <h1 className={classNames('text-[32px] text-white', bedStead.className)}>
                        {decodeURIComponent(nickname)}
                    </h1>
                ) : null}
                <p className="text-lg font-bold text-white">
                    {isBack ? (
                        <Trans>Welcome back to Firefly!</Trans>
                    ) : (
                        <Trans>Your Firefly Identity is now active.</Trans>
                    )}
                </p>
                <SquareButton
                    className="mt-6 sm:mt-12"
                    onClick={() => {
                        location.href = PageRoute.FollowingPosts;
                    }}
                >
                    <span className="text-base font-medium text-white">
                        <Trans>Explore now</Trans>
                    </span>
                </SquareButton>
                {accountId ? (
                    <SquareButton
                        colorMode="light"
                        className="mt-6"
                        onClick={() => {
                            openComposeModal({
                                type: 'compose',
                                chars: [
                                    'Create your Firefly account now! Join the Web3-native social experience. ',
                                    FIREFLY_MENTION,
                                    ' #Web3social\r\n',
                                    urlcat(SITE_URL, '/profile/:accountId', { accountId }),
                                ],
                            });
                        }}
                    >
                        <span className="text-base font-medium text-[#171717]">
                            <Trans>Share to</Trans>
                        </span>
                        <LoggedInSources />
                    </SquareButton>
                ) : null}
            </div>
        </ShadowInAndOut>
    );
}
