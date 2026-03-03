/* cspell:disable */

import { type AuthFactorTokenRequiredError } from '@atproto/api/dist/client/types/com/atproto/server/createSession.js';
import { AbortError, classNames, ForbiddenError, parseUrl } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAsyncFn } from 'react-use';
import { z } from 'zod';

import AtIcon from '@/assets/at.svg';
import GlobalIcon from '@/assets/global.svg';
import LockIcon from '@/assets/lock.svg';
import SecurityIcon from '@/assets/shield-security.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { ClearButton } from '@/components/IconButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { DEFAULT_SERVICE_URL } from '@/constants/bsky.js';
import { AsyncStatus, Source } from '@/constants/enum.js';
import { FireflyAlreadyBoundError } from '@/constants/error.js';
import {
    enqueueForbiddenMessage,
    enqueueMessageFromError,
    enqueueSuccessMessage,
    enqueueWarningMessage,
} from '@/helpers/enqueueMessage.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useAbortController } from '@/hooks/useAbortController.js';
import { LoginModalRef } from '@/modals/LoginModal/index.js';
import { createBskyPublicAgent } from '@/providers/bsky/createBskyAgent.js';
import { formatBskyProfile } from '@/providers/bsky/formatBskyProfile.js';
import { retryOnBskyWhenNetworkError } from '@/providers/bsky/retryOnBskyWhenNetworkError.js';
import { BskySession } from '@/providers/bsky/Session.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { type Account } from '@/providers/types/Account.js';
import { HttpsUrl } from '@/schemas/HttpsUrl.js';
import { type AccountOptions, addAccount } from '@/services/account.js';
import { bindOrRestoreFireflySession } from '@/services/bindOrRestoreFireflySession.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

async function loginBsky(createAccount: () => Promise<Account>, options?: Omit<AccountOptions, 'source'>) {
    try {
        const account = await createAccount();
        const done = await addAccount(account, {
            ...options,
            async setAsCurrent({ session }) {
                await bskySessionHolder.resumeSession(session as BskySession);
            },
        });
        if (done) {
            enqueueSuccessMessage(<Trans>Your {resolveSourceName(Source.Bsky)} account is now connected.</Trans>);
        }
        LoginModalRef.close();
    } catch (error) {
        if (AbortError.is(error)) return;
        if (error instanceof ForbiddenError) {
            enqueueForbiddenMessage();
            return;
        }
        if (error instanceof FireflyAlreadyBoundError) {
            enqueueWarningMessage(<Trans>This Bluesky account is already linked to another Firefly account.</Trans>);
            return;
        }
        throw error;
    }
}

function createBskyFullHandle(name: string, domain: string): string {
    const parsedName = (name || '').replace(/[.]+$/, '');
    const parsedDomain = (domain || '').replace(/^[.]+/, '');

    return `${parsedName}.${parsedDomain}`;
}

function formatBskyLoginIdentifier(
    username: string,
    serviceUrl: string,
    serviceDescription?: {
        availableUserDomains: string[];
    },
) {
    if (username.includes('@') || username.includes('.')) return username;

    if (serviceUrl === DEFAULT_SERVICE_URL) {
        return createBskyFullHandle(username, '.bsky.social');
    }

    if (serviceDescription && serviceDescription.availableUserDomains.length > 0) {
        const matched = serviceDescription.availableUserDomains.some((x) => username.endsWith(x));
        if (!matched) {
            username = createBskyFullHandle(username, serviceDescription.availableUserDomains[0]);
        }
    }

    return username;
}

const schema = z.object({
    account: z.string().min(1),
    password: z.string().min(1),
    serviceUrl: z.union([HttpsUrl, z.literal('')]).optional(),
    authFactorToken: z.string().optional().or(z.literal('')),
});

function createFormResolver<T extends z.ZodSchema>(schema: T) {
    return (values: z.input<T>) => {
        const result = schema.safeParse(values);

        if (result.success) {
            return {
                values: result.data,
                errors: {},
            };
        }

        const errors: Record<string, { type: string; message: string }> = {};
        result.error.issues.forEach((issue) => {
            const path = issue.path.join('.');
            errors[path] = {
                type: 'validation',
                message: issue.message,
            };
        });

        return {
            values: {},
            errors,
        };
    };
}

