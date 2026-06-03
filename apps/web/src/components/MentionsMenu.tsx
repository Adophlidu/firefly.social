import EditProfileIcon from '@dimensiondev/assets/edit-profile.svg';
import { SORTED_CROSS_AT_SOCIAL_SOURCES } from '@dimensiondev/constants/computed';
import { FireflyPlatform } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import type { LexicalEditor } from 'lexical';
import { compact, first } from 'lodash-es';
import { useMemo } from 'react';
import { useAsyncFn } from 'react-use';

import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { openAndWaitForCloseEditCrossAtModal } from '@/controllers/openEditCrossAtModal.js';
import { resolveSocialSourceFromFireflyPlatform } from '@/helpers/resolveSource.js';
import { stopPropagation } from '@/helpers/stopEvent.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { EditCrossAtModal } from '@/modals/EditCrossAtModal/EditCrossAtModal.js';
import { EditCrossAtModalRef } from '@/modals/EditCrossAtModal/refs.js';
import type { Profile } from '@/providers/types/Firefly.js';

interface MentionsMenuProps {
    profiles: Profile[];
    text: string;
    editor: LexicalEditor;
    isDarkMode: boolean;
    onEdit: (text: string, result: Profile[]) => void;
}

export function MentionsMenu({ editor, text, isDarkMode, onEdit, ...props }: MentionsMenuProps) {
    const compositePost = useCompositePost();
    const profiles = useMemo(() => {
        return (
            props.profiles.filter((x) =>
                compositePost.availableSources.includes(resolveSocialSourceFromFireflyPlatform(x.platform)),
            ) || []
        );
    }, [compositePost.availableSources, props.profiles]);

    const [, handleEdit] = useAsyncFn(
        async (close: () => void) => {
            const result = await openAndWaitForCloseEditCrossAtModal({
                profiles: profiles.filter((x) => x.platform !== FireflyPlatform.Wallet),
            });
            if (result && editor) {
                editor.update(() => {
                    const handles = compact(
                        SORTED_CROSS_AT_SOCIAL_SOURCES.map((source) => {
                            const profile = result.find(
                                (x) => resolveSocialSourceFromFireflyPlatform(x.platform) === source,
                            );
                            if (!profile) return;
                            return profile.handle;
                        }),
                    );
                    const targetHandle = first(handles);
                    const newText = (!targetHandle?.startsWith('@') ? `@${targetHandle}` : targetHandle) || text;
                    onEdit(newText, result);
                });
            }
            close();
        },
        [editor, onEdit, profiles, text],
    );

    if (!compositePost || profiles.length === 0) return text;

    return (
        <>
            <EditCrossAtModal ref={EditCrossAtModalRef.register} />
            <MoreActionMenu
                menuAs="span"
                className="relative"
                loginRequired={false}
                menuOnClick={stopPropagation}
                renderMenu={({ close }) => (
                    <>
                        <MenuButton
                            data-focus={false}
                            data-autofocus={false}
                            as="span"
                            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-secondaryLine bg-white py-1 pl-1 pr-[6px] leading-4 text-highlight dark:bg-black"
                            onMouseEnter={(e) => e.currentTarget.click()}
                        >
                            <span className="flex items-center -space-x-1">
                                {profiles.map(({ platform, handle }, index) => {
                                    if (!handle) return null;
                                    return platform === FireflyPlatform.Wallet ? null : (
                                        <span
                                            title={`@${handle}`}
                                            className={classNames('inline-flex items-center', {
                                                '-ml-1': index > 0 && profiles.length > 1,
                                            })}
                                            key={index}
                                        >
                                            <SocialSourceIcon
                                                source={resolveSocialSourceFromFireflyPlatform(platform)}
                                                size={16}
                                            />
                                        </span>
                                    );
                                })}
                            </span>
                            <span className="text-highlight">{text}</span>
                        </MenuButton>
                        <MenuItems
                            anchor="bottom"
                            className="z-50 origin-top-right !overflow-visible font-normal outline-none transition data-[closed]:scale-95 data-[closed]:opacity-0"
                            onMouseLeave={() => close()}
                        >
                            <div className="w-full pt-2">
                                <div className="flex w-full flex-col gap-2 overflow-y-auto rounded-[8px] bg-primaryBottom px-2 py-3 shadow-messageShadow">
                                    {profiles
                                        .filter((x) => x.platform !== FireflyPlatform.Wallet && !!x.handle)
                                        .map(({ platform, handle, platform_id }) => {
                                            return (
                                                <MenuItem key={platform_id}>
                                                    <span
                                                        className="cross-at-edit-item group flex w-[192px] cursor-pointer items-center justify-between p-2 hover:bg-secondaryBottom"
                                                        onClick={() => handleEdit(close)}
                                                    >
                                                        <span className="flex max-w-[75%] items-center gap-[6px] overflow-hidden">
                                                            <SocialSourceIcon
                                                                square
                                                                isDark={isDarkMode}
                                                                source={resolveSocialSourceFromFireflyPlatform(
                                                                    platform,
                                                                )}
                                                                size={16}
                                                                className="min-w-4"
                                                            />
                                                            <span className="truncate text-sm leading-[18px] text-main">
                                                                @{handle}
                                                            </span>
                                                        </span>
                                                        <EditProfileIcon className="cross-at-edit hidden size-4 text-main group-hover:block" />
                                                    </span>
                                                </MenuItem>
                                            );
                                        })}
                                </div>
                            </div>
                        </MenuItems>
                    </>
                )}
            />
        </>
    );
}
