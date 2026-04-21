/* cspell:disable */

// #region Snap Actions

export interface SnapSubmitAction {
    action: 'submit';
    params: {
        /** HTTPS URL to POST the JFS payload to */
        target: string;
    };
}

export interface SnapOpenUrlAction {
    action: 'open_url';
    params: {
        target: string;
    };
}

export interface SnapOpenSnapAction {
    action: 'open_snap';
    params: {
        /** Snap URL to render inline */
        target: string;
    };
}

export interface SnapOpenMiniAppAction {
    action: 'open_mini_app';
    params: {
        target: string;
    };
}

export interface SnapViewCastAction {
    action: 'view_cast';
    params: {
        hash: string;
    };
}

export interface SnapViewProfileAction {
    action: 'view_profile';
    params: {
        fid: number;
    };
}

export interface SnapComposeCastAction {
    action: 'compose_cast';
    params: {
        text?: string;
        channelKey?: string;
        embeds?: string[];
    };
}

export interface SnapViewTokenAction {
    action: 'view_token';
    params: {
        /** CAIP-19 token identifier */
        token: string;
    };
}

export interface SnapSendTokenAction {
    action: 'send_token';
    params: {
        /** CAIP-19 token identifier */
        token: string;
        amount?: string;
        recipientFid?: number;
        recipientAddress?: string;
    };
}

export interface SnapSwapTokenAction {
    action: 'swap_token';
    params: {
        /** CAIP-19 token identifier */
        sellToken?: string;
        /** CAIP-19 token identifier */
        buyToken?: string;
    };
}

export type SnapAction =
    | SnapSubmitAction
    | SnapOpenUrlAction
    | SnapOpenSnapAction
    | SnapOpenMiniAppAction
    | SnapViewCastAction
    | SnapViewProfileAction
    | SnapComposeCastAction
    | SnapViewTokenAction
    | SnapSendTokenAction
    | SnapSwapTokenAction;

export type SnapActionType = SnapAction['action'];

// #endregion

// #region Snap Element Props

export type SnapAccentColor = 'gray' | 'blue' | 'red' | 'amber' | 'green' | 'teal' | 'purple' | 'pink';

export interface SnapTextProps {
    content: string;
    /** Default: 'md' */
    size?: 'md' | 'sm';
    /** Default: 'normal' */
    weight?: 'bold' | 'normal';
    align?: 'left' | 'center' | 'right';
}

export interface SnapButtonProps {
    /** 1-30 characters */
    label: string;
    variant?: 'primary' | 'secondary';
    icon?: string;
}

export interface SnapImageProps {
    url: string;
    aspect: '1:1' | '16:9' | '4:3' | '9:16';
    alt?: string;
}

export interface SnapBadgeProps {
    /** 1-30 characters */
    label: string;
    /** Default: purple. Named palette or `accent` for the snap theme accent. */
    color?: SnapAccentColor | 'accent';
    icon?: string;
    /** Default: 'default' (solid fill). `outline` uses a border and tinted text. */
    variant?: 'default' | 'outline';
}

export interface SnapIconProps {
    name: string;
    /** Default: 'md' (24 px). 'sm' = 16 px. */
    size?: 'sm' | 'md';
    /** Tint for the icon. `accent` uses the snap theme accent. `inherit` uses the parent text color (e.g. badges). */
    color?: SnapAccentColor | 'accent' | 'inherit';
}

export interface SnapItemProps {
    title: string;
    description?: string;
    variant?: 'default';
    /** Non-spec Firefly extension: optional thumbnail image. */
    imageUrl?: string;
}

export interface SnapProgressProps {
    value: number;
    /** Default: 100 */
    max?: number;
    label?: string;
    /** Palette name or `"accent"` (theme accent). */
    color?: SnapAccentColor | 'accent';
}

export interface SnapSeparatorProps {
    /** Default: 'horizontal' */
    orientation?: 'horizontal' | 'vertical';
}

export interface SnapStackProps {
    /** Default: 'vertical' */
    direction?: 'horizontal' | 'vertical';
    /** Default: 'md' */
    gap?: 'none' | 'sm' | 'md' | 'lg';
    justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}

export interface SnapItemGroupProps {
    border?: boolean;
    separator?: boolean;
    gap?: 'none' | 'sm' | 'md' | 'lg';
}

export interface SnapBarChartBar {
    label: string;
    value: number;
    color?: SnapAccentColor;
}

export interface SnapBarChartProps {
    /** 1-6 bars */
    bars: SnapBarChartBar[];
    /** Override the scale maximum */
    max?: number;
    /** Default bar fill: palette name or `"accent"`. */
    color?: SnapAccentColor | 'accent';
}

export interface SnapCellGridCell {
    row: number;
    col: number;
    /** Named palette color or `#RRGGBB` hex (grid exception in snap spec). */
    color?: SnapAccentColor | string;
    content?: string;
}

