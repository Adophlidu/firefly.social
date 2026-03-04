import { clone, difference, uniq } from 'lodash-es';
import { type SetStateAction } from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { HOME_CHANNEL, HOME_CLUB } from '@/constants/channel.js';
import { SORTED_POLL_SOURCES, SORTED_SOCIAL_SOURCES, SUPPORTED_FRAME_SOURCES } from '@/constants/computed.js';
import { CharTag, RestrictionType, type SocialSource, Source } from '@/constants/enum.js';
import { EMPTY_LIST, MAX_FRAME_SIZE_PER_POST } from '@/constants/static.js';
import { readChars } from '@/helpers/chars.js';
import { createSelectors } from '@/helpers/createSelector.js';
import { getCurrentAvailableSources } from '@/helpers/getCurrentAvailableSources.js';
import { isValidRestrictionType } from '@/helpers/isValidRestrictionType.js';
import { matchUrls } from '@/helpers/matchUrls.js';
import { createPoll } from '@/helpers/polls.js';
import { FrameLoader } from '@/providers/frame/Loader.js';
import { OpenGraphLoader } from '@/providers/og/Loader.js';
import { type CompositePoll } from '@/providers/types/Poll.js';
import { type Channel, type Post } from '@/providers/types/SocialMedia.js';
import { type Chars } from '@/types/chars.js';
import { type ComposeType, type CompositePost, type MediaObject } from '@/types/compose.js';
import { type Frame } from '@/types/frame.js';
import { type OpenGraph } from '@/types/og.js';
import { type RedPacketPayload } from '@/types/rp.js';

// post id for tracking the current editable post
type Cursor = string;

interface ComposeBaseState {
    type: ComposeType;
    sealedSource: SocialSource | null;
    posts: CompositePost[];
    disabledSources?: SocialSource[];

    // tracking the current editable post
    cursor: Cursor;
    // tracking the current applied draft id
    currentDraftId?: string;

    // editor focus state
    focused: boolean;

    // for failed schedule post, show the title
    isFailedSchedulePost?: boolean;

    isBusy?: boolean;

    // for cloud draft with media, show alert to remind user that the media can not be retrieved
    showMediaAlert: boolean;
}

interface ComposeState extends ComposeBaseState {
    // helpers
    computed: {
        // if the current editable post is deleted
        // the next available post will be focused
        nextAvailablePost: CompositePost | null;
    };

    // operations upon the thread
    addPostInThread: () => void;
    removePostInThread: (cursor: Cursor) => void;
    updatePostInThread: (cursor: Cursor, post: SetStateAction<CompositePost>) => void;

    // switch to the current compose type (posts in thread share the same compose type)
    updateType: (type: ComposeType) => void;

    // switch to the current editable post
    updateCursor: (cursor: Cursor) => void;

    // for quote/comment, seal the parent post source
    updateSealedSource: (source: SocialSource) => void;

    // for farcaster intent, seal the sources
    updateDisabledSources: (sources: SocialSource[]) => void;

    // for failed schedule post, show the title
    updateIsFailedSchedulePost: (isFailedSchedulePost: boolean) => void;

    updateIsBusy: (isBusy: boolean) => void;

    // operations upon all posts
    enableSource: (source: SocialSource) => void;
    disableSource: (source: SocialSource) => void;
    updateSources: (sources: SocialSource[]) => void;
    updateRestriction: (restriction: RestrictionType) => void;
    updateChannel: (channel: Channel) => void;
    toggleAnonymous: (isAnonymous: boolean) => void;

