// cspell:ignore logreport getpoststate getpostliststate postid
import { isServer } from '@tanstack/react-query';
import urlcat from 'urlcat';

import { KeyType } from '@/constants/enum.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import type { PostListState, PostState } from '@/providers/types/Firefly.js';
import { settings } from '@/settings/index.js';

async function _getPostState(post_id: string) {
    const res = await fetchJson<PostState>(
        urlcat(settings.FIREFLY_ROOT_URL, '/v1/logreport/getpoststate', { post_id }),
    );
    return res.data;
}

async function _getPostsState(post_ids: string[]) {
    const res = await fetchJson<PostListState>(
        urlcat(settings.FIREFLY_ROOT_URL, '/v1/logreport/getpostliststate', {
            postid_list: post_ids.join(','),
        }),
    );
    return res.data;
}

export const getPostState = isServer
    ? memoizeWithRedis(_getPostState, {
          key: KeyType.PostState,
      })
    : _getPostState;

export const getPostsState = isServer
    ? memoizeWithRedis(_getPostsState, {
          key: KeyType.PostState,
      })
    : _getPostsState;
