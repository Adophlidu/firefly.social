import { setProjectAnnotations } from '@storybook/nextjs-vite';
import { beforeAll } from 'vitest';

// eslint-disable-next-line
import * as projectAnnotations from './preview.js';

// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
const project = setProjectAnnotations([projectAnnotations]);

beforeAll(project.beforeAll);
