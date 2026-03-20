import { EMPTY_LIST } from '@dimensiondev/constants';
import { classNames } from '@dimensiondev/utils';
import { type AutoLinkNode } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import {
    LexicalTypeaheadMenuPlugin,
    MenuOption,
    type MenuTextMatch,
    useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin.js';
import { useQuery } from '@tanstack/react-query';
import { $getSelection, $isRangeSelection, type TextNode } from 'lexical';
import { type JSX, memo, useCallback, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDebounceValue, useOnClickOutside } from 'usehooks-ts';

import { Avatar } from '@/components/Avatar.js';
import { $createMentionNode, MentionNode } from '@/components/Lexical/nodes/MentionsNode.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { Tooltip } from '@/components/Tooltip.js';
import { FireflyPlatform, type SocialSource, Source } from '@/constants/enum.js';
import { getSafeMentionQueryText } from '@/helpers/getMentionOriginalText.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { resolveSocialSourceFromFireflyPlatform } from '@/helpers/resolveSource.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { type Profile } from '@/providers/types/Firefly.js';
import { searchProfilesByKeyword } from '@/services/searchProfilesByKeyword.js';

const TRIGGERS = ['@'].join('');

const VALID_CHARS = `[a-zA-Z0-9_-]`;
const LENGTH_LIMIT = 32;
const ALIAS_LENGTH_LIMIT = 50;
const SUGGESTION_LIST_LENGTH_LIMIT = 90;

const MENTION_PATTERN = `${VALID_CHARS}{1,${LENGTH_LIMIT}}(?:\\.${VALID_CHARS}+)*\\.?`;

const AtSignMentionsRegex = new RegExp(`(^|\\s|\\()([${TRIGGERS}](${MENTION_PATTERN}))$`);

const AtSignMentionsRegexAliasRegex = new RegExp(
    `(^|\\s|\\()([${TRIGGERS}](${VALID_CHARS}{1,${ALIAS_LENGTH_LIMIT}}(?:\\.${VALID_CHARS}+)*\\.?))$`,
);

const checkForAtSignMentions = (text: string, minMatchLength: number): MenuTextMatch | null => {
    const match = AtSignMentionsRegex.exec(text) || AtSignMentionsRegexAliasRegex.exec(text);

    if (match !== null) {
        const maybeLeadingWhitespace = match[1];
        const matchingString = match[3];
        if (matchingString.length >= minMatchLength) {
            return {
                leadOffset: match.index + maybeLeadingWhitespace.length,
                matchingString,
                replaceableString: match[2],
            };
        }
    }

    return null;
};

const getPossibleQueryMatch = (text: string): MenuTextMatch | null => {
    const match = checkForAtSignMentions(text, 1);
    return match;
};

class MentionTypeaheadOption extends MenuOption {
    displayName: string;
    handle: string;
    profileId: string;
    pfp: string;
    platform: SocialSource;
    allProfile: Profile[];

    constructor(
        id: string,
        displayName: string,
        handle: string,
        pfp: string,
        platform: SocialSource,
        allProfile: Profile[],
    ) {
        super(displayName);
        this.profileId = id;
        this.handle = handle;
        this.displayName = displayName;
        this.pfp = pfp;
        this.platform = platform;
        this.allProfile = allProfile;
    }
}

interface MentionsTypeaheadMenuItemProps {
    index: number;
    isSelected: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    option: MentionTypeaheadOption;
}

const MentionsTypeaheadMenuItem = memo<MentionsTypeaheadMenuItemProps>(function MentionsTypeaheadMenuItem({
    isSelected,
    onClick,
    onMouseEnter,
    option,
}) {
    return (
        <li
            className="cursor-pointer"
            key={option.key}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            ref={option.setRefElement}
            tabIndex={-1}
        >
            <div
                className={classNames(
                    { 'bg-gray-200 dark:bg-gray-800': isSelected },
                    'm-1.5 flex items-center space-x-2 rounded-xl px-3 py-1 hover:bg-gray-200 dark:text-white dark:hover:bg-gray-800',
                )}
            >
                <Avatar alt={option.handle} className="size-7 rounded-full" src={option.pfp} size={32} />
                <div className="flex min-w-0 flex-1 justify-between">
                    <div className="flex flex-col truncate">
                        <div className="truncate text-sm">
                            <span>{option.displayName}</span>
                        </div>
                        <span className="text-xs">@{option.handle}</span>
                    </div>
                    <div className="flex items-center">
                        {option.allProfile.map((profile, index, self) => {
                            return profile.platform === FireflyPlatform.Wallet ? null : (
                                <Tooltip
                                    appendTo={() => document.body}
                                    placement="top"
                                    content={`@${profile.handle}`}
                                    key={profile.platform_id}
                                >
                                    <span>
                                        <SocialSourceIcon
                                            className={classNames('inline-flex items-center', {
                                                '-ml-1': index > 0 && self.length > 1,
                                            })}
                                            source={resolveSocialSourceFromFireflyPlatform(profile.platform)}
                                            size={20}
                                        />
                                    </span>
                                </Tooltip>
                            );
                        })}
                    </div>
                </div>
            </div>
        </li>
    );
});

export function MentionsPlugin(): JSX.Element | null {
    const isDarkMode = useIsDarkMode();
    const ref = useRef<HTMLDivElement>(null!);
    const [open, setOpen] = useState(false);
    const profileIds = useCurrentProfileIds();
    const isUpdatingMentionTag = useRef(false);
    const matchedNodeCache = useRef<AutoLinkNode | null>(null);

    const { availableSources } = useCompositePost();

    const [queryString, setQueryString] = useState<string | null>(null);
    const [editor] = useLexicalComposerContext();

    const [debounceQuery] = useDebounceValue(queryString, 1000);

    const { data, isLoading } = useQuery({
        enabled: !!debounceQuery,
        queryKey: ['searchProfiles', availableSources, debounceQuery, profileIds],
        queryFn: async () => {
            if (!debounceQuery) return EMPTY_LIST;
            const { profiles } = await searchProfilesByKeyword({
                keyword: debounceQuery,
                platforms: availableSources,
                identitySize: 50,
                twitterSize: 30,
                bskySize: 10,
                skip: {
                    twitter: !availableSources.includes(Source.Twitter),
                    bsky: !availableSources.includes(Source.Bsky),
                },
            });
            return profiles;
        },
    });

    const options = useMemo(() => {
        if (!data) return EMPTY_LIST;

        return data
            .map(({ profile, related }) => {
                const source = resolveSocialSourceFromFireflyPlatform(profile.platform);
                // Filter related profiles to only include available sources and exclude non-social platforms (Wallet)
                const filteredRelated = related.filter(
                    (p) =>
                        p.platform !== FireflyPlatform.Wallet &&
                        availableSources.includes(resolveSocialSourceFromFireflyPlatform(p.platform)),
                );
                return new MentionTypeaheadOption(
                    profile.platform_id,
                    profile.name,
                    profile.handle,
                    profile.avatar || getStampAvatarByProfileId(source, profile.platform_id) || '',
                    source,
                    filteredRelated,
                );
            })
            .slice(0, SUGGESTION_LIST_LENGTH_LIMIT);
    }, [data, availableSources]);

    const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
        minLength: 0,
    });

    const checkForMentionMatch = useCallback(
        (text: string) => {
            const { text: queryText = '', matchedNode } =
                getSafeMentionQueryText(text, editor, isUpdatingMentionTag.current) ?? {};
            const slashMatch = checkForSlashTriggerMatch(queryText, editor);

            if (matchedNode) {
                matchedNodeCache.current = matchedNode;
            }

            if (slashMatch !== null) {
                return null;
            }

            if (!open) setOpen(true);
            return getPossibleQueryMatch(queryText);
        },
        [checkForSlashTriggerMatch, editor, open],
    );

    const onSelectOption = useCallback(
        (selectedOption: MentionTypeaheadOption, nodeToReplace: null | TextNode, closeMenu: () => void) => {
            isUpdatingMentionTag.current = true;

            MentionNode.setIsDarkMode(isDarkMode);
            editor.update(
                () => {
                    const mentionNode = $createMentionNode(selectedOption.handle, selectedOption.allProfile);
                    if (matchedNodeCache.current) {
                        matchedNodeCache.current.replace(mentionNode);
                    } else if (nodeToReplace) {
                        nodeToReplace.replace(mentionNode);
                    }
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                        selection.insertText(' ');
                    }

                    closeMenu();
                    setOpen(false);
                },
                {
                    onUpdate: () => {
                        isUpdatingMentionTag.current = false;
                        matchedNodeCache.current = null;
                    },
                    discrete: true,
                },
            );
        },
        [editor, isDarkMode],
    );

    useOnClickOutside(ref, () => {
        setOpen(false);
    });

    return (
        <LexicalTypeaheadMenuPlugin<MentionTypeaheadOption>
            anchorClassName="z-50"
            menuRenderFn={(anchorElementRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => {
                return anchorElementRef.current && open && (options.length > 0 || isLoading)
                    ? createPortal(
                          <div
                              ref={ref}
                              className="bg-brand sticky z-50 mt-2 w-[300px] min-w-full rounded-xl border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
                          >
                              {isLoading ? (
                                  <div className="flex h-[260px] min-h-[260px] items-center justify-center">
                                      <LoadingIcon />
                                  </div>
                              ) : (
                                  <menu className="no-scrollbar max-h-[260px] overflow-auto">
                                      {options.map((option, i) => (
                                          <MentionsTypeaheadMenuItem
                                              index={i}
                                              isSelected={selectedIndex === i}
                                              key={option.profileId}
                                              onClick={() => {
                                                  setHighlightedIndex(i);
                                                  selectOptionAndCleanUp(option);
                                              }}
                                              onMouseEnter={() => {
                                                  setHighlightedIndex(i);
                                              }}
                                              option={option}
                                          />
                                      ))}
                                  </menu>
                              )}
                          </div>,
                          anchorElementRef.current,
                      )
                    : null;
            }}
            onSelectOption={onSelectOption}
            onQueryChange={setQueryString}
            triggerFn={checkForMentionMatch}
            options={options}
        />
    );
}
