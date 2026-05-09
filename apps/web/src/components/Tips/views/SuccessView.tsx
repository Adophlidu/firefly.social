'use client';

import ArrowDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import SuccessIcon from '@dimensiondev/assets/success.svg';
import { multipliedBy } from '@dimensiondev/web3/numbers';
import { formatAddress } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { rootRouteId, useMatch } from '@tanstack/react-router';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { RecipientAvatar } from '@/components/Tips/RecipientAvatar.js';
import { FIREFLY_MENTION } from '@/constants/mentions.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { formatTokenAmount } from '@/helpers/formatTokenAmount.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { getMentionCharsByIdentity } from '@/helpers/getMentionCharsByIdentity.js';
import { openWindow } from '@/helpers/openWindow.js';
import { resolveFireflyMention } from '@/helpers/resolveFireflyMention.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { addSharerParam } from '@/helpers/sharerUrl.js';
import { useCurrentFireflyAccountUID } from '@/hooks/useCurrentFireflyAccountUID.js';
import { useCurrentVisitingChannel } from '@/hooks/useCurrentVisitingChannel.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { ComposeModalRef } from '@/modals/ComposeModal/refs.js';
import { captureTipsSharePostEvent } from '@/providers/telemetry/captureTipsEvent.js';
import { useTipsStore } from '@/store/useTipsStore.js';

export function SuccessView() {
    const isLogin = useIsLoginFirefly();
    const ffid = useCurrentFireflyAccountUID();
    const { context } = useMatch({ from: rootRouteId });
    const currentChannel = useCurrentVisitingChannel();

    const { token, tokenAmount, recipient, hash, post, identity } = useTipsStore();

    const [{ loading }, sharePost] = useAsyncFn(async () => {
        try {
            if (!recipient || !isLogin) {
                context.onClose();
                return;
            }

            const fireflyProfile = post ? resolveFireflyMention(post.source) : null;
            const fireflyMention = post
                ? {
                      ...FIREFLY_MENTION,
                      content: fireflyProfile ? `@${fireflyProfile.handle}` : FIREFLY_MENTION.content,
                  }
                : FIREFLY_MENTION;

            const mentionChars = await getMentionCharsByIdentity(identity, post?.source);
            if (mentionChars) {
                ComposeModalRef.openAndWaitForClose({
                    type: post ? 'reply' : 'compose',
                    post,
                    source: post?.source,
                    channel: post ? null : currentChannel,
                    chars: [
                        'Hi ',
                        mentionChars,
                        ` , sent you some $${token?.symbol} via `,
                        fireflyMention,
                        ' ✨ Keep shinning! \r\n',
                        hash && token?.chainId ? addSharerParam(RouteResolver.tx(token.chainId, hash), ffid) : '',
                    ],
                }).then((res) => {
                    if (!res?.post || !hash) return;
                    captureTipsSharePostEvent(identity, hash);
                });
            }

            context.onClose();
        } catch (error) {
            enqueueErrorMessage(<Trans>Something went wrong, please try again.</Trans>, { error });
            throw error;
        }
    }, [context, post, recipient, token?.symbol, hash, currentChannel, identity, token?.chainId, isLogin, ffid]);

    if (!token || !recipient) return null;

    const usdValue = token.price && tokenAmount ? multipliedBy(token.price, tokenAmount).toString() : '';

    return (
        <div className="flex flex-col items-center pt-6">
            <SuccessIcon width={64} height={64} className="shrink-0" />
            <p className="text-main mt-4 text-2xl font-semibold">
                <Trans>Transaction completed!</Trans>
            </p>
            <div className="relative mt-12 w-full">
                <div className="bg-bg flex h-[68px] items-center gap-3 rounded-xl px-4">
                    {token.logo_url ? (
                        <div className="relative size-9">
                            <div
                                className="flex size-full items-center justify-center rounded-full"
                                style={{
                                    boxShadow: '0px 8px 16px 0px rgba(28, 104, 243, 0.20)',
                                    backdropFilter: 'blur(11px)',
                                }}
                            >
                                <Image
                                    width={36}
                                    height={36}
                                    alt={token.name}
                                    src={token.logo_url}
                                    className="size-full rounded-full object-cover"
                                />
                            </div>
                            {token.chainLogoUrl ? (
                                <div className="z-1 absolute -right-1 bottom-0 size-[18px] rounded-full border-2 border-white bg-white">
                                    <Image
                                        width={14}
                                        height={14}
                                        className="size-full"
                                        alt={token.chain}
                                        src={token.chainLogoUrl}
                                    />
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                        <div className="text-main flex justify-between text-lg font-semibold">
                            <span className="uppercase">{token.symbol}</span>
                            <span>{formatTokenAmount(tokenAmount)}</span>
                        </div>
                        <div className="text-second mt-1 flex justify-between text-sm">
                            <span>
                                <Trans>Send</Trans>
                            </span>
                            <span>{formatTokenUSD(usdValue)}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-bg mt-4 flex h-[68px] items-center gap-3 rounded-xl px-4">
                    <RecipientAvatar recipient={recipient} />
                    <div className="min-w-0 flex-1">
                        {!recipient.ens ? (
                            <div className="text-medium text-main break-all text-left font-medium">
                                {recipient.address}
                                {recipient.isDefault ? (
                                    <span className="text-highlight ml-1 inline-flex h-4 -translate-y-0.5 items-center rounded bg-[#DDDFFF] px-2 text-[10px] font-medium">
                                        <Trans>Primary</Trans>
                                    </span>
                                ) : null}
                            </div>
                        ) : (
                            <div className="flex flex-col items-start text-left">
                                <span className="text-medium text-main font-bold">{recipient.ens}</span>
                                <div className="flex items-center">
                                    <span className="text-second text-[13px]">
                                        {formatAddress(recipient.address, 4)}
                                    </span>
                                    {recipient.isDefault ? (
                                        <span className="text-highlight ml-1 inline-flex h-4 items-center rounded bg-[#DDDFFF] px-2 text-[10px] font-medium">
                                            <Trans>Primary</Trans>
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="border-bg bg-lightBottom absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border-2">
                    <ArrowDownIcon className="text-main" width={24} height={24} />
                </div>
            </div>
            <div className="text-medium mt-12 flex w-full gap-4 font-bold">
                {hash && token.chainId ? (
                    <ClickableButton
                        onClick={() => {
                            openWindow(RouteResolver.tx(token.chainId, hash));
                        }}
                        className="bg-secondaryLine text-main h-10 flex-1 rounded-lg"
                    >
                        <Trans>Details</Trans>
                    </ClickableButton>
                ) : null}
                <ClickableButton
                    loading={loading}
                    onClick={sharePost}
                    className="bg-main text-primaryBottom h-10 flex-1 rounded-lg"
                >
                    <Trans>Done</Trans>
                </ClickableButton>
            </div>
        </div>
    );
}
