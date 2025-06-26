import { Trans } from '@lingui/react/macro';
import urlcat from 'urlcat';

import { LoggedInSources } from '@/app/(whiteboard)/components/Signup/LoggedInSources.js';
import { MusicTogglePlay } from '@/app/(whiteboard)/components/Signup/MusicTogglePlay.js';
import { ShadowInAndOut } from '@/app/(whiteboard)/components/Signup/ShadowInAndOut.js';
import { SquareButton } from '@/app/(whiteboard)/components/Signup/SquareButton.js';
import { toggleSignupAudio } from '@/app/(whiteboard)/signup/pages/audio.js';
import FireflyCard from '@/assets/firefly-card.svg';
import { PageRoute } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/index.js';
import { FIREFLY_MENTION } from '@/constants/mentions.js';
import { useSearchParams } from '@/esm/navigation.js';
import { levelUp } from '@/fonts/index.js';
import { classNames } from '@/helpers/classNames.js';
import { ComposeModalRef } from '@/modals/controls.js';
import { useFireflyStateStore } from '@/store/useProfileStore.js';

export function SuccessPage() {
    const searchParams = useSearchParams();
    const { currentProfileSession } = useFireflyStateStore();

    const nickname = searchParams.get('nickname') || '';
    const accountId = currentProfileSession?.profileId;

    return (
        <ShadowInAndOut className="no-scrollbar absolute inset-0 z-1 flex flex-col items-center justify-center gap-5 p-6 pt-20 sm:gap-[6.875%] md:flex-row md:pt-6">
            <MusicTogglePlay />
            <FireflyCard className="w-[80vw] cursor-pointer sm:w-auto" onClick={toggleSignupAudio} />
            <div className="flex flex-col">
                {nickname ? (
                    <h1 className={classNames('text-[32px] text-white', levelUp.className)}>
                        {decodeURIComponent(nickname)}
                    </h1>
                ) : null}
                <p className="text-lg font-bold text-white">
                    <Trans>Your Firefly Identity is now active.</Trans>
                </p>
                <SquareButton
                    className="mt-6 sm:mt-12"
                    onClick={() => {
                        window.location.href = PageRoute.FollowingPosts;
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
                            ComposeModalRef.open({
                                type: 'compose',
                                chars: [
                                    'Player 1 has entered the social game 🕹️ Create your Firefly account now! Join the Web3-native social experience. ',
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
