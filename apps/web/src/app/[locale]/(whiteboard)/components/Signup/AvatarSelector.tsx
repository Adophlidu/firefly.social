import AddIcon from '@dimensiondev/assets/add-small.svg';
import CameraIcon from '@dimensiondev/assets/camera.svg';
import RefreshIcon from '@dimensiondev/assets/refresh.svg';
import SwitchAvatar from '@dimensiondev/assets/switch-avatar.svg';
import { Source } from '@dimensiondev/enums';
import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { compact } from 'lodash-es';
import {
    type ChangeEvent,
    type FunctionComponent,
    memo,
    type SVGAttributes,
    useCallback,
    useRef,
    useState,
} from 'react';
import { useAsyncFn } from 'react-use';

import { ImageWithLoading } from '@/app/[locale]/(whiteboard)/components/Signup/ImageWithLoading.js';
import { SocialAvatarSelector } from '@/app/[locale]/(whiteboard)/components/Signup/SocialAvatarSelector.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { ALLOWED_IMAGES_MIMES } from '@/constants/computed.js';
import { Image } from '@/esm/Image.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { ImageEditorModalRef } from '@/modals/ImageEditorModal/refs.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

type AvatarType = 'pfp' | 'random' | 'custom';

export interface AvatarConfig {
    url: string;
    file?: File | null;
    type: AvatarType;
}

interface AvatarSelectorProps {
    avatar: string;
    avatarType: AvatarType;
    profiles: Profile[];
    onChange: (config: AvatarConfig, name?: string) => void;
}

const MenuIcon: Record<AvatarType, FunctionComponent<SVGAttributes<SVGElement>>> = {
    pfp: SwitchAvatar,
    random: RefreshIcon,
    custom: CameraIcon,
};

export const AvatarSelector = memo<AvatarSelectorProps>(function AvatarSelector({
    avatar,
    avatarType,
    profiles,
    onChange,
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    const socialAvatar = profiles.find((p) => !!p.pfp)?.pfp;
    const [avatars, setAvatars] = useState<AvatarConfig[]>(
        compact([
            socialAvatar
                ? {
                      url: socialAvatar,
                      type: 'pfp',
                  }
                : null,
            {
                url: getStampAvatarByProfileId(Source.Firefly, crypto.randomUUID()),
                type: 'random',
            },
        ]),
    );
    const onAvatarMenuClick = useCallback(() => {
        switch (avatarType) {
            case 'pfp':
                return;
            case 'random':
                const newAvatar = getStampAvatarByProfileId(Source.Firefly, crypto.randomUUID());
                setAvatars((prev) => {
                    const existing = prev.find((item) => item.type === 'random');
                    if (existing) {
                        existing.url = newAvatar;
                        return [...prev];
                    }
                    return [...prev, { url: newAvatar, type: 'random' }];
                });
                onChange({ url: newAvatar, type: 'random', file: null });
                return;
            case 'custom':
                inputRef.current?.click();
                return;
            default:
                safeUnreachable(avatarType);
                return;
        }
    }, [avatarType, onChange]);

    const onSelectSocialAvatar = useCallback(
        (avatar: string, name: string) => {
            onChange({ url: avatar, type: 'pfp', file: null }, name);
            setAvatars((prev) => {
                const existing = prev.find((item) => item.type === 'pfp');
                if (existing) {
                    existing.url = avatar;
                    return [...prev];
                }
                return [...prev, { url: avatar, type: 'pfp' }];
            });
        },
        [onChange],
    );

    const [, onSelectFileAndEdit] = useAsyncFn(
        async (event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;

            inputRef.current!.value = ''; // Reset input value to allow re-uploading the same file
            const newAvatar = await ImageEditorModalRef.openAndWaitForClose({ file });
            if (!newAvatar) return;

            const url = URL.createObjectURL(newAvatar);
            onChange({ url, type: 'custom', file: newAvatar });
            setAvatars((prev) => {
                const existing = prev.find((item) => item.type === 'custom');
                if (existing) {
                    URL.revokeObjectURL(existing.url); // Clean up old URL

                    existing.url = url;
                    existing.file = newAvatar;
                    return [...prev];
                }
                return [...prev, { url, type: 'custom', file: newAvatar }];
            });
        },
        [onChange],
    );

    const Icon = MenuIcon[avatarType];
    const customAvatar = avatars.find((item) => item.type === 'custom');
    const customSelected = avatarType === 'custom';

    return (
        <div>
            <div className="mt-12 flex justify-center">
                <div className="relative size-32 rounded-full bg-black">
                    <ImageWithLoading
                        alt="avatar"
                        src={avatar}
                        width={128}
                        height={128}
                        wrapperClassName="h-32 w-32 overflow-hidden"
                        className="rounded-full object-cover"
                    />
                    {avatarType === 'pfp' ? (
                        profiles.length > 1 ? (
                            <SocialAvatarSelector profiles={profiles} onSelect={onSelectSocialAvatar} />
                        ) : null
                    ) : (
                        <ClickableButton
                            className="absolute bottom-0.5 right-1.5 size-7 rounded-full border-2 border-white bg-[#5E69FF] text-white"
                            onClick={onAvatarMenuClick}
                        >
                            <Icon width={24} height={24} />
                        </ClickableButton>
                    )}
                </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
                {avatars.map((item) => {
                    const selected =
                        avatarType === 'pfp'
                            ? item.type === 'pfp' && item.url === avatar
                            : avatarType === 'random'
                              ? item.type === 'random'
                              : false;
                    return item.type === 'custom' ? null : (
                        <ClickableButton
                            key={item.url}
                            className={classNames(
                                'box-content size-16 overflow-hidden rounded-full border-2',
                                selected ? 'border-[#5E69FF]' : 'border-transparent',
                            )}
                            onClick={() => onChange({ ...item, file: null })}
                        >
                            <ImageWithLoading
                                alt="avatar"
                                src={avatarType === 'random' && selected ? avatar : item.url}
                                width={64}
                                height={64}
                                wrapperClassName="h-full w-full overflow-hidden"
                                className="size-full object-cover"
                            />
                        </ClickableButton>
                    );
                })}
                <ClickableButton
                    className={classNames(
                        'box-content flex size-16 items-center justify-center overflow-hidden rounded-full border-2',
                        customSelected ? 'border-[#5E69FF]' : 'border-transparent',
                    )}
                    style={{
                        backgroundColor: 'rgba(124, 127, 163, 0.08)',
                    }}
                    onClick={() => {
                        if (customAvatar) {
                            onChange({ ...customAvatar });
                            return;
                        }
                        inputRef.current?.click();
                    }}
                >
                    {customSelected || customAvatar ? (
                        <Image
                            alt="avatar"
                            src={customSelected ? avatar : customAvatar?.url || ''}
                            width={64}
                            height={64}
                            className="size-full object-cover"
                        />
                    ) : (
                        <AddIcon width={24} height={24} />
                    )}
                </ClickableButton>
            </div>

            <input
                ref={inputRef}
                className="hidden"
                type="file"
                accept={ALLOWED_IMAGES_MIMES.join(', ')}
                onChange={onSelectFileAndEdit}
            />
        </div>
    );
});
