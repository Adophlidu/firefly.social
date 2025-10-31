'use client';

import { classNames } from '@firefly/utils';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';

import EditIcon from '@/assets/edit.svg';
import LogoutIcon from '@/assets/log-out.svg';
import MoreIcon from '@/assets/more-fill.svg';
import TrashIcon from '@/assets/trash.svg';
import { Avatar } from '@/components/Avatar.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { useAllConnections } from '@/hooks/useAllConnections.js';
import { useDeleteFireflyAccount } from '@/hooks/useDeleteFireflyAccount.js';
import { useFireflyAccountAvatar } from '@/hooks/useFireflyAccountAvatar.js';
import { EditFireflyProfileModalRef } from '@/modals/EditFireflyProfileModal/EditFireflyProfileModal.js';
import { LogoutModalRef } from '@/modals/LogoutModal.js';
import { captureEditProfileClickEvent } from '@/providers/telemetry/captureProfileActionEvent.js';

export function FireflyAccountCard() {
    const { data, isLoading, error } = useAllConnections();

    const account = data?.fireflyAccount;
    const [, deleteFireflyAccount] = useDeleteFireflyAccount();
    const avatar = useFireflyAccountAvatar();

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
                            <Menu>
                                <MenuButton className="flex size-5 items-center justify-center rounded-lg">
                                    <MoreIcon className="size-5 shrink-0" />
                                </MenuButton>
                                <MenuItems
                                    transition
                                    anchor="bottom end"
                                    className="z-50 w-[220px] origin-top-right rounded-lg bg-primaryBottom py-3 font-normal shadow-messageShadow outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0"
                                >
                                    <MenuItem>
                                        {({ close }) => (
                                            <button
                                                className="flex w-full items-center whitespace-nowrap px-3 py-1 text-base font-bold"
                                                onClick={() => {
                                                    EditFireflyProfileModalRef.open({
                                                        profile: account,
                                                        connections: data?.__origin__,
                                                    });
                                                    close();
                                                    captureEditProfileClickEvent();
                                                }}
                                            >
                                                <Trans>
                                                    <EditIcon className="mr-2 size-[18px]" />
                                                    Edit profile
                                                </Trans>
                                            </button>
                                        )}
                                    </MenuItem>
                                    <MenuItem>
                                        {({ close }) => (
                                            <button
                                                className="flex w-full items-center whitespace-nowrap px-3 py-1 text-base font-bold text-danger"
                                                onClick={() => {
                                                    close();
                                                    deleteFireflyAccount();
                                                }}
                                            >
                                                <Trans>
                                                    <TrashIcon className="mr-2 size-[18px]" />
                                                    Delete Firefly account
                                                </Trans>
                                            </button>
                                        )}
                                    </MenuItem>
                                </MenuItems>
                            </Menu>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
