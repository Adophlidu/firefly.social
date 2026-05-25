'use client';

import EditIcon from '@dimensiondev/assets/edit.svg';
import LogoutIcon from '@dimensiondev/assets/log-out.svg';
import MoreIcon from '@dimensiondev/assets/more-fill.svg';
import TrashIcon from '@dimensiondev/assets/trash.svg';
import { classNames } from '@dimensiondev/utils';
import { MenuButton as HeadlessMenuButton, MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';

import { MenuButton } from '@/components/Actions/MenuButton.js';
import { Avatar } from '@/components/Avatar.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { useAllConnections } from '@/hooks/useAllConnections.js';
import { useDeleteFireflyAccount } from '@/hooks/useDeleteFireflyAccount.js';
import { useFireflyAccountAvatar } from '@/hooks/useFireflyAccountAvatar.js';
import { EditFireflyProfileModalRef } from '@/modals/EditFireflyProfileModal/refs.js';
import { LogoutModalRef } from '@/modals/LogoutModal/refs.js';
import { captureEditProfileClickEvent } from '@/providers/telemetry/captureProfileActionEvent.js';

export function FireflyAccountCard() {
    const { data, isLoading, error } = useAllConnections();

    const account = data?.fireflyAccount;
    const avatar = useFireflyAccountAvatar();
    const [, deleteFireflyAccount] = useDeleteFireflyAccount();

    if (!isLoading && (error || !account)) return null;

    return (
        <>
            <div
                className={classNames(
                    'flex w-full items-center rounded-lg border p-2',
                    isLoading ? 'animate-pulse border-transparent' : 'border-highlight',
                )}
            >
                <div className="mr-2 size-[60px] shrink-0 rounded-full bg-bg">
                    {!isLoading ? <Avatar size={60} alt="firefly-avatar" className="!z-0" src={avatar ?? ''} /> : null}
                </div>
                <div className="mr-2 flex h-10 flex-col items-start justify-evenly text-sm font-normal leading-5">
                    <div
                        className={classNames('min-w-12', isLoading ? 'h-3' : 'h-5', {
                            'animate-pulse bg-bg': isLoading,
                        })}
                    >
                        {!isLoading
                            ? account?.displayName || (
                                  <ClickableButton
                                      className="font-semibold text-highlight hover:underline"
                                      onClick={() => {
                                          EditFireflyProfileModalRef.open({
                                              profile: account,
                                              connections: data?.__origin__,
                                          });
                                          captureEditProfileClickEvent();
                                      }}
                                  >
                                      <Trans>Edit profile</Trans>
                                  </ClickableButton>
                              )
                            : null}
                    </div>
                    <div
                        className={classNames('min-w-[120px] text-second', isLoading ? 'h-3' : 'h-5', {
                            'animate-pulse bg-bg': isLoading,
                        })}
                    >
                        {!isLoading ? <Trans>UID: {account?.uid}</Trans> : null}
                    </div>
                </div>
                <div className="ml-auto flex items-center space-x-2">
                    {isLoading ? (
                        <>
                            {new Array(2).fill(0).map((_, i) => (
                                <div key={i} className="size-5 rounded-lg bg-bg" />
                            ))}
                        </>
                    ) : (
                        <>
                            <ClickableButton
                                className="flex size-5 items-center justify-center rounded-lg text-danger"
                                onClick={() => LogoutModalRef.open()}
                            >
                                <LogoutIcon className="size-5 shrink-0" />
                            </ClickableButton>
                            <MoreActionMenu
                                className="z-10"
                                menuButton={
                                    <HeadlessMenuButton className="flex size-5 items-center justify-center rounded-lg">
                                        <MoreIcon className="size-5 shrink-0" />
                                    </HeadlessMenuButton>
                                }
                            >
                                <MenuGroup className="w-[220px]">
                                    <MenuItem>
                                        {({ close }) => (
                                            <MenuButton
                                                className="w-full"
                                                onClick={() => {
                                                    EditFireflyProfileModalRef.open({
                                                        profile: account,
                                                        connections: data?.__origin__,
                                                    });
                                                    close();
                                                    captureEditProfileClickEvent();
                                                }}
                                            >
                                                <EditIcon width={18} height={18} />
                                                <span className="font-bold leading-[22px] text-main">
                                                    <Trans>Edit profile</Trans>
                                                </span>
                                            </MenuButton>
                                        )}
                                    </MenuItem>
                                    <MenuItem>
                                        {({ close }) => (
                                            <MenuButton
                                                className="w-full"
                                                onClick={() => {
                                                    close();
                                                    deleteFireflyAccount();
                                                }}
                                            >
                                                <TrashIcon width={18} height={18} className="text-danger" />
                                                <span className="font-bold leading-[22px] text-danger">
                                                    <Trans>Delete Firefly account</Trans>
                                                </span>
                                            </MenuButton>
                                        )}
                                    </MenuItem>
                                </MenuGroup>
                            </MoreActionMenu>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
