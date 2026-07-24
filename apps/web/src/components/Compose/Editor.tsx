'use client';

import { CharTag } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { ContentEditable } from '@lexical/react/LexicalContentEditable.js';
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin.js';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin.js';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin.js';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin.js';
import { $dfs } from '@lexical/utils';
import { Select, Trans } from '@lingui/react/macro';
import { $getRoot, $isElementNode, $isLineBreakNode, $isTextNode, type EditorState, type LexicalNode } from 'lexical';
import { compact, debounce } from 'lodash-es';
import { memo, type PropsWithChildren, useMemo, useTransition } from 'react';
import { useDebounce } from 'react-use';

import { $isMentionNode, type MentionNode } from '@/components/Lexical/nodes/MentionsNode.js';
import { MentionsPlugin } from '@/components/Lexical/plugins/AtMentionsPlugin.js';
import { LexicalAutoLinkPlugin } from '@/components/Lexical/plugins/AutoLinkPlugin.js';
import { SharerLinkPastePlugin } from '@/components/Lexical/plugins/SharerLinkPastePlugin.js';
import { writeChars } from '@/helpers/chars.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import type { Chars, ComplexChars } from '@/types/chars.js';
import type { CompositePost } from '@/types/compose.js';

function extractTextFromNode(node: LexicalNode): string {
    if ($isMentionNode(node)) {
        return node.__text;
    }

    if ($isTextNode(node)) {
        return node.getTextContent();
    }

    if ($isLineBreakNode(node)) {
        return '\n';
    }

    if ($isElementNode(node)) {
        let text = '';
        const children = node.getChildren();

        for (const child of children) {
            text += extractTextFromNode(child);
        }

        const nodeType = node.getType();
        if (nodeType === 'paragraph' || nodeType === 'heading' || nodeType === 'listitem') {
            text += '\n';
        }

        return text;
    }

    return node.getTextContent() || '';
}

function ErrorBoundaryComponent(props: PropsWithChildren) {
    return <>{props.children}</>;
}

// TODO: these plugins slow down the editor
const EditorPlugins = memo(function EditorPlugins() {
    return (
        <>
            <LexicalAutoLinkPlugin />
            <SharerLinkPastePlugin />
            <HistoryPlugin />
            <HashtagPlugin />
            <MentionsPlugin />
        </>
    );
});

interface EditorProps {
    post: CompositePost;
    replying: boolean;
}

export const Editor = memo(function Editor({ post, replying }: EditorProps) {
    const { type, posts, updateChars, updateFocused, loadComponentsFromChars } = useComposeStateStore();
    const [, startTransition] = useTransition();

    const { chars } = post;
    const index = posts.findIndex((x) => x.id === post.id);

    useDebounce(
        () => {
            loadComponentsFromChars(post.id);
        },
        300,
        [chars, post.id, loadComponentsFromChars],
    );

    const onChange = useMemo(
        () =>
            debounce((editorState: EditorState) => {
                editorState.read(async () => {
                    let markdown = '';
                    const root = $getRoot();
                    const children = root.getChildren();

                    for (const child of children) {
                        markdown += extractTextFromNode(child);
                    }

                    const allNodes = $dfs();
                    const mentionNodes = allNodes
                        .filter((x) => $isMentionNode(x.node))
                        .map((x) => x.node as MentionNode);
                    // avoid empty content with paragraph node
                    const newChars: Chars = compact(
                        (markdown.replace('\n', '') === '' ? '' : markdown.replace(/\n$/, ''))
                            .split(/(@[^\s()@:%+~#?&=,!?']+)/g)
                            .filter(Boolean)
                            .map((x) => {
                                const targetMentionNode = mentionNodes.find((node) => node.__text === x);
                                if (targetMentionNode)
                                    return {
                                        tag: CharTag.MENTION,
                                        visible: true,
                                        content: x,
                                        profiles: targetMentionNode.__profiles,
                                    } as ComplexChars;

                                return x;
                            }),
                    );

                    startTransition(() => {
                        updateChars((chars) => writeChars(chars, newChars));
                    });
                });
            }, 100),
        [updateChars, startTransition],
    );

    return (
        <>
            <PlainTextPlugin
                contentEditable={
                    <ContentEditable
                        key="editable"
                        onFocus={() => updateFocused(true)}
                        onBlur={() => updateFocused(false)}
                        className="flex-1 shrink-0 cursor-text resize-none appearance-none border-none bg-transparent p-0 pb-2 text-left text-[16px] leading-6 text-main outline-none outline-0 focus:ring-0"
                    />
                }
                placeholder={
                    <div
                        className={classNames(
                            'pointer-events-none absolute left-0 top-0 text-medium leading-6 text-placeholder',
                            { 'top-2.5 pl-[52px]': replying },
                        )}
                    >
                        <Select
                            value={type}
                            _compose={
                                post.poll ? (
                                    <Trans>Ask a question</Trans>
                                ) : post.lpt1Tags?.length ? (
                                    <Trans>Add a comment</Trans>
                                ) : index === 0 ? (
                                    <Trans>What&apos;s happening...</Trans>
                                ) : (
                                    <Trans>Add another post...</Trans>
                                )
                            }
                            _quote="Add a comment"
                            _reply="Post your reply"
                            other={
                                index === 0 ? (
                                    <Trans>What&apos;s happening...</Trans>
                                ) : (
                                    <Trans>Add another post...</Trans>
                                )
                            }
                        />
                    </div>
                }
                ErrorBoundary={ErrorBoundaryComponent}
            />
            <OnChangePlugin onChange={onChange} />

            <EditorPlugins />
        </>
    );
});
