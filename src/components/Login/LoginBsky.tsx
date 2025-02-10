/* cspell:disable */

import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { useAsyncFn } from 'react-use';

import AtIcon from '@/assets/at.svg';
import LockIcon from '@/assets/lock.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { ClearButton } from '@/components/IconButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { DEFAULT_SERVICE_URL } from '@/constants/bsky.js';
import { Source } from '@/constants/enum.js';
import { AbortError } from '@/constants/error.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { formatBskyProfile } from '@/helpers/formatBskyProfile.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useAbortController } from '@/hooks/useAbortController.js';
import { LoginModalRef } from '@/modals/controls.js';
import { BskySession } from '@/providers/bsky/Session.js';
import { createAgent } from '@/providers/bsky/SessionHolder.js';
import type { Account } from '@/providers/types/Account.js';
import { type AccountOptions, addAccount } from '@/services/account.js';

async function loginBsky(createAccount: () => Promise<Account>, options?: Omit<AccountOptions, 'source'>) {
    try {
        const account = await createAccount();
        console.log('DEBUG: login bsky', account);

        const done = await addAccount(account, options);
        if (done) enqueueSuccessMessage(t`Your ${resolveSourceName(Source.Bsky)} account is now connected.`);

        LoginModalRef.close();
    } catch (error) {
        // skip if the error is abort error
        if (AbortError.is(error)) return;

        throw error;
    }
}

export function LoginBsky() {
    const controller = useAbortController();

    const [account, setAccount] = useState('');
    const [password, setPassword] = useState('');
    const [{ loading }, login] = useAsyncFn(
        async (username: string, password: string, serviceUrl: string) => {
            await loginBsky(
                async () => {
                    controller.current.renew();
                    try {
                        const agent = createAgent(serviceUrl);

                        const response = await agent.login({
                            identifier: username,
                            password,
                        });
                        if (!response.success) throw new Error(`Failed to login username = ${username}.`);

                        const profileResponse = await agent.getProfile({
                            actor: response.data.did,
                        });
                        if (!profileResponse.success)
                            throw new Error(`Failed to get profile id = ${response.data.did}.`);

                        const session = new BskySession(response.data.did, response.data.refreshJwt, 0, 0, serviceUrl, {
                            active: true,
                            ...response.data,
                        });

                        return {
                            session,
                            profile: formatBskyProfile(profileResponse.data),
                        } satisfies Account;
                    } catch (error) {
                        enqueueMessageFromError(error, t`Oops… Something went wrong. Please try again`);
                        throw error;
                    }
                },
                {
                    skipBelongsToCheck: true,
                    skipResumeFireflyAccounts: true,
                    skipResumeFireflySession: true,
                    skipUploadFireflySession: true,
                    skipReportFarcasterSigner: true,
                    signal: controller.current.signal,
                },
            );
        },
        [controller],
    );
    const accountRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    return (
        <form className="box-border flex w-[500px] flex-col items-center gap-3 p-6">
            <div className="flex w-[300px] flex-col gap-5">
                <h1 className="whitespace-nowrap text-xs text-second">
                    Enter your username and password to log in instantly
                </h1>

                <div className="group relative mx-0 flex h-10 flex-grow items-center rounded-xl border border-transparent bg-lightBg px-3 text-main focus-within:border-highlight focus-within:bg-bottom">
                    <AtIcon width={18} height={18} className="shrink-0" />
                    <input
                        ref={accountRef}
                        type="text"
                        name="account"
                        autoFocus
                        autoComplete="off"
                        spellCheck="false"
                        placeholder={t`Username or email address`}
                        className="w-full border-0 bg-transparent py-2 placeholder-secondary focus:border-0 focus:outline-0 focus:ring-0 dark:text-input sm:text-sm sm:leading-6"
                        value={account}
                        onChange={(ev) => setAccount(ev.currentTarget.value)}
                    />
                    {account ? (
                        <ClearButton
                            type="button"
                            className="hidden group-focus-within:inline-block group-hover:inline-block"
                            IconProps={{ className: 'group-hover:text-highlight group-focus-within:text-highlight' }}
                            size={16}
                            onClick={() => {
                                setAccount('');
                                accountRef.current?.focus();
                            }}
                        />
                    ) : null}
                </div>
                <div className="group relative mx-0 flex h-10 flex-grow items-center rounded-xl border border-transparent bg-lightBg px-3 text-main focus-within:border-highlight focus-within:bg-bottom">
                    <LockIcon width={18} height={18} className="shrink-0" />
                    <input
                        ref={passwordRef}
                        type="password"
                        name="password"
                        autoComplete="off"
                        spellCheck="false"
                        placeholder={t`Password`}
                        className="w-full border-0 bg-transparent py-2 placeholder-secondary focus:border-0 focus:outline-0 focus:ring-0 dark:text-input sm:text-sm sm:leading-6"
                        value={password}
                        onChange={(ev) => setPassword(ev.currentTarget.value)}
                    />
                    {password ? (
                        <ClearButton
                            type="button"
                            className="hidden group-focus-within:inline-block group-hover:inline-block"
                            IconProps={{ className: 'group-hover:text-highlight group-focus-within:text-highlight' }}
                            size={16}
                            onClick={() => {
                                setPassword('');
                                passwordRef.current?.focus();
                            }}
                        />
                    ) : null}
                </div>
                <ClickableButton
                    className="flex h-[42px] w-full items-center justify-center gap-1 rounded-full border border-line bg-lightMain text-primaryBottom"
                    disabled={loading || !account || !password}
                    onClick={() => login(account, password, DEFAULT_SERVICE_URL)}
                >
                    <Trans>Login</Trans>
                    {loading ? <LoadingIcon className="h-[18px] w-[18px] text-primaryBottom" /> : null}
                </ClickableButton>
            </div>
        </form>
    );
}
