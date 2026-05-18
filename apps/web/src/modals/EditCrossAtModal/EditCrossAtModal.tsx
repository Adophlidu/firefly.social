import ArrowDown from '@dimensiondev/assets/arrow-line-down.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import type { SocialSource } from '@dimensiondev/enums';
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { compact, isEqual, values } from 'lodash-es';
import { Fragment, type Ref, useMemo, useRef, useState } from 'react';

import { ActionButton } from '@/components/ActionButton.js';
import { CloseButton } from '@/components/IconButton.js';
import { Modal } from '@/components/Modal.js';
import { ProfileAvatar } from '@/components/ProfileAvatar.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { formatFireflyProfileToProfile } from '@/helpers/formatSearchProfile.js';
import { resolveFireflyPlatformFromSocialSource } from '@/helpers/resolveFireflyPlatform.js';
import { resolveSocialSourceFromFireflyPlatform } from '@/helpers/resolveSource.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { EditCrossAtModalRefType } from '@/modals/EditCrossAtModal/refs.js';
import { captureComposeCrossAtEvent } from '@/providers/telemetry/captureComposeEvent.js';
import type { Profile } from '@/providers/types/Firefly.js';
import { EventId } from '@/providers/types/Telemetry.js';

interface Props {
    ref: Ref<EditCrossAtModalRefType>;
}

export function EditCrossAtModal({ ref }: Props) {
    const post = useCompositePost();
    const initialHandles = useRef<Record<SocialSource, string>>({} as Record<SocialSource, string>);
    const [profiles, setProfiles] = useState<Profile[]>(EMPTY_LIST);
    const [handles, setHandles] = useState<Record<SocialSource, string>>({} as Record<SocialSource, string>);
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            setProfiles(props.profiles);
            const nextHandles = {} as Record<SocialSource, string>;
            post.availableSources.forEach((source) => {
                const profile = props.profiles.find(
                    (x) => resolveSocialSourceFromFireflyPlatform(x.platform) === source,
                );
                nextHandles[source] = profile?.handle ?? '';
            });
            initialHandles.current = nextHandles;
            setHandles(nextHandles);
        },
        onClose: (result) => {
            return result ?? profiles;
        },
    });

    const isEdited = useMemo(() => {
        if (values(handles).every((x) => x === '')) return false;
        return !isEqual(initialHandles.current, handles);
    }, [handles]);

    return (
        <Modal onClose={() => dispatch?.close()} open={open}>
            <div className="bg-primaryBottom shadow-popover relative z-10 mx-auto w-[300px] min-w-[300px] max-w-[95vw] rounded-2xl transition-all">
                <div className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-t-[12px] px-4 pt-4">
                    <CloseButton
                        onClick={() => {
                            dispatch?.close();
                        }}
                    />
                    <div className="text-main shrink grow basis-0 text-center text-lg font-bold leading-snug">
                        <Trans>Cross at handles</Trans>
                    </div>
                    <div className="relative size-6" />
                </div>
                <div className="flex flex-col items-center px-4 pb-6 pt-2">
                    <div className="text-second text-center text-sm">
                        <Trans>Choose or set the handles for cross at.</Trans>
                    </div>
                </div>

                <div className="flex flex-col gap-3 px-4 pb-6">
                    {post.availableSources.map((source) => {
                        const profile = profiles.find(
                            (x) => resolveSocialSourceFromFireflyPlatform(x.platform) === source,
                        );

                        return (
                            <div key={source} className="flex items-center gap-3">
                                <SocialSourceIcon square source={source} size={18} className="size-[18px]" />
                                <div className="border-line text-main focus-within:border-lightHighlight relative flex w-full items-center rounded-md border bg-transparent p-2 text-xl font-medium outline-none transition duration-150">
                                    <span className="text-main text-[14px] leading-[18px]">@</span>
                                    <input
                                        className="w-full border-none bg-transparent p-0 leading-[18px] outline-none focus:border-none"
                                        style={{ boxShadow: 'none' }}
                                        value={handles[source] ?? ''}
                                        pattern="[a-zA-Z0-9_.]+"
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (/^[a-zA-Z0-9_.]*$/.test(value)) {
                                                setHandles((h) => ({ ...h, [source]: value }));
                                            }
                                        }}
                                    />
                                    {profile?.related_profiles?.length && profile.related_profiles.length > 1 ? (
                                        <Popover className="relative leading-[18px]">
                                            {({ open, close }) => (
                                                <>
                                                    <PopoverButton className="outline-none">
                                                        <ArrowDown className="text-second size-4 cursor-pointer" />
                                                    </PopoverButton>
                                                    <Transition
                                                        as={Fragment}
                                                        enter="transition ease-out duration-200"
                                                        enterFrom="opacity-0 translate-y-1"
                                                        enterTo="opacity-100"
                                                        leave="transition ease-in duration-150"
                                                        leaveFrom="opacity-100"
                                                        leaveTo="opacity-0 translate-y-1"
                                                    >
                                                        <PopoverPanel className="no-scrollbar bg-primaryBottom shadow-popover absolute -left-[222px] right-0 top-[110%] z-10 max-h-60 w-full min-w-[238px] overflow-y-auto rounded-2xl py-2">
                                                            {profile.related_profiles?.map((item) => (
                                                                <div
                                                                    key={item.platform_id}
                                                                    className="hover:bg-bg flex cursor-pointer items-center gap-[14px] px-4 py-2"
                                                                    onClick={() => {
                                                                        setHandles((h) => ({
                                                                            ...h,
                                                                            [source]: item.handle,
                                                                        }));
                                                                        close();
                                                                    }}
                                                                >
                                                                    <ProfileAvatar
                                                                        profile={formatFireflyProfileToProfile(item)}
                                                                        size={30}
                                                                        className="size-[30px] rounded-full"
                                                                        enableDefaultAvatar
                                                                    />
                                                                    <div className="flex flex-col gap-1">
                                                                        <div className="text-medium text-main text-left font-medium leading-[16px]">
                                                                            {item.name}
                                                                        </div>
                                                                        <div className="text-second text-left text-sm">
                                                                            @{item.handle}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </PopoverPanel>
                                                    </Transition>
                                                </>
                                            )}
                                        </Popover>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-center px-6 pb-6">
                    <ActionButton
                        className="w-full rounded-full py-[11px] text-lg font-semibold leading-[18px]"
                        onClick={() => {
                            const newProfiles = compact(
                                post.availableSources.map((source) => {
                                    const profile = profiles.find((x) => {
                                        return resolveSocialSourceFromFireflyPlatform(x.platform) === source;
                                    });

                                    const handle = handles[source];

                                    return profile
                                        ? { ...profile, handle }
                                        : {
                                              platform: resolveFireflyPlatformFromSocialSource(source),
                                              handle,
                                              platform_id: '',
                                              name: '',
                                              hit: false,
                                              score: 0,
                                          };
                                }),
                            );
                            captureComposeCrossAtEvent(EventId.COMPOSE_CROSS_AT_EDIT_SUCCESS);
                            dispatch?.close(newProfiles);
                        }}
                        disabled={!isEdited}
                    >
                        Save
                    </ActionButton>
                </div>
            </div>
        </Modal>
    );
}