export interface SnapCellGridProps {
    /** 2-32 */
    cols: number;
    /** 2-16 */
    rows: number;
    cells?: SnapCellGridCell[];
    gap?: 'none' | 'sm' | 'md' | 'lg';
    rowHeight?: number;
    select?: 'off' | 'single' | 'multiple';
    name?: string;
}

export interface SnapInputProps {
    name: string;
    label?: string;
    placeholder?: string;
    /** Default: 'text' */
    type?: 'text' | 'number';
    /** 1-280 */
    maxLength?: number;
    defaultValue?: string;
}

export interface SnapSliderProps {
    name: string;
    label?: string;
    /** Default: 0 */
    min?: number;
    /** Default: 100 */
    max?: number;
    /** Default: 1 */
    step?: number;
    /** Initial value before the user moves the slider (or submits). */
    defaultValue?: number;
    /** Show the current numeric value next to the label. */
    showValue?: boolean;
}

export interface SnapSwitchProps {
    name: string;
    label?: string;
    /** Default: false. Alias: `defaultChecked`. */
    value?: boolean;
    /** Initial on/off state (alias for `value`, HTML-style). */
    defaultChecked?: boolean;
}

export interface SnapToggleGroupProps {
    name: string;
    label?: string;
    /** Default: false (single-select) */
    multiple?: boolean;
    orientation?: 'horizontal' | 'vertical';
    /** 2-6 option strings */
    options: string[];
    defaultValue?: string | string[];
    variant?: 'default' | 'outline';
}

// #endregion

// #region Snap Elements

interface SnapElementBase {
    children?: string[];
    on?: {
        press?: SnapAction;
    };
}

export interface SnapTextElement extends SnapElementBase {
    type: 'text';
    props: SnapTextProps;
}

export interface SnapButtonElement extends SnapElementBase {
    type: 'button';
    props: SnapButtonProps;
}

export interface SnapImageElement extends SnapElementBase {
    type: 'image';
    props: SnapImageProps;
}

export interface SnapBadgeElement extends SnapElementBase {
    type: 'badge';
    props: SnapBadgeProps;
}

export interface SnapIconElement extends SnapElementBase {
    type: 'icon';
    props: SnapIconProps;
}

export interface SnapItemElement extends SnapElementBase {
    type: 'item';
    props: SnapItemProps;
}

export interface SnapProgressElement extends SnapElementBase {
    type: 'progress';
    props: SnapProgressProps;
}

export interface SnapSeparatorElement extends SnapElementBase {
    type: 'separator';
    props: SnapSeparatorProps;
}

export interface SnapStackElement extends SnapElementBase {
    type: 'stack';
    props: SnapStackProps;
}

export interface SnapItemGroupElement extends SnapElementBase {
    type: 'item_group';
    props: SnapItemGroupProps;
}

export interface SnapBarChartElement extends SnapElementBase {
    type: 'bar_chart';
    props: SnapBarChartProps;
}

export interface SnapCellGridElement extends SnapElementBase {
    type: 'cell_grid';
    props: SnapCellGridProps;
}

export interface SnapInputElement extends SnapElementBase {
    type: 'input';
    props: SnapInputProps;
}

export interface SnapSliderElement extends SnapElementBase {
    type: 'slider';
    props: SnapSliderProps;
}

export interface SnapSwitchElement extends SnapElementBase {
    type: 'switch';
    props: SnapSwitchProps;
}

export interface SnapToggleGroupElement extends SnapElementBase {
    type: 'toggle_group';
    props: SnapToggleGroupProps;
}

export type SnapElement =
    | SnapTextElement
    | SnapButtonElement
    | SnapImageElement
    | SnapBadgeElement
    | SnapIconElement
    | SnapItemElement
    | SnapProgressElement
    | SnapSeparatorElement
    | SnapStackElement
    | SnapItemGroupElement
    | SnapBarChartElement
    | SnapCellGridElement
    | SnapInputElement
    | SnapSliderElement
    | SnapSwitchElement
    | SnapToggleGroupElement;

export type SnapElementType = SnapElement['type'];

// #endregion

// #region Snap Response

export interface SnapTheme {
    accent?: SnapAccentColor;
}

export interface SnapUI {
    root: string;
    elements: Record<string, SnapElement>;
}

export interface Snap {
    /** Snap URL (added by Firefly Worker) */
    url: string;
    /** Protocol version */
    version: '1.0' | '2.0';
    theme?: SnapTheme;
    effects?: Array<'confetti'>;
    ui: SnapUI;
}

export interface SnapDigestedResponse {
    snap: Snap | null;
}

// #endregion

// #region Field state (collected from interactive elements before submit)

export interface SnapFieldValues {
    inputs: Record<string, string>;
    sliders: Record<string, number>;
    switches: Record<string, boolean>;
    toggleGroups: Record<string, string | string[]>;
    cellGrids: Record<string, number | number[]>;
}

// #endregion

// #region JFS (JSON Farcaster Signature)

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
    /** shared fields */
    inputs: Record<string, string | number | boolean | string[] | number[]>;
    timestamp: number;
}

// #endregion
