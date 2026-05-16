/* cspell:disable */

export type SnapAccentColor = 'gray' | 'blue' | 'red' | 'amber' | 'green' | 'teal' | 'purple' | 'pink';

// ─── Actions ─────────────────────────────────────────────────────────────────

export interface SnapSubmitAction {
    action: 'submit';
    params: { target: string };
}
export interface SnapOpenUrlAction {
    action: 'open_url';
    params: { target: string };
}
export interface SnapOpenMiniAppAction {
    action: 'open_mini_app';
    params: { target: string };
}
export interface SnapViewCastAction {
    action: 'view_cast';
    params: { hash: string };
}
export interface SnapViewProfileAction {
    action: 'view_profile';
    params: { fid: number };
}
export interface SnapComposeCastAction {
    action: 'compose_cast';
    params: { text?: string; channelKey?: string; embeds?: string[] };
}
export interface SnapViewTokenAction {
    action: 'view_token';
    params: { token: string };
}
export interface SnapSendTokenAction {
    action: 'send_token';
    params: { token: string; amount?: string; recipientFid?: number; recipientAddress?: string };
}
export interface SnapSwapTokenAction {
    action: 'swap_token';
    params: { sellToken?: string; buyToken?: string };
}

export type SnapAction =
    | SnapSubmitAction
    | SnapOpenUrlAction
    | SnapOpenMiniAppAction
    | SnapViewCastAction
    | SnapViewProfileAction
    | SnapComposeCastAction
    | SnapViewTokenAction
    | SnapSendTokenAction
    | SnapSwapTokenAction;

// ─── Element props ────────────────────────────────────────────────────────────

export interface SnapTextProps {
    content: string;
    size?: 'md' | 'sm';
    weight?: 'bold' | 'normal';
}
export interface SnapButtonProps {
    label: string;
}
export interface SnapImageProps {
    url: string;
    aspect: '1:1' | '16:9' | '4:3' | '9:16';
    alt?: string;
}
export interface SnapBadgeProps {
    label: string;
    color?: SnapAccentColor;
    icon?: string;
}
export interface SnapIconProps {
    name: string;
}
export interface SnapItemProps {
    title: string;
    description?: string;
    imageUrl?: string;
}
export interface SnapProgressProps {
    value: number;
    max?: number;
    label?: string;
    color?: SnapAccentColor;
}
export interface SnapSeparatorProps {
    direction?: 'horizontal' | 'vertical';
}
export interface SnapStackProps {
    direction?: 'horizontal' | 'vertical';
    gap?: 'none' | 'sm' | 'md' | 'lg';
    justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}
export interface SnapItemGroupProps {
    border?: boolean;
    separator?: boolean;
}
export interface SnapBarChartItem {
    label: string;
    value: number;
    color?: SnapAccentColor;
}
export interface SnapBarChartProps {
    items: SnapBarChartItem[];
}
export interface SnapCellGridCell {
    color?: SnapAccentColor;
}
export interface SnapCellGridProps {
    columns: number;
    rows: number;
    cells?: SnapCellGridCell[];
    selectable?: 'single' | 'multiple' | false;
    selected?: number | number[];
}
export interface SnapInputProps {
    name: string;
    label?: string;
    placeholder?: string;
    type?: 'text' | 'number';
    maxLength?: number;
    value?: string;
}
export interface SnapSliderProps {
    name: string;
    label?: string;
    min?: number;
    max?: number;
    step?: number;
    value?: number;
}
export interface SnapSwitchProps {
    name: string;
    label?: string;
    value?: boolean;
}
export interface SnapToggleOption {
    label: string;
    value: string;
}
export interface SnapToggleGroupProps {
    name: string;
    mode?: 'single' | 'multiple';
    options: SnapToggleOption[];
    value?: string | string[];
}

// ─── Elements ────────────────────────────────────────────────────────────────

interface SnapElementBase {
    children?: string[];
    on?: { press?: SnapAction };
}

export type SnapElement =
    | ({ type: 'text'; props: SnapTextProps } & SnapElementBase)
    | ({ type: 'button'; props: SnapButtonProps } & SnapElementBase)
    | ({ type: 'image'; props: SnapImageProps } & SnapElementBase)
    | ({ type: 'badge'; props: SnapBadgeProps } & SnapElementBase)
    | ({ type: 'icon'; props: SnapIconProps } & SnapElementBase)
    | ({ type: 'item'; props: SnapItemProps } & SnapElementBase)
    | ({ type: 'progress'; props: SnapProgressProps } & SnapElementBase)
    | ({ type: 'separator'; props: SnapSeparatorProps } & SnapElementBase)
    | ({ type: 'stack'; props: SnapStackProps } & SnapElementBase)
    | ({ type: 'item_group'; props: SnapItemGroupProps } & SnapElementBase)
    | ({ type: 'bar_chart'; props: SnapBarChartProps } & SnapElementBase)
    | ({ type: 'cell_grid'; props: SnapCellGridProps } & SnapElementBase)
    | ({ type: 'input'; props: SnapInputProps } & SnapElementBase)
    | ({ type: 'slider'; props: SnapSliderProps } & SnapElementBase)
    | ({ type: 'switch'; props: SnapSwitchProps } & SnapElementBase)
    | ({ type: 'toggle_group'; props: SnapToggleGroupProps } & SnapElementBase);

// ─── Response ─────────────────────────────────────────────────────────────────

export interface SnapTheme {
    accent?: SnapAccentColor;
}

export interface SnapUI {
    root: string;
    elements: Record<string, SnapElement>;
}

export interface Snap {
    /** Snap URL (injected by the resolver) */
    url: string;
    version: '1.0' | '2.0';
    theme?: SnapTheme;
    effects?: Array<'confetti'>;
    ui: SnapUI;
}

export interface SnapDigestedResponse {
    snap: Snap | null;
}

// ─── JFS payload sent by the client ──────────────────────────────────────────

export interface SnapJFSPayload {
    /** v2 fields */
    audience?: string;
    user?: {
        fid: number;
    };
    surface?: string | Record<string, unknown>;
    /** v1 fields */
    fid?: number;
    button_index?: number;
    nonce?: string;
    inputs: Record<string, unknown>;
    timestamp: number;
}
