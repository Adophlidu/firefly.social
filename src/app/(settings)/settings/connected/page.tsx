'use client';

import { Trans } from '@lingui/react/macro';

import { AccountCards } from '@/app/(settings)/components/AccountCard.js';
import { FireflyAccountCard } from '@/app/(settings)/components/FireflyAccountCard.js';
import { SettingsSection } from '@/app/(settings)/components/Section.js';
import { ThirdPartAccounts } from '@/app/(settings)/components/ThirdPartAccounts.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { Source, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';

export default function Connected() {
    const isLogin = useIsLoginFirefly();

    return (
        <SettingsSection title={<Trans>Connected accounts</Trans>}>
            {!isLogin ? (
                <NotLoginFallback source={Source.Posts} />
            ) : (
                <>
                    <FireflyAccountCard />

                    <AccountCards />

                    {env.external.NEXT_PUBLIC_THIRD_PARTY_AUTH === STATUS.Enabled ? <ThirdPartAccounts /> : null}

                    <div className="flex w-full flex-col items-center justify-center gap-4 md:flex-row">
                        <ClickableButton
                            className="inline-flex h-10 w-full flex-col items-center justify-center md:w-[200px]"
                            onClick={() => {
                                openLoginModal();
                            }}
                        >
                            <div className="inline-flex h-10 items-center justify-center gap-2 self-stretch rounded-2xl border border-current py-[11px] text-main">
                                <div className="w-full text-medium font-bold leading-[18px]">
                                    <Trans>Add an existing account</Trans>
                                </div>
                            </div>
                        </ClickableButton>
                    </div>
                </>
            )}
        </SettingsSection>
    );
}
