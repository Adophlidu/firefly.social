import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { useAsyncFn } from 'react-use';

import EmailIcon from '@/assets/email2.svg';
import LockIcon from '@/assets/lock.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { ClearButton } from '@/components/IconButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { SendPasscodeButton } from '@/components/Login/SendPasscodeButton.js';
import { AsyncStatus } from '@/constants/enum.js';
import { AbortError } from '@/constants/error.js';
import { EMAIL_REGEX } from '@/constants/regexp.js';
import { enqueueErrorMessage, enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { useAbortController } from '@/hooks/useAbortController.js';
import { LoginModalRef } from '@/modals/controls.js';
import { createAccountByPasscode } from '@/providers/email/createAccountByPasscode.js';
import { ThirdPartySession } from '@/providers/third-party/Session.js';
import { thirdPartySessionHolder } from '@/providers/third-party/SessionHolder.js';
import type { Account } from '@/providers/types/Account.js';
import { type AccountOptions, addAccount } from '@/services/account.js';
import { useThirdPartyStateStore } from '@/store/useProfileStore.js';

async function loginEmail(createAccount: () => Promise<Account>, options?: Omit<AccountOptions, 'source'>) {
    try {
        const account = await createAccount();
        const done = await addAccount(account, {
            ...options,
            async setAsCurrent({ session }) {
                useThirdPartyStateStore.getState().__setStatus__(AsyncStatus.Pending);
                thirdPartySessionHolder.resumeSession(session as ThirdPartySession);
                useThirdPartyStateStore.getState().__setStatus__(AsyncStatus.Idle);
            },
        });
        if (done) {
            enqueueSuccessMessage(t`Your email is now connected.`);
        }

        LoginModalRef.close();
    } catch (error) {
        // skip if the error is abort error
        if (AbortError.is(error)) return;

        throw error;
    }
}

export function LoginEmail() {
    const controller = useAbortController();
    const [email, setEmail] = useState('');
    const [passcode, setPasscode] = useState('');

    const emailRef = useRef<HTMLInputElement>(null);
    const passcodeRef = useRef<HTMLInputElement>(null);

    const isValidEmail = EMAIL_REGEX.test(email);

    const isValidPasscode = passcode.length === 6 && passcode.match(/^\d+$/);

    const [{ loading }, login] = useAsyncFn(async () => {
        controller.current.renew();
        if (!isValidEmail) {
            enqueueWarningMessage(t`Sorry, the email you entered is invalid`);
            return;
        }

        if (!isValidPasscode) {
            enqueueWarningMessage(t`Sorry, the passcode you entered is invalid`);
            return;
        }

        try {
            await loginEmail(() => createAccountByPasscode(email, passcode), {
                signal: controller.current.signal,
            });
        } catch (error) {
            if (error instanceof Error) enqueueErrorMessage(t`Connection failed. ${error.message}`);
            throw error;
        }
    }, [controller, email, passcode, isValidEmail, isValidPasscode]);

    return (
        <form className="box-border flex w-[452px] flex-col items-center gap-[20px] px-6 pb-6 max-md:w-full">
            <h1 className="text-center text-xs text-second">
                <Trans>
                    Enter your email address below, and we’ll send a one-time passcode to confirm your address
                </Trans>
            </h1>
            <div className="flex w-[300px] flex-col gap-5 max-md:w-full">
                <div className="group relative mx-0 flex h-10 flex-grow items-center overflow-hidden rounded-xl bg-lightBg text-main ring-highlight focus-within:bg-bottom focus-within:ring-1">
                    <EmailIcon width={18} height={18} className="absolute left-3 shrink-0" />
                    <input
                        ref={emailRef}
                        disabled={loading}
                        type="text"
                        name="account"
                        autoFocus
                        autoComplete="off"
                        spellCheck="false"
                        placeholder={t`Your email address`}
                        className="w-full border-0 bg-transparent py-2 pl-9 placeholder-secondary focus:border-0 focus:outline-0 focus:ring-0 dark:text-input sm:text-sm sm:leading-6"
                        value={email}
                        onChange={(ev) => setEmail(ev.currentTarget.value)}
                    />
                    {email ? (
                        <ClearButton
                            type="button"
                            className="absolute right-3 hidden group-focus-within:inline-block group-hover:inline-block"
                            IconProps={{ className: 'group-hover:text-highlight group-focus-within:text-highlight' }}
                            size={16}
                            onClick={() => {
                                setEmail('');
                                emailRef.current?.focus();
                            }}
                        />
                    ) : null}
                </div>
                <div className="flex items-center justify-between gap-2">
                    <div className="group relative mx-0 flex h-10 flex-grow items-center overflow-hidden rounded-xl bg-lightBg text-main ring-highlight focus-within:bg-bottom focus-within:ring-1">
                        <LockIcon width={18} height={18} className="absolute left-3 shrink-0" />
                        <input
                            ref={passcodeRef}
                            disabled={loading}
                            type="password"
                            name="password"
                            autoComplete="off"
                            spellCheck="false"
                            placeholder={t`One-time passcode`}
                            className="w-full border-0 bg-transparent py-2 pl-9 placeholder-secondary focus:border-0 focus:outline-0 focus:ring-0 dark:text-input sm:text-sm sm:leading-6"
                            value={passcode}
                            onChange={(ev) => setPasscode(ev.currentTarget.value)}
                        />
                        {passcode ? (
                            <ClearButton
                                type="button"
                                className="absolute right-3 hidden group-focus-within:inline-block group-hover:inline-block"
                                IconProps={{
                                    className: 'group-hover:text-highlight group-focus-within:text-highlight',
                                }}
                                size={16}
                                onClick={() => {
                                    setPasscode('');
                                    passcodeRef.current?.focus();
                                }}
                            />
                        ) : null}
                    </div>
                    <SendPasscodeButton email={email} disabled={!email || !isValidEmail} />
                </div>
                <ClickableButton
                    className="flex h-[42px] w-full items-center justify-center gap-1 rounded-full border border-line bg-lightMain text-primaryBottom"
                    disabled={loading || !email || !passcode || !isValidEmail || !isValidPasscode}
                    onClick={() => login()}
                >
                    {loading ? (
                        <>
                            <Trans>Connecting</Trans>
                            <LoadingIcon className="size-[18px] text-primaryBottom" />
                        </>
                    ) : (
                        <Trans>Connect</Trans>
                    )}
                </ClickableButton>
            </div>
        </form>
    );
}
