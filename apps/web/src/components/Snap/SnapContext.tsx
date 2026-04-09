'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { type SnapAccentColor, type SnapFieldValues } from '@/types/snap.js';

// Map accent color names to Tailwind classes
export const ACCENT_COLOR_MAP: Record<SnapAccentColor, string> = {
    gray: 'bg-gray-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    green: 'bg-green-500',
    teal: 'bg-teal-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
};

export const ACCENT_TEXT_MAP: Record<SnapAccentColor, string> = {
    gray: 'text-gray-500',
    blue: 'text-blue-500',
    red: 'text-red-500',
    amber: 'text-amber-500',
    green: 'text-green-500',
    teal: 'text-teal-500',
    purple: 'text-purple-500',
    pink: 'text-pink-500',
};

export const ACCENT_BORDER_MAP: Record<SnapAccentColor, string> = {
    gray: 'border-gray-500',
    blue: 'border-blue-500',
    red: 'border-red-500',
    amber: 'border-amber-500',
    green: 'border-green-500',
    teal: 'border-teal-500',
    purple: 'border-purple-500',
    pink: 'border-pink-500',
};

export const ACCENT_RING_MAP: Record<SnapAccentColor, string> = {
    gray: 'ring-gray-500',
    blue: 'ring-blue-500',
    red: 'ring-red-500',
    amber: 'ring-amber-500',
    green: 'ring-green-500',
    teal: 'ring-teal-500',
    purple: 'ring-purple-500',
    pink: 'ring-pink-500',
};

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
