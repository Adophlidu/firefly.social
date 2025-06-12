import { addClassNamesToElement } from '@lexical/utils';
import {
    type EditorConfig,
    type LexicalEditor,
    type LexicalNode,
    type NodeKey,
    type SerializedTextNode,
    TextNode,
} from 'lexical';
import { compact, first } from 'lodash-es';
import { renderToStaticMarkup } from 'react-dom/server';
import tippy from 'tippy.js';

import EditProfileIcon from '@/assets/edit-profile.svg';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { FireflyPlatform } from '@/constants/enum.js';
import { SORTED_CROSS_AT_SOCIAL_SOURCES } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { resolveSocialSourceFromFireflyPlatform } from '@/helpers/resolveSource.js';
import { EditCrossAtModalRef } from '@/modals/controls.js';
import type { Profile } from '@/providers/types/Firefly.js';

export class MentionNode extends TextNode {
    __profiles?: Profile[];

    static __editor: LexicalEditor | null = null;
    static override getType(): string {
        return 'mention';
    }

    static setEditorInstance(editor: LexicalEditor) {
        this.__editor = editor;
    }
    static override clone(node: MentionNode): MentionNode {
        return new MentionNode(node.__text, node.__profiles, node.__key);
    }

    constructor(mentionName: string, profiles?: Profile[], key?: NodeKey) {
        super(!mentionName.startsWith('@') ? `@${mentionName}` : mentionName, key);
        if (profiles) this.__profiles = profiles;
    }

    private renderMentionNodeUI = (element: HTMLElement) => {
        if (this.__profiles) {
            const sources = document.createElement('div');

            const html = renderToStaticMarkup(
                <>
                    {this.__profiles.map(({ platform, handle, platform_id }, index) => {
                        return platform === FireflyPlatform.Wallet ? null : (
                            <span
                                title={`@${handle}`}
                                className={classNames('inline-flex items-center', {
                                    '-ml-1': index > 0 && self.length > 1,
                                })}
                                key={platform_id}
                            >
                                <SocialSourceIcon source={resolveSocialSourceFromFireflyPlatform(platform)} size={16} />
                            </span>
                        );
                    })}
                </>,
            );
            sources.innerHTML = html;
            sources.setAttribute('class', 'flex items-center -space-x-1');

            element.setAttribute(
                'class',
                'inline-flex items-center gap-2 py-1 pl-1 pr-[6px] rounded-full border border-secondaryLine text-highlight leading-4 bg-white dark:bg-black cursor-pointer',
            );
            element.insertBefore(sources, element.firstChild);
            const tooltipElement = document.createElement('div');

            const tooltipContent = renderToStaticMarkup(
                <>
                    {this.__profiles
                        .filter((x) => x.platform !== FireflyPlatform.Wallet)
                        .map(({ platform, handle, platform_id }) => {
                            return (
                                <span
                                    className="cross-at-edit-item flex w-[192px] cursor-pointer items-center justify-between p-2 hover:bg-secondaryBottom"
                                    key={platform_id}
                                >
                                    <span className="flex max-w-[75%] items-center gap-[6px] overflow-hidden">
                                        <SocialSourceIcon
                                            source={resolveSocialSourceFromFireflyPlatform(platform)}
                                            size={16}
                                        />
                                        <span className="truncate text-sm leading-[18px] text-main">{handle}</span>
                                    </span>

                                    <EditProfileIcon className="cross-at-edit hidden size-4" />
                                </span>
                            );
                        })}
                </>,
            );

            tooltipElement.innerHTML = tooltipContent;

            // @ts-ignore
            const tooltip = tippy(element, {
                trigger: 'manual',
                interactive: true,
                allowHTML: true,
                content: tooltipElement,
                appendTo: document.body,
                arrow: false,
                theme: 'cross-at-tooltip',
            });

            element.addEventListener('mouseenter', () => {
                tooltip.show();
            });

            element.addEventListener('click', () => {
                tooltip.show();
            });

            tooltipElement.addEventListener('click', async (e) => {
                const target = e.target as HTMLElement;
                if (
                    (target.classList.contains('cross-at-edit-item') || target.classList.contains('cross-at-edit')) &&
                    this.__profiles
                ) {
                    tooltip.hide();
                    const result = await EditCrossAtModalRef.openAndWaitForClose({
                        profiles: this.__profiles.filter((x) => x.platform !== FireflyPlatform.Wallet),
                    });

                    if (result && MentionNode.__editor) {
                        MentionNode.__editor.update(() => {
                            this.getWritable().__profiles = result;
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
                            this.setTextContent(
                                (!targetHandle?.startsWith('@') ? `@${targetHandle}` : targetHandle) || this.__text,
                            );
                        });
                    }
                }
                tooltip.hide();
            });

            tooltipElement.addEventListener('mouseleave', () => {
                tooltip.hide();
            });
        }
    };

    override createDOM(config: EditorConfig): HTMLElement {
        const element = super.createDOM(config);
        addClassNamesToElement(element, config.theme.mention);
        this.renderMentionNodeUI(element);
        return element;
    }

    override updateDOM(prevNode: TextNode, dom: HTMLElement, config: EditorConfig): boolean {
        addClassNamesToElement(dom, config.theme.mention);
        this.renderMentionNodeUI(dom);
        return true;
    }

    static override importJSON(serializedNode: SerializedTextNode): MentionNode {
        const node = $createMentionNode(serializedNode.text);
        node.setFormat(serializedNode.format);
        node.setDetail(serializedNode.detail);
        node.setMode(serializedNode.mode);
        node.setStyle(serializedNode.style);
        return node;
    }

    override exportJSON(): SerializedTextNode {
        return {
            ...super.exportJSON(),
            type: 'mention',
        };
    }

    override canInsertTextBefore(): boolean {
        return false;
    }

    override isTextEntity(): true {
        return true;
    }
}

export function $createMentionNode(text = '', profiles?: Profile[]): MentionNode {
    const mentionNode = new MentionNode(text, profiles);
    mentionNode.setMode('segmented').toggleDirectionless();

    return mentionNode;
}

export function $isMentionNode(node: LexicalNode | null | undefined): node is MentionNode {
    return node instanceof MentionNode;
}
