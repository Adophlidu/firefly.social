'use client';

import { runInSafeAsync } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { first } from 'lodash-es';
import { memo, useEffect, useRef, useState } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { PostMarkup } from '@/components/Markup/PostMarkup.js';
import { NUMBER_STRING_REGEX } from '@/constants/regexp.js';
import { getTargetLanguage } from '@/helpers/getBrowserLanguage.js';
import { getLangNameFromLocal } from '@/helpers/getLangNameFromLocal.js';
import { trimify } from '@/helpers/trimify.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { translate } from '@/providers/firefly/endpoint/translate.js';
import { type Post } from '@/providers/types/SocialMedia.js';
import { detectLanguage } from '@/services/detectLanguage.js';
import { type Language } from '@/types/language.js';

function isValidContentToTranslate(content: string) {
    NUMBER_STRING_REGEX.lastIndex = 0;
    if (!trimify(content) || NUMBER_STRING_REGEX.test(content)) return false;
    return true;
}

interface ContentWithTranslatorProps {
    content: string;
    post: Post;
    canShowMore: boolean;
}

export const ContentTranslator = memo<ContentWithTranslatorProps>(function ContentTranslator({
    content,
    post,
    canShowMore,
}) {
    const detected = useRef(false);
    const [collapsed, setCollapsed] = useState(false);
    const [translationConfig, setTranslationConfig] = useState<Record<'original' | 'target', Language | null>>({
        original: null,
        target: null,
    });
    const isLoginFirefly = useIsLoginFirefly();

    const [_, handleDetect] = useAsyncFn(async () => {
        const originalLanguage = (await runInSafeAsync(() => detectLanguage(content))) || null;
        setTranslationConfig({
            original: originalLanguage,
            target: await getTargetLanguage(originalLanguage),
        });
        detected.current = true;
    }, [content]);

    const [{ value: data, loading, error }, handleTranslate] = useAsyncFn(async () => {
        const { translations, detectedLanguage } = await translate(translationConfig.target!, content);
        const originalLanguage = detectedLanguage || translationConfig.original;

        return {
            contentLanguage: originalLanguage ? getLangNameFromLocal(originalLanguage) : undefined,
            translatedText: first(translations)?.text,
        };
    }, [content, translationConfig]);

    useEffect(() => {
        if (!isLoginFirefly || !isValidContentToTranslate(content) || detected.current) return;
        handleDetect();
    }, [content, isLoginFirefly, handleDetect]);

    if (!isLoginFirefly || !translationConfig.target) return null;

    const translatedText = data?.translatedText;
    const contentLanguage = data?.contentLanguage;

    if (collapsed) {
        return (
            <div className="my-1.5 text-sm">
                <ClickableButton
                    className="text-highlight"
                    onClick={() => setCollapsed(false)}
                    aria-label="Translate post"
                >
                    <Trans>Translate post</Trans>
                </ClickableButton>
            </div>
        );
    }

    return (
        <>
            <div className="text-highlight my-1.5 text-sm">
                {translatedText ? (
                    <ClickableButton
                        onClick={() => setCollapsed(true)}
                        aria-label={contentLanguage ? `Translated from ${contentLanguage}` : 'Translated'}
                    >
                        {contentLanguage ? <Trans>Translated from {contentLanguage}</Trans> : <Trans>Translated</Trans>}
                    </ClickableButton>
                ) : loading ? (
                    <span>
                        <Trans>Translating...</Trans>
                    </span>
                ) : (
                    <ClickableButton
                        onClick={handleTranslate}
                        aria-label={error ? 'Failed to translate post. Please retry later.' : 'Translate post'}
                    >
                        {error ? (
                            <Trans>Failed to translate post. Please retry later.</Trans>
                        ) : (
                            <Trans>Translate post</Trans>
                        )}
                    </ClickableButton>
                )}
            </div>
            {translatedText ? <PostMarkup post={post} content={translatedText} canShowMore={canShowMore} /> : null}
        </>
    );
});
