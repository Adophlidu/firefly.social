import {
    DecoratorNode,
    type EditorConfig,
    type LexicalEditor,
    type LexicalNode,
    type NodeKey,
    type SerializedLexicalNode,
} from 'lexical';
import { type ReactNode } from 'react';

import { MentionsMenu } from '@/components/MentionsMenu.js';
import { type Profile } from '@/providers/types/Firefly.js';

interface SerializedMentionNode extends SerializedLexicalNode {
    text: string;
    profiles?: Profile[];
}

export class MentionNode extends DecoratorNode<ReactNode> {
    static __isDarkMode = false;

    static setIsDarkMode(isDark: boolean) {
        this.__isDarkMode = isDark;
    }

    __profiles?: Profile[];
    __text: string;
    static override getType(): string {
        return 'mention';
    }
    static override clone(node: MentionNode): MentionNode {
        return new MentionNode(node.__text, node.__profiles, node.__key);
    }

    constructor(mentionName: string, profiles?: Profile[], key?: NodeKey) {
        super(key);
        this.__text = !mentionName.startsWith('@') ? `@${mentionName}` : mentionName;
        if (profiles) this.__profiles = profiles;
    }
    override createDOM(config: EditorConfig): HTMLElement {
        const element = document.createElement('span');
        return element;
    }
    override updateDOM(): boolean {
        return false;
    }
    override getTextContent(): string {
        return this.__text;
    }
    override decorate(editor: LexicalEditor): ReactNode {
        return (
            <MentionsMenu
                editor={editor}
                text={this.__text}
                isDarkMode={MentionNode.__isDarkMode}
                onEdit={(newText, result) => {
                    this.getWritable().replace($createMentionNode(newText, result));
                }}
                profiles={this.__profiles || []}
            />
        );
    }
    override exportJSON(): SerializedMentionNode {
        return {
            ...super.exportJSON(),
            type: 'mention',
            version: 1,
            text: this.__text,
            profiles: this.__profiles,
        };
    }
    static override importJSON(serializedNode: SerializedMentionNode): MentionNode {
        return $createMentionNode(serializedNode.text, serializedNode.profiles);
    }
}

export function $createMentionNode(text = '', profiles?: Profile[]): MentionNode {
    return new MentionNode(text, profiles);
}

export function $isMentionNode(node: LexicalNode | null | undefined): node is MentionNode {
    return node instanceof MentionNode;
}
