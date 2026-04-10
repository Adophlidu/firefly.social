'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { type SnapAccentColor, type SnapFieldValues } from '@/types/snap.js';

/** Tailwind classes backed by `--snap-palette-*` (Farcaster snap spec, light/dark in globals.css). */
export const ACCENT_COLOR_MAP: Record<SnapAccentColor, string> = {
    gray: 'bg-snap-gray',
    blue: 'bg-snap-blue',
    red: 'bg-snap-red',
    amber: 'bg-snap-amber',
    green: 'bg-snap-green',
    teal: 'bg-snap-teal',
    purple: 'bg-snap-purple',
    pink: 'bg-snap-pink',
};

export const ACCENT_TEXT_MAP: Record<SnapAccentColor, string> = {
    gray: 'text-snap-gray',
    blue: 'text-snap-blue',
    red: 'text-snap-red',
    amber: 'text-snap-amber',
    green: 'text-snap-green',
    teal: 'text-snap-teal',
    purple: 'text-snap-purple',
    pink: 'text-snap-pink',
};

export const ACCENT_BORDER_MAP: Record<SnapAccentColor, string> = {
    gray: 'border-snap-gray',
    blue: 'border-snap-blue',
    red: 'border-snap-red',
    amber: 'border-snap-amber',
    green: 'border-snap-green',
    teal: 'border-snap-teal',
    purple: 'border-snap-purple',
    pink: 'border-snap-pink',
};

export const ACCENT_RING_MAP: Record<SnapAccentColor, string> = {
    gray: 'ring-snap-gray',
    blue: 'ring-snap-blue',
    red: 'ring-snap-red',
    amber: 'ring-snap-amber',
    green: 'ring-snap-green',
    teal: 'ring-snap-teal',
    purple: 'ring-snap-purple',
    pink: 'ring-snap-pink',
};

/** Resolves `progress.color` / `bar_chart.color` where the spec allows `"accent"` or a palette name. */
export function resolveSnapPaletteKey(
    color: SnapAccentColor | 'accent' | undefined,
    themeAccent: SnapAccentColor,
): SnapAccentColor {
    if (color === 'accent' || color === undefined) return themeAccent;
    return color;
}

interface SnapContextValue {
    accent: SnapAccentColor;
    fields: SnapFieldValues;
    setInput: (name: string, value: string) => void;
    setSlider: (name: string, value: number) => void;
    setSwitch: (name: string, value: boolean) => void;
    setToggleGroup: (name: string, value: string | string[]) => void;
    setCellGrid: (name: string, value: number | number[]) => void;
    loading: boolean;
}

const defaultFields: SnapFieldValues = {
    inputs: {},
    sliders: {},
    switches: {},
    toggleGroups: {},
    cellGrids: {},
};

const SnapContext = createContext<SnapContextValue>({
    accent: 'purple',
    fields: defaultFields,
    setInput: () => void 0,
    setSlider: () => void 0,
    setSwitch: () => void 0,
    setToggleGroup: () => void 0,
    setCellGrid: () => void 0,
    loading: false,
});

export function useSnapContext() {
    return useContext(SnapContext);
}

interface SnapContextProviderProps {
    accent?: SnapAccentColor;
    loading?: boolean;
    onFieldsChange?: (fields: SnapFieldValues) => void;
    children: ReactNode;
}

export function SnapContextProvider({
    accent = 'purple',
    loading = false,
    onFieldsChange,
    children,
}: SnapContextProviderProps) {
    const [fields, setFields] = useState<SnapFieldValues>(defaultFields);

    // keep the callback stable via ref so it doesn't re-trigger the effect
    const onFieldsChangeRef = useRef(onFieldsChange);
    onFieldsChangeRef.current = onFieldsChange;

    useEffect(() => {
        onFieldsChangeRef.current?.(fields);
    }, [fields]);

    const setInput = useCallback((name: string, value: string) => {
        setFields((prev) => ({ ...prev, inputs: { ...prev.inputs, [name]: value } }));
    }, []);

    const setSlider = useCallback((name: string, value: number) => {
        setFields((prev) => ({ ...prev, sliders: { ...prev.sliders, [name]: value } }));
    }, []);

    const setSwitch = useCallback((name: string, value: boolean) => {
        setFields((prev) => ({ ...prev, switches: { ...prev.switches, [name]: value } }));
    }, []);

    const setToggleGroup = useCallback((name: string, value: string | string[]) => {
        setFields((prev) => ({ ...prev, toggleGroups: { ...prev.toggleGroups, [name]: value } }));
    }, []);

    const setCellGrid = useCallback((name: string, value: number | number[]) => {
        setFields((prev) => ({ ...prev, cellGrids: { ...prev.cellGrids, [name]: value } }));
    }, []);

    const value = useMemo(
        () => ({ accent, fields, setInput, setSlider, setSwitch, setToggleGroup, setCellGrid, loading }),
        [accent, fields, setInput, setSlider, setSwitch, setToggleGroup, setCellGrid, loading],
    );

    return <SnapContext.Provider value={value}>{children}</SnapContext.Provider>;
}
