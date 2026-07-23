import { type $Typed, type AppBskyFeedThreadgate, ComAtprotoRepoApplyWrites, RichText } from '@atproto/api';
import { BskyEmbedType, PostType, RestrictionType } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { compact, first } from 'lodash-es';

import { resolveBskyEmbed } from '@/providers/bsky/resolveBskyEmbed.js';
import { retryOnBskyWhenNetworkError } from '@/providers/bsky/retryOnBskyWhenNetworkError.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { TID } from '@/providers/bsky/TID.js';
import type { Post } from '@/providers/types/SocialMedia.js';

function resolveRestriction(
    restrictions: RestrictionType[],
):
    | Array<
          AppBskyFeedThreadgate.MentionRule | AppBskyFeedThreadgate.FollowingRule | AppBskyFeedThreadgate.FollowerRule
      >
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

async function resolvePostEmbed(post: Post, isQuote: boolean, richText?: RichText, signal?: AbortSignal) {
    const embed = await resolveBskyEmbed(post, richText, signal);
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

export async function publishPostToBsky(post: Post, isQuote: boolean, options?: Options, signal?: AbortSignal) {
    // Hoisted above the retry boundary: ATProto records are keyed by
    // `collection + rkey`, so `did`/`rkey`/`uri` MUST be computed once. Reusing
    // the same `rkey` on retry guarantees we never create a DUPLICATE post —
    // `applyWrites#create` fails (rather than overwrites) if the record already
    // exists, and the threadgate/postgate writes share the same `rkey`/`uri`.
    // (Edge case: if the first write committed but its response was lost to a
    // network blip, the retry surfaces that "already exists" error to the user
    // — a phantom failure, not a double post. Regenerating `rkey` per retry
    // would cause real double-posts, which is worse.)
    const did = bskySessionHolder.agent.assertDid;
    const rkey = TID.next().toString();
    const uri = `at://${did}/app.bsky.feed.post/${rkey}`;

    // Auto-retry transient transport failures (e.g. "Failed to fetch") so most
    // network blips self-heal before the user sees an error. detectFacets and
    // resolvePostEmbed/uploadBlob are safe to re-run (deterministic facets;
    // ATProto dedupes blobs by CID). The signal also stops retrying once the
    // caller is cancelled (e.g. compose modal closing).
    return retryOnBskyWhenNetworkError(2, () => publishOnce(post, isQuote, options, did, rkey, uri, signal), signal);
}

async function publishOnce(
    post: Post,
    isQuote: boolean,
    options: Options | undefined,
    did: string,
    rkey: string,
    uri: string,
    signal: AbortSignal | undefined,
) {
    const text = post.metadata.content?.content;
    const richText = text ? new RichText({ text }) : undefined;
    if (richText) {
        await richText.detectFacets(bskySessionHolder.agent);
    }

    const writes: Array<$Typed<ComAtprotoRepoApplyWrites.Create>> = [
        {
            $type: 'com.atproto.repo.applyWrites#create',
            collection: 'app.bsky.feed.post',
            rkey,
            value: {
                $type: 'app.bsky.feed.post',
                createdAt: new Date().toISOString(),
                text: richText ? richText.text : (text ?? ''),
                facets: richText ? richText.facets : undefined,
                embed: await resolvePostEmbed(post, isQuote, richText, signal),
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

    if (post.type !== PostType.Comment && post.restrictions?.some((x) => x !== RestrictionType.Everyone)) {
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

    if (post.type !== PostType.Comment && options?.disableQuote) {
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

    const result = await bskySessionHolder.agent.com.atproto.repo.applyWrites(
        {
            repo: did,
            writes,
            validate: true,
        },
        { signal },
    );
    const postData = first(result.data?.results);
    if (!result.success || !postData || !ComAtprotoRepoApplyWrites.isCreateResult(postData)) {
        throw new Error('Failed to publish post to Bsky');
    }

    return { cid: postData.cid, uri: postData.uri } as { cid: string; uri: string };
}