    // operations upon the current editable post
    updatePostId: (source: SocialSource, postId: string, cursor?: Cursor) => void;
    updatePostError: (source: SocialSource, postError: Error, cursor?: Cursor) => void;
    updateParentPost: (source: SocialSource, parentPost: Post, cursor?: Cursor) => void;
    updateAvailableSources: (sources: SocialSource[], cursor?: Cursor) => void;
    updateChars: (charsOrUpdater: SetStateAction<Chars>, cursor?: Cursor) => void;
    updateVideos: (imagesOrUpdater: SetStateAction<MediaObject[]>, cursor?: Cursor) => void;
    removeVideo: (image: MediaObject, cursor?: Cursor) => void;
    updateImages: (videosOrUpdater: SetStateAction<MediaObject[]>, cursor?: Cursor) => void;
    addUrl: (url: string, cursor?: Cursor) => void;
    addImage: (image: MediaObject, index: number, cursor?: Cursor) => void;
    removeImage: (image: MediaObject, cursor?: Cursor) => void;
    addFrame: (frame: Frame, cursor?: Cursor) => void;
    removeUrl: (url: string, cursor?: Cursor) => void;
    removeFrame: (frame: Frame, cursor?: Cursor) => void;
    removeOpenGraph: (og: OpenGraph, cursor?: Cursor) => void;
    updateRpPayload: (value: RedPacketPayload, cursor?: Cursor) => void;
    loadComponentsFromChars: (cursor?: Cursor) => Promise<void>;
    createPoll: (cursor?: Cursor) => void;
    updatePoll: (poll: CompositePoll | null, cursor?: Cursor) => void;
    updatePollId: (pollId: string, cursor?: Cursor) => void;
    updateTwitterPollId: (pollId: string, cursor?: Cursor) => void;
    updateExcludeReplyProfileIds: (ids?: string[], cursor?: Cursor) => void;

    // reset the editor
    apply: (state: ComposeBaseState) => void;
    clear: () => void;

    updateFocused: (focused: boolean) => void;
    setShowMediaAlert: (showMediaAlert: boolean) => void;
}

export function createInitPostState(): Record<SocialSource, null> {
    return {
        [Source.Farcaster]: null,
        [Source.Lens]: null,
        [Source.Twitter]: null,
        [Source.Bsky]: null,
    };
}

export function createInitSinglePostState(cursor: Cursor): CompositePost {
    return {
        id: cursor,
        postId: createInitPostState(),
        postError: createInitPostState(),
        parentPost: createInitPostState(),
        postContentURI: createInitPostState(),
        availableSources: getCurrentAvailableSources(),
        restriction: RestrictionType.Everyone,
        isAnonymous: false,
        chars: '',
        urls: EMPTY_LIST,
        videos: EMPTY_LIST,
        images: EMPTY_LIST,
        frames: EMPTY_LIST,
        openGraphs: EMPTY_LIST,
        rpPayload: null,
        channel: {
            [Source.Farcaster]: HOME_CHANNEL,
            [Source.Lens]: HOME_CLUB,
            [Source.Twitter]: null,
            [Source.Bsky]: null,
        },
        poll: null,
    };
}

const pick = <T>(s: ComposeState, _: (post: CompositePost) => T, cursor = s.cursor): T =>
    _(s.posts.find((x) => x.id === cursor)!);

const next = (s: ComposeState, _: (post: CompositePost) => CompositePost, cursor = s.cursor): ComposeState => ({
    ...s,
    posts: s.posts.map((x) => (x.id === cursor ? _(x) : x)),
});

const initialPostCursor = crypto.randomUUID();

