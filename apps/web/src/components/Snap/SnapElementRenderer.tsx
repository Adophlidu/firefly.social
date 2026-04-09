'use client';

import { classNames } from '@dimensiondev/utils';
import { type ReactNode } from 'react';

import { SnapBadge } from '@/components/Snap/elements/SnapBadge.js';
import { SnapBarChart } from '@/components/Snap/elements/SnapBarChart.js';
import { SnapButton } from '@/components/Snap/elements/SnapButton.js';
import { SnapCellGrid } from '@/components/Snap/elements/SnapCellGrid.js';
import { SnapIcon } from '@/components/Snap/elements/SnapIcon.js';
import { SnapImage } from '@/components/Snap/elements/SnapImage.js';
import { SnapInput } from '@/components/Snap/elements/SnapInput.js';
import { SnapItem } from '@/components/Snap/elements/SnapItem.js';
import { SnapItemGroup } from '@/components/Snap/elements/SnapItemGroup.js';
import { SnapProgress } from '@/components/Snap/elements/SnapProgress.js';
import { SnapSeparator } from '@/components/Snap/elements/SnapSeparator.js';
import { SnapSlider } from '@/components/Snap/elements/SnapSlider.js';
import { SnapSwitch } from '@/components/Snap/elements/SnapSwitch.js';
import { SnapText } from '@/components/Snap/elements/SnapText.js';
import { SnapToggleGroup } from '@/components/Snap/elements/SnapToggleGroup.js';
import { useSnapContext } from '@/components/Snap/SnapContext.js';
import { type SnapAction, type SnapUI } from '@/types/snap.js';

const GAP_MAP = {
    none: 'gap-0',
    sm: 'gap-1',
    md: 'gap-3',
    lg: 'gap-5',
};

const JUSTIFY_MAP = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
};

interface Props {
    elementId: string;
    ui: SnapUI;
    onAction: (action: SnapAction) => void;
}

export function SnapElementRenderer({ elementId, ui, onAction }: Props) {
    const { accent, loading } = useSnapContext();
    const element = ui.elements[elementId];
    if (!element) return null;

    const renderChildren = (): ReactNode => {
        if (!element.children?.length) return null;
        return element.children.map((childId) => (
            <SnapElementRenderer key={childId} elementId={childId} ui={ui} onAction={onAction} />
        ));
    };

    switch (element.type) {
        case 'text':
            return <SnapText props={element.props} />;

        case 'button':
            return (
                <SnapButton
                    props={element.props}
                    accent={accent}
                    action={element.on?.press}
                    onPress={onAction}
                    disabled={loading}
                />
            );

        case 'image':
            return <SnapImage props={element.props} />;

        case 'badge':
            return <SnapBadge props={element.props} />;

        case 'icon':
            return <SnapIcon props={element.props} />;

        case 'separator':
            return <SnapSeparator props={element.props} />;

        case 'progress':
            return <SnapProgress props={element.props} accent={accent} />;

        case 'item':
            return (
                <SnapItem
                    props={element.props}
                    onPress={element.on?.press ? () => onAction(element.on!.press!) : undefined}
                />
            );

        case 'item_group':
            return <SnapItemGroup props={element.props}>{renderChildren()}</SnapItemGroup>;

        case 'bar_chart':
            return <SnapBarChart props={element.props} accent={accent} />;

        case 'cell_grid':
            return <SnapCellGrid name={elementId} props={element.props} accent={accent} />;

        case 'input':
            return <SnapInput props={element.props} />;

        case 'slider':
            return <SnapSlider props={element.props} accent={accent} />;

        case 'switch':
            return <SnapSwitch props={element.props} accent={accent} />;

        case 'toggle_group':
            return <SnapToggleGroup props={element.props} accent={accent} />;

        case 'stack': {
            const { direction = 'vertical', gap = 'md', justify } = element.props;
            return (
                <div
                    className={classNames('flex w-full', GAP_MAP[gap], justify ? JUSTIFY_MAP[justify] : '', {
                        'flex-col': direction === 'vertical',
                        'flex-row flex-wrap items-center': direction === 'horizontal',
                    })}
                >
                    {renderChildren()}
                </div>
            );
        }

        default:
            return null;
    }
}
