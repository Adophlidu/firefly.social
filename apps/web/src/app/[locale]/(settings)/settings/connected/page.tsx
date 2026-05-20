'use client';

import { Source, STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { Trans } from '@lingui/react/macro';

import { AccountCards } from '@/app/[locale]/(settings)/components/AccountCard.js';
import { FireflyAccountCard } from '@/app/[locale]/(settings)/components/FireflyAccountCard.js';
import { SettingsSection } from '@/app/[locale]/(settings)/components/Section.js';
import { ThirdPartAccounts } from '@/app/[locale]/(settings)/components/ThirdPartAccounts.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
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

                    {envs.external.NEXT_PUBLIC_THIRD_PARTY_AUTH === STATUS.Enabled ? <ThirdPartAccounts /> : null}

                    <div className="flex w-full flex-col items-center justify-center gap-4 md:flex-row">
                        <ClickableButton
                            className="inline-flex h-10 w-full flex-col items-center justify-center md:w-[200px]"
                            onClick={() => {
                                openLoginModal();
                            }}
                        >
                            <div className="text-main inline-flex h-10 items-center justify-center gap-2 self-stretch rounded-2xl border border-current py-[11px]">
                                <div className="text-medium w-full font-bold leading-[18px]">
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