export function LoginBsky() {
    const controller = useAbortController();

    const resolver = useMemo(() => createFormResolver(schema), []);
    const { register, handleSubmit, watch, formState, resetField, setFocus } = useForm<z.infer<typeof schema>>({
        resolver,
        mode: 'onChange',
        defaultValues: {
            account: '',
            password: '',
            serviceUrl: '',
            authFactorToken: '',
        },
    });

    const [editServiceUrl, setEditServiceUrl] = useState(false);
    const [show2FAInput, setShow2FAInput] = useState(false);

    const { account, password, serviceUrl } = watch();

    const prevValuesRef = useRef({ account: '', password: '', serviceUrl: '' });

    const reset2FAFlow = useCallback(() => {
        setShow2FAInput(false);
        resetField('authFactorToken');
    }, [resetField]);

    useEffect(() => {
        if (show2FAInput) {
            const prevValues = prevValuesRef.current;

            if (
                account !== prevValues.account ||
                password !== prevValues.password ||
                serviceUrl !== prevValues.serviceUrl
            ) {
                reset2FAFlow();
            }
        }
        prevValuesRef.current = { account, password, serviceUrl: serviceUrl || '' };
    }, [account, password, serviceUrl, show2FAInput, resetField, setShow2FAInput, reset2FAFlow]);

    const { data: serverDescription, isLoading } = useQuery({
        enabled: !!serviceUrl && !editServiceUrl,
        queryKey: ['login-bsky', serviceUrl, editServiceUrl],
        queryFn: async ({ queryKey, signal }) => {
            const [, url, editServiceUrl] = queryKey as [string, string, boolean];
            if (!url || editServiceUrl) return null;

            // default service url
            if (url === DEFAULT_SERVICE_URL) return null;

            const u = parseUrl(url);
            if (!u) return null;

            const parsed = HttpsUrl.safeParse(url);
            if (!parsed.success) return null;

            try {
                const agent = createBskyPublicAgent(url);
                const result = await agent.com.atproto.server.describeServer(undefined, { signal });
                return result.data;
            } catch (error) {
                if (AbortError.is(error)) return null;

                enqueueWarningMessage(<Trans>Sorry, the provider you entered is invalid</Trans>);
                throw error;
            }
        },
        retry: false,
    });

    const { setAsyncStatus } = useGlobalState();
    const [{ loading }, login] = useAsyncFn(
        async (username: string, password: string, serviceUrl?: string, authFactorToken?: string) => {
            controller.current.renew();

            try {
                setAsyncStatus(Source.Bsky, AsyncStatus.Pending);

                await loginBsky(
                    async () => {
                        const serviceUrl_ = serviceUrl || DEFAULT_SERVICE_URL;
                        const agent = createBskyPublicAgent(serviceUrl_);
                        const request: {
                            identifier: string;
                            password: string;
                            allowTakendown: boolean;
                            authFactorToken?: string;
                        } = {
                            identifier: formatBskyLoginIdentifier(
                                username,
                                serviceUrl_,
                                serverDescription || undefined,
                            ),
                            password,
                            allowTakendown: true,
                        };
                        if (authFactorToken) {
                            request.authFactorToken = authFactorToken;
                        }
                        const response = await agent.com.atproto.server.createSession(request);
                        if (!response.success) throw new Error(`Failed to login username = ${username}.`);

                        const profileResponse = await retryOnBskyWhenNetworkError(2, () =>
                            agent.getProfile(
                                {
                                    actor: response.data.did,
                                },
                                {
                                    headers: { authorization: `Bearer ${response.data.accessJwt}` },
                                    signal: controller.current.signal,
                                },
                            ),
                        );
                        if (!profileResponse.success)
                            throw new Error(`Failed to get profile id = ${response.data.did}.`);

                        const now = Date.now();
                        const session = new BskySession(response.data.did, now, now, serviceUrl_, {
                            active: true,
                            ...response.data,
                        });

                        const fireflySession = await bindOrRestoreFireflySession(session, controller.current.signal);

                        return {
                            session,
                            profile: formatBskyProfile(profileResponse.data),
                            fireflySession,
                        } satisfies Account;
                    },
                    {
                        signal: controller.current.signal,
                    },
                );
            } catch (error) {
                if (
                    error instanceof Error &&
                    (error as AuthFactorTokenRequiredError).error === 'AuthFactorTokenRequired'
                ) {
                    setShow2FAInput(true);
                    setFocus('authFactorToken');
                    enqueueWarningMessage(<Trans>Please enter your 2FA confirmation code</Trans>);
                    return;
                }

                if (show2FAInput && error instanceof Error) {
                    enqueueWarningMessage(<Trans>Invalid 2FA code. Please try again.</Trans>);
                    setFocus('authFactorToken');
                    return;
                }

                if (error instanceof Error && error.message === 'Invalid identifier or password') {
                    enqueueWarningMessage(<Trans>Sorry, the username or password you entered is incorrect</Trans>);
                    setFocus('account');
                    return;
                }
                enqueueMessageFromError(error, <Trans>Oops… Something went wrong. Please try again</Trans>);
                throw error;
            } finally {
                setAsyncStatus(Source.Bsky, AsyncStatus.Idle);
            }
        },
        [controller, serverDescription, setAsyncStatus, setFocus, show2FAInput],
    );

    const isValidServiceUrl =
        !serviceUrl || serviceUrl === DEFAULT_SERVICE_URL || (!!serviceUrl && !isLoading && !!serverDescription);
    const ServiceUrlIcon = isLoading ? LoadingIcon : GlobalIcon;

    return (
        <form
            className="box-border flex w-[500px] flex-col items-center gap-3 p-6 max-md:w-full"
            onSubmit={handleSubmit((form) => {
                login(form.account, form.password, form.serviceUrl, form.authFactorToken);
            })}
        >
            <div className="flex w-[300px] flex-col gap-5 max-md:w-full">
                <h2 className="whitespace-nowrap text-xs text-second max-md:whitespace-normal">
                    <Trans>Enter your username and password to sign in instantly</Trans>
                </h2>

                <div className="group relative mx-0 flex h-10 grow items-center overflow-hidden rounded-xl bg-lightBg text-main ring-highlight focus-within:bg-bottom focus-within:ring-1">
                    <AtIcon width={18} height={18} className="absolute left-3 shrink-0" />
                    <input
                        disabled={loading}
                        type="text"
                        autoFocus
                        autoComplete="off"
                        spellCheck="false"
                        placeholder={t`Username or email address`}
                        className="w-full border-0 bg-transparent py-2 pl-9 placeholder:text-secondary focus:border-0 focus:outline-0 focus:ring-0 dark:text-input sm:text-sm sm:leading-6"
                        {...register('account', { required: true })}
                    />
                    {account ? (
                        <ClearButton
                            tabIndex={-1}
                            type="button"
                            className="absolute right-3 hidden group-focus-within:inline-block group-hover:inline-block"
                            IconProps={{ className: 'group-hover:text-highlight group-focus-within:text-highlight' }}
                            size={16}
                            onClick={() => {
                                resetField('account');
                                if (show2FAInput) reset2FAFlow();
                                setFocus('account');
                            }}
                        />
                    ) : null}
                </div>
                <div className="group relative mx-0 flex h-10 grow items-center overflow-hidden rounded-xl bg-lightBg text-main ring-highlight focus-within:bg-bottom focus-within:ring-1">
                    <LockIcon width={18} height={18} className="absolute left-3 shrink-0" />
                    <input
                        disabled={loading}
                        type="password"
                        autoComplete="off"
                        spellCheck="false"
                        placeholder={t`Account or App Password`}
                        className="w-full border-0 bg-transparent py-2 pl-9 placeholder:text-secondary focus:border-0 focus:outline-0 focus:ring-0 dark:text-input sm:text-sm sm:leading-6"
                        {...register('password', { required: true })}
                    />
                    {password ? (
                        <ClearButton
                            tabIndex={-1}
                            type="button"
                            className="absolute right-3 hidden group-focus-within:inline-block group-hover:inline-block"
                            IconProps={{ className: 'group-hover:text-highlight group-focus-within:text-highlight' }}
                            size={16}
                            onClick={() => {
                                resetField('password');
                                if (show2FAInput) reset2FAFlow();
                                setFocus('password');
                            }}
                        />
                    ) : null}
                </div>
                <div className="group relative mx-0 flex h-10 grow items-center overflow-hidden rounded-xl bg-lightBg text-main ring-highlight focus-within:bg-bottom focus-within:ring-1">
                    <ServiceUrlIcon width={18} height={18} className="absolute left-3 shrink-0" />
                    <input
                        disabled={loading}
                        type="text"
                        autoComplete="off"
                        spellCheck="false"
                        placeholder={DEFAULT_SERVICE_URL}
                        className={classNames(
                            'w-full border-0 bg-transparent py-2 pl-9 placeholder:text-secondary focus:border-0 focus:outline-0 focus:ring-0 dark:text-input sm:text-sm sm:leading-6',
                            {
                                'pointer-events-none opacity-0': !editServiceUrl,
                            },
                        )}
                        onFocus={() => {
                            setEditServiceUrl(true);
                            if (show2FAInput) reset2FAFlow();
                        }}
                        {...register('serviceUrl', {
                            required: true,
                            onBlur: () => {
                                setEditServiceUrl(false);
                            },
                        })}
                    />
                    <span
                        className={classNames(
                            'absolute w-full border-0 bg-transparent py-2 pl-9 text-left placeholder:text-secondary focus:border-0 focus:outline-0 focus:ring-0 dark:text-input sm:text-sm sm:leading-6',
                            {
                                hidden: editServiceUrl,
                            },
                        )}
                        onClick={async () => {
                            setEditServiceUrl(true);
                            setFocus('serviceUrl');
                        }}
                    >
                        {parseUrl(serviceUrl || DEFAULT_SERVICE_URL)?.hostname}
                    </span>

                    {serviceUrl ? (
                        <ClearButton
                            tabIndex={-1}
                            type="button"
                            className="absolute right-3 hidden group-focus-within:inline-block group-hover:inline-block"
                            IconProps={{ className: 'group-hover:text-highlight group-focus-within:text-highlight' }}
                            size={16}
                            onClick={async () => {
                                setEditServiceUrl(true);
                                if (show2FAInput) reset2FAFlow();
                                resetField('serviceUrl');
                                setFocus('serviceUrl');
                            }}
                        />
                    ) : null}
                </div>
                {show2FAInput ? (
                    <div className="group relative mx-0 flex h-10 grow items-center overflow-hidden rounded-xl bg-lightBg text-main ring-highlight focus-within:bg-bottom focus-within:ring-1">
                        <SecurityIcon width={18} height={18} className="absolute left-3 shrink-0" />
                        <input
                            disabled={loading}
                            type="text"
                            autoComplete="one-time-code"
                            spellCheck="false"
                            placeholder={t`2FA confirmation code`}
                            className="w-full border-0 bg-transparent py-2 pl-9 placeholder:text-secondary focus:border-0 focus:outline-0 focus:ring-0 dark:text-input sm:text-sm sm:leading-6"
                            {...register('authFactorToken')}
                        />
                        {watch('authFactorToken') ? (
                            <ClearButton
                                tabIndex={-1}
                                type="button"
                                className="absolute right-3 hidden group-focus-within:inline-block group-hover:inline-block"
                                IconProps={{
                                    className: 'group-hover:text-highlight group-focus-within:text-highlight',
                                }}
                                size={16}
                                onClick={() => {
                                    resetField('authFactorToken');
                                    setFocus('authFactorToken');
                                }}
                            />
                        ) : null}
                    </div>
                ) : null}
                <ClickableButton
                    className="flex h-[42px] w-full items-center justify-center gap-1 rounded-full border border-line bg-lightMain text-primaryBottom"
                    disabled={
                        loading ||
                        isLoading ||
                        !formState.isValid ||
                        !isValidServiceUrl ||
                        (show2FAInput && !watch('authFactorToken'))
                    }
                    type="submit"
                >
                    {loading ? (
                        <>
                            <Trans>Signing in</Trans>
                            <LoadingIcon className="size-[18px] text-primaryBottom" />
                        </>
                    ) : show2FAInput ? (
                        <Trans>Verify</Trans>
                    ) : (
                        <Trans>Sign In</Trans>
                    )}
                </ClickableButton>
            </div>
        </form>
    );
}
