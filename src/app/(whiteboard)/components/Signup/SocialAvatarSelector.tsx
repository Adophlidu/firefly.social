import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import { Fragment } from 'react';

import ColorfulLensIcon from '@/assets/lens-circle-small.svg';
import SwitchAvatar from '@/assets/switch-avatar.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { Source } from '@/constants/enum.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

interface SocialAvatarSelectorProps {
    profiles: Profile[];
    onSelect: (avatar: string, name: string) => void;
}

export function SocialAvatarSelector({ profiles, onSelect }: SocialAvatarSelectorProps) {
    return (
        <Popover as="div">
            {({ close }) => (
                <>
                    <PopoverButton className="absolute bottom-0.5 right-1.5 size-7 rounded-full border-2 border-white bg-[#5E69FF]">
                        <SwitchAvatar width={24} height={24} />
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
                        <PopoverPanel
                            portal
                            anchor="top"
                            className="no-scrollbar absolute bottom-full right-0 z-10 w-[190px] -translate-y-3 rounded-lg bg-lightBottom text-medium shadow-popover dark:border dark:border-line dark:bg-darkBottom dark:shadow-none"
                            style={{ height: profiles.length * 44 }}
                        >
                            <div>
                                {profiles.map((profile) => (
                                    <ClickableButton
                                        key={`${profile.source}-${profile.profileId}`}
                                        className="flex h-11 w-full items-center gap-2 px-4 py-3"
                                        onClick={() => {
                                            onSelect(profile.pfp, profile.displayName);
                                            close();
                                        }}
                                    >
                                        {profile.source === Source.Lens ? (
                                            <ColorfulLensIcon
                                                className="shrink-0 text-transparent [--lens-face-color:#181818]"
                                                width={24}
                                                height={24}
                                            />
                                        ) : (
                                            <SocialSourceIcon
                                                className="shrink-0"
                                                mono
                                                size={24}
                                                source={profile.source}
                                            />
                                        )}
                                        <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-lightTextMain">
                                            @{profile.handle || '-'}
                                        </span>
                                    </ClickableButton>
                                ))}
                            </div>
                        </PopoverPanel>
                    </Transition>
                </>
            )}
        </Popover>
    );
}
