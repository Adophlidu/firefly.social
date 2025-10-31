import { nativeBridgeProvider } from '@firefly/native-bridge';
import { type Mention, type RequestArguments, SupportedMethod } from '@firefly/native-bridge';
import { useCallback } from 'react';

import { ComposeModalRef } from '@/modals/ComposeModal.js';
import { type Chars } from '@/types/chars.js';

export function useActivityCompose() {
    return useCallback((chars: Chars) => {
        if (nativeBridgeProvider.supported) {
            const params = Array.isArray(chars)
                ? chars.reduce<Omit<RequestArguments[SupportedMethod.COMPOSE], 'activity'>>(
                      (acc, part) => {
                          if (typeof part === 'string') {
                              acc.text += part;
                          } else {
                              acc.text += part.content;
                              if ('profiles' in part) {
                                  acc.mentions.push({
                                      content: part.content,
                                      profiles: part.profiles.map((profile) => ({
                                          ...profile,
                                          platform: profile.platform,
                                      })),
                                  } as Mention);
                              }
                          }
                          return acc;
                      },
                      {
                          text: '',
                          mentions: [],
                      },
                  )
                : { text: chars, mentions: [] };

            nativeBridgeProvider.request(SupportedMethod.COMPOSE, {
                activity: `${location.origin}${location.pathname}`,
                ...params,
            });
            return;
        }

        ComposeModalRef.open({
            type: 'compose',
            chars,
        });
    }, []);
}
