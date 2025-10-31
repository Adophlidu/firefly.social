import { AppBskyFeedThreadgate, ComAtprotoRepoApplyWrites, RichText } from '@atproto/api';
import { TID } from '@atproto/common-web';
import { safeUnreachable } from '@firefly/utils';
import { compact, first } from 'lodash-es';

import { BskyEmbedType, RestrictionType } from '@/constants/enum.js';
import { refreshSessionAndUpdateStore } from '@/providers/bsky/refreshSessionAndUpdateStore.js';
import { resolveBskyEmbed } from '@/providers/bsky/resolveBskyEmbed.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import type { Post } from '@/providers/types/SocialMedia.js';

function resolveRestriction(
    restrictions: RestrictionType[],
):
    | Array<AppBskyFeedThreadgate.MentionRule | AppBskyFeedThreadgate.FollowingRule | AppBskyFeedThreadgate.ListRule>
    | undefined {
    if (restrictions.find((v) => v === RestrictionType.Everyone)) return;
    if (restrictions.find((v) => v === RestrictionType.Nobody)) return [];

    return compact(
        restrictions.map((restriction) => {
            switch (restriction) {
                case RestrictionType.MentionedProfiles:
                    return { $type: 'app.bsky.feed.threadgate#mentionRule' };
                case RestrictionType.OnlyPeopleYouFollow:
                    return { $type: 'app.bsky.feed.threadgate#followingRule' };
                case RestrictionType.YouFollower:
                    return { $type: 'app.bsky.feed.threadgate#followerRule' };
                case RestrictionType.Everyone:
                case RestrictionType.Nobody:
                    return null;
                default:
                    safeUnreachable(restriction);
                    return null;
            }
        }),
    );
}

async function resolvePostEmbed(post: Post, isQuote: boolean, richText?: RichText) {
    const embed = await resolveBskyEmbed(post, richText);
    if (!isQuote) return embed;

    return embed
        ? {
              $type: BskyEmbedType.RecordWithMedia,
              record: {
                  $type: BskyEmbedType.Record,
                  record: {
                      uri: post.parentContentURI,
                      cid: post.parentPostId,
                  },
              },
              media: embed,
          }
        : {
              $type: BskyEmbedType.Record,
              record: {
                  uri: post.parentContentURI,
                  cid: post.parentPostId,
              },
          };
}

interface Options {
    labels?: string[];
    langs?: string[];
    disableQuote?: boolean;
}

type PublishPostFunction = (post: Post, isQuote: boolean, options?: Options) => Promise<{ cid: string; uri: string }>;

const executePublish: PublishPostFunction = async (post, isQuote, options) => {
    const did = bskySessionHolder.agent.assertDid;
    const rkey = TID.next().toString();
    const uri = `at://${did}/app.bsky.feed.post/${rkey}`;

    const text = post.metadata.content?.content;
    const richText = text ? new RichText({ text }) : undefined;
    if (richText) {
        await richText.detectFacets(bskySessionHolder.agent);
    }

    const writes: ComAtprotoRepoApplyWrites.Create[] = [
        {
            $type: 'com.atproto.repo.applyWrites#create',
            collection: 'app.bsky.feed.post',
            rkey,
            value: {
                $type: 'app.bsky.feed.post',
                createdAt: new Date().toISOString(),
                text: richText ? richText.text : (text ?? ''),
                facets: richText ? richText.facets : undefined,
                embed: await resolvePostEmbed(post, isQuote, richText),
                reply:
                    post.parentPostId && post.parentContentURI && !isQuote
                        ? {
                              parent: { cid: post.parentPostId, uri: post.parentContentURI },
                              root:
                                  post.rootPostId && post.rootContentURI
                                      ? {
                                            cid: post.rootPostId,
                                            uri: post.rootContentURI,
                                        }
                                      : { cid: post.parentPostId, uri: post.parentContentURI },
                          }
                        : undefined,
                langs: options?.langs?.length ? options.langs.slice(0, 3) : [],
                labels: options?.labels?.length
                    ? {
                          $type: 'com.atproto.label.defs#selfLabels',
                          values: options.labels.map((label) => ({ val: label })),
                      }
                    : undefined,
            },
        },
    ];

    if (post.type !== 'Comment' && post.restrictions?.some((x) => x !== RestrictionType.Everyone)) {
        writes.push({
            $type: 'com.atproto.repo.applyWrites#create',
            collection: 'app.bsky.feed.threadgate',
            rkey,
            value: {
                $type: 'app.bsky.feed.threadgate',
                post: uri,
                createdAt: new Date().toISOString(),
                allow: resolveRestriction(post.restrictions),
                hiddenReplies: [],
            },
        });
    }

    if (post.type !== 'Comment' && options?.disableQuote) {
        writes.push({
            $type: 'com.atproto.repo.applyWrites#create',
            collection: 'app.bsky.feed.postgate',
            rkey,
            value: {
                $type: 'app.bsky.feed.postgate',
                createdAt: new Date().toISOString(),
                post: uri,
                detachedEmbeddingUris: [],
                embeddingRules: [{ $type: 'app.bsky.feed.postgate#disableRule' }],
            },
        });
    }

    const result = await bskySessionHolder.agent.com.atproto.repo.applyWrites({
        repo: did,
        writes,
        validate: true,
    });
    const postData = first(result.data?.results);
    if (!result.success || !postData) {
        throw new Error('Failed to publish post to Bsky');
    }

    return { cid: postData.cid, uri: postData.uri } as { cid: string; uri: string };
};

export const publishPostToBsky: PublishPostFunction = async (post, isQuote, options) => {
    try {
        // ensure token valid
        await refreshSessionAndUpdateStore();

        return executePublish(post, isQuote, options);
    } catch (error) {
        console.error('[Bsky] posting error', error);

        if (
            error instanceof Error &&
            'error' in error &&
            ['ExpiredToken', 'InvalidToken'].includes(error.error as string)
        ) {
            await refreshSessionAndUpdateStore(true);

            return executePublish(post, isQuote, options);
        }

        throw error;
    }
};