const useComposeStateBase = create<ComposeState, [['zustand/immer', unknown]]>(
    immer((set, get) => ({
        type: 'compose',
        sealedSource: null,
        cursor: initialPostCursor,
        focused: false,
        showMediaAlert: false,
        posts: [createInitSinglePostState(initialPostCursor)],
        computed: {
            get nextAvailablePost() {
                const { cursor, posts } = get();

                const index = posts.findIndex((x) => x.id === cursor);
                if (index === -1) return null;

                const nextPosts = posts.filter((x) => x.id !== cursor);
                if (nextPosts.length === 0) return null;

                return nextPosts[Math.max(0, index - 1)];
            },
        },
        addPostInThread: () =>
            set((state) => {
                const cursor = crypto.randomUUID();
                const index = state.posts.findIndex((x) => x.id === state.cursor);

                const nextPosts = [
                    ...state.posts.slice(0, index + 1),
                    {
                        ...createInitSinglePostState(cursor),
                        availableSources: state.posts[0].availableSources,
                        restriction: state.posts[0].restriction,
                        channel: clone(state.posts[0].channel),
                    },
                    ...state.posts.slice(index + 1), // corrected slicing here
                ];

                return {
                    ...state,
                    posts: nextPosts,
                    // focus the new added post
                    cursor,
                };
            }),
        removePostInThread: (cursor) =>
            set((state) => {
                const next = state.computed.nextAvailablePost;
                if (!next) return state;

                return {
                    ...state,
                    posts: state.posts.filter((x) => x.id !== cursor),
                    cursor: next.id,
                };
            }),
        updatePostInThread: (cursor, post) =>
            set((state) =>
                next(
                    state,
                    (x) =>
                        x.id === cursor
                            ? typeof post === 'function'
                                ? post(x)
                                : {
                                      ...x,
                                      ...post,
                                  }
                            : x,
                    cursor,
                ),
            ),
        updateCursor: (cursor) =>
            set((state) => {
                state.cursor = cursor;
            }),
        updateType: (type) =>
            set((state) => {
                state.type = type;
            }),
        updateIsFailedSchedulePost: (isFailedSchedulePost) =>
            set((state) => {
                state.isFailedSchedulePost = isFailedSchedulePost;
            }),
        updateIsBusy: (isBusy) =>
            set((state) => {
                state.isBusy = isBusy;
            }),
        updateSealedSource: (source) =>
            set((state) => {
                state.sealedSource = source;
            }),
        updateDisabledSources: (sources) =>
            set((state) => {
                state.disabledSources = sources;
            }),
        enableSource: (source) =>
            set((state) => ({
                ...state,
                posts: state.posts.map((x) => {
                    const availableSources = uniq([...x.availableSources, source]);
                    return {
                        ...x,
                        restriction: isValidRestrictionType(x.restriction, availableSources)
                            ? x.restriction
                            : RestrictionType.Everyone,
                        availableSources: SORTED_SOCIAL_SOURCES.filter((x) => availableSources.includes(x)),
                    };
                }),
            })),
        disableSource: (source) =>
            set((state) => ({
                ...state,
                posts: state.posts.map((x) => {
                    const availableSources = x.availableSources.filter((s) => s !== source);
                    return {
                        ...x,
                        availableSources: SORTED_SOCIAL_SOURCES.filter((x) => availableSources.includes(x)),
                    };
                }),
            })),
        updateSources: (sources) =>
            set((state) => ({
                ...state,
                posts: state.posts.map((x) => ({
                    ...x,
                    availableSources: SORTED_SOCIAL_SOURCES.filter((x) => sources.includes(x)),
                })),
            })),
        updateParentPost: (source, parentPost, cursor) =>
            set((state) =>
                next(
                    state,
                    (post) => ({
                        ...post,
                        parentPost: {
                            [Source.Lens]: null,
                            [Source.Farcaster]: null,
                            [Source.Twitter]: null,
                            [Source.Bsky]: null,
                            // a post can only have one parent post in specific platform
                            [source]: parentPost,
                        },
                    }),
                    cursor,
                ),
            ),
        updatePostId: (source, postId, cursor) =>
            set((state) =>
                next(
                    state,
                    (post) => ({
                        ...post,
                        postId: {
                            ...post.postId,
                            [source]: postId,
                        },
                    }),
                    cursor,
                ),
            ),
        updatePostError: (source, postError, cursor) =>
            set((state) =>
                next(
                    state,
                    (post) => ({
                        ...post,
                        postId: {
                            ...post.postId,
                            [source]: postError,
                        },
                    }),
                    cursor,
                ),
            ),
        updateRestriction: (restriction) =>
            set((state) => ({
                ...state,
                posts: state.posts.map((x) => ({
                    ...x,
                    restriction,
                })),
            })),
        toggleAnonymous: (isAnonymous) =>
            set((state) => ({
                ...state,
                posts: state.posts.map((x) => ({
                    ...x,
                    isAnonymous,
                })),
            })),
        updateChannel: (channel) =>
            set((state) => ({
                ...state,
                posts: state.posts.map((x) => ({
                    ...x,
                    channel: {
                        ...x.channel,
                        [channel.source]: channel,
                    },
                })),
            })),
        updateChars: (charsOrUpdater, cursor) =>
            set((state) =>
                next(
                    state,
                    (post) => ({
                        ...post,
                        chars: typeof charsOrUpdater === 'function' ? charsOrUpdater(post.chars) : charsOrUpdater,
                    }),
                    cursor,
                ),
            ),
        updateVideos: (videosOrUpdater, cursor) =>
            set((state) =>
                next(
                    state,
                    (post) => ({
                        ...post,
                        videos: typeof videosOrUpdater === 'function' ? videosOrUpdater(post.videos) : videosOrUpdater,
                    }),
                    cursor,
                ),
            ),
        removeVideo: (target, cursor) =>
            set((state) =>
                next(
                    state,
                    (post) => {
                        const videos = post.videos.filter((video) => video.file !== target.file);
                        return {
                            ...post,
                            videos,
                        };
                    },
                    cursor,
                ),
            ),
        updateImages: (imagesOrUpdater, cursor) =>
            set((state) =>
                next(
                    state,
                    (post) => ({
                        ...post,
                        images: typeof imagesOrUpdater === 'function' ? imagesOrUpdater(post.images) : imagesOrUpdater,
                    }),
                    cursor,
                ),
            ),
        addUrl: (url, cursor) =>
            set((state) =>
                next(
                    state,
                    (post) => {
                        const urls = Array.isArray(post.urls) ? post.urls : EMPTY_LIST;
                        if (urls.includes(url)) return post; // avoid duplicate urls
                        return {
                            ...post,
                            urls: [...urls, url],
                        };
                    },
                    cursor,
                ),
            ),
        removeUrl: (url, cursor) =>
            set((state) => next(state, (post) => ({ ...post, urls: post.urls.filter((x) => x !== url) }), cursor)),
        addImage: (image, index: number, cursor) =>
            set((state) =>
                next(
                    state,
                    (post) => {
                        const images = [...post.images];
                        images.splice(index, 0, image);
                        return {
                            ...post,
                            images,
                        };
                    },
                    cursor,
                ),
            ),
        removeImage: (target, cursor) =>
            set((state) =>
                next(
                    state,
                    (post) => {
                        const images = post.images.filter((image) => image.file !== target.file);
                        return {
                            ...post,
                            rpPayload: images.length === 0 ? null : post.rpPayload,
                            images,
                        };
                    },
                    cursor,
                ),
            ),
        addFrame: (frame, cursor) =>
            set((state) =>
                next(
                    state,
                    (post) => ({
                        ...post,
                        frames: [...post.frames, frame],
                    }),
                    cursor,
                ),
            ),
        removeFrame: (target, cursor) =>
            set((state) =>
                next(
                    state,
                    (post) => ({
                        ...post,
                        frames: post.frames.filter((frame) => frame !== target),
                    }),
                    cursor,
                ),
            ),
        removeOpenGraph: (target, cursor) =>
            set((state) =>
                next(
                    state,
                    (post) => ({
                        ...post,
                        openGraphs: post.openGraphs.filter((openGraph) => openGraph !== target),
                    }),
                    cursor,
                ),
            ),
        updateRpPayload: (payload, cursor) =>
            set((state) =>
                next(
                    state,
                    (post) => ({
                        ...post,
                        rpPayload: payload,
                    }),
                    cursor,
                ),
            ),
        updateAvailableSources: (sources, cursor) => {
            set((state) =>
                next(
                    state,
                    (post) => ({
                        ...post,
                        availableSources: sources,
                    }),
                    cursor,
                ),
            );
        },
        loadComponentsFromChars: async (cursor) => {
            const chars = pick(get(), (x) => x.chars);
            const content = readChars(chars, 'visible');

            const urls = matchUrls(content);
            const frames = await FrameLoader.occupancyLoad(urls);
            const openGraphs = await OpenGraphLoader.occupancyLoad(
                difference(urls.slice(-1), [...frames.map((x) => x.url)]),
            );

            set((state) =>
                next(
                    state,
                    (post) => ({
                        ...post,
                        frames: frames.map((x) => x.value).slice(0, MAX_FRAME_SIZE_PER_POST),
                        openGraphs: openGraphs.map((x) => x.value).slice(0, 1),
                    }),
                    cursor,
                ),
            );
        },
        createPoll: (cursor) =>
            set((state) =>
                next(
                    state,
                    (post) => ({
                        ...post,
                        poll: createPoll(),
                        // only keep the sources that support poll
                        availableSources: post.availableSources.filter((x) => SORTED_POLL_SOURCES.includes(x)),
                        chars: [
                            ...(Array.isArray(post.chars) ? post.chars : [post.chars]),
                            {
                                id: `poll-${crypto.randomUUID()}`,
                                tag: CharTag.FRAME,
                                visible: false,
                                content: '' as never,
                                sortNo: 10,
                            },
                        ],
                    }),
                    cursor,
                ),
            ),
        updatePoll: (poll, cursor) =>
            set((state) =>
                next(
                    state,
                    (post) => ({
                        ...post,
                        poll,
                        chars: !poll
                            ? (Array.isArray(post.chars) ? post.chars : [post.chars]).filter(
                                  (x) => typeof x === 'string' || x.tag !== CharTag.FRAME,
                              )
                            : post.chars,
                    }),
                    cursor,
                ),
            ),
        updatePollId: (pollId, cursor) =>
            set((state) =>
                next(
                    state,
                    (post) => ({
                        ...post,
                        chars: (Array.isArray(post.chars) ? post.chars : [post.chars]).map((x) => {
                            if (typeof x !== 'string' && x.tag === CharTag.FRAME) {
                                return { ...x, id: pollId };
                            }
                            return x;
                        }),
                        poll: post.poll
                            ? {
                                  ...post.poll,
                                  pollIds: SUPPORTED_FRAME_SOURCES.reduce(
                                      (acc, x) => (post.availableSources.includes(x) ? { ...acc, [x]: pollId } : acc),
                                      post.poll?.pollIds,
                                  ),
                              }
                            : null,
                    }),
                    cursor,
                ),
            ),
        updateTwitterPollId: (pollId, cursor) =>
            set((state) =>
                next(
                    state,
                    (post) => ({
                        ...post,
                        poll: post.poll
                            ? {
                                  ...post.poll,
                                  pollIds: {
                                      ...post.poll.pollIds,
                                      [Source.Twitter]: pollId,
                                  },
                              }
                            : null,
                    }),
                    cursor,
                ),
            ),
        updateExcludeReplyProfileIds: (excludeReplyProfileIds, cursor) =>
            set((state) => {
                return next(
                    state,
                    (post) => {
                        return {
                            ...post,
                            excludeReplyProfileIds,
                        };
                    },
                    cursor,
                );
            }),
        apply: (nextState) =>
            set((state) => {
                Object.assign(state, nextState);
            }),
        clear: () =>
            set((state) => {
                const id = crypto.randomUUID();
                const nextState = {
                    sealedSource: null,
                    type: 'compose',
                    cursor: id,
                    currentDraftId: undefined,
                    focused: false,
                    posts: [createInitSinglePostState(id)],
                    isFailedSchedulePost: false,
                    isBusy: false,
                    showMediaAlert: false,
                } satisfies ComposeBaseState;

                Object.assign(state, nextState);
            }),
        updateFocused: (focused) =>
            set((state) => {
                state.focused = focused;
            }),
        setShowMediaAlert: (showMediaAlert) =>
            set((state) => {
                state.showMediaAlert = showMediaAlert;
            }),
    })),
);

export const useComposeStateStore = createSelectors(useComposeStateBase);
