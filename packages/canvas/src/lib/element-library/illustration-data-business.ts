/**
 * Business category illustrations — charts, finance, strategy
 */

import type { IllustrationDefinition } from './illustration-data-index'

export const BUSINESS_ILLUSTRATIONS: IllustrationDefinition[] = [
  {
    id: 'bar-chart',
    label: 'Bar Chart',
    category: 'business',
    viewBox: '0 0 56 48',
    tags: ['chart', 'graph', 'analytics', 'data'],
    paths: [
      { d: 'M8 44h44', stroke: '#455A64', strokeWidth: 2 },
      { d: 'M8 44V8', stroke: '#455A64', strokeWidth: 2 },
      { d: 'M14 28h8v16h-8z', fill: '#42A5F5' },
      { d: 'M26 18h8v26h-8z', fill: '#66BB6A' },
      { d: 'M38 24h8v20h-8z', fill: '#FFA726' },
    ],
  },
  {
    id: 'pie-chart',
    label: 'Pie Chart',
    category: 'business',
    viewBox: '0 0 48 48',
    tags: ['chart', 'pie', 'statistics', 'analytics'],
    paths: [
      { d: 'M24 4a20 20 0 0 1 0 40V4z', fill: '#42A5F5' },
      { d: 'M24 4a20 20 0 0 0-17.3 10L24 24V4z', fill: '#66BB6A' },
      { d: 'M6.7 14A20 20 0 0 0 24 44V24L6.7 14z', fill: '#FFA726' },
    ],
  },
  {
    id: 'handshake',
    label: 'Handshake',
    category: 'business',
    viewBox: '0 0 64 40',
    tags: ['deal', 'agreement', 'partnership', 'business'],
    paths: [
      { d: 'M4 14h12l8 6 8-6h12', stroke: '#FFB74D', strokeWidth: 3 },
      { d: 'M24 20l-10 10 6 4 12-8 8 4', stroke: '#FFB74D', strokeWidth: 3 },
      { d: 'M2 8h14v4H2zM48 8h14v4H48z', fill: '#42A5F5' },
    ],
  },
  {
    id: 'briefcase',
    label: 'Briefcase',
    category: 'business',
    viewBox: '0 0 48 40',
    tags: ['briefcase', 'work', 'business', 'professional'],
    paths: [
      { d: 'M4 12h40a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z', fill: '#8D6E63' },
      { d: 'M16 12V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4', stroke: '#6D4C41', strokeWidth: 2 },
      { d: 'M0 22h48v2H0z', fill: '#6D4C41' },
      { d: 'M20 20h8v6h-8z', fill: '#FFCC80' },
    ],
  },
  {
    id: 'target-bullseye',
    label: 'Target',
    category: 'business',
    viewBox: '0 0 48 48',
    tags: ['target', 'goal', 'aim', 'objective'],
    paths: [
      { d: 'M24 4a20 20 0 1 0 0 40 20 20 0 0 0 0-40z', fill: '#EF5350' },
      { d: 'M24 10a14 14 0 1 0 0 28 14 14 0 0 0 0-28z', fill: '#FFF' },
      { d: 'M24 16a8 8 0 1 0 0 16 8 8 0 0 0 0-16z', fill: '#EF5350' },
      { d: 'M24 22a2 2 0 1 0 0 4 2 2 0 0 0 0-4z', fill: '#FFF' },
    ],
  },
  {
    id: 'rocket-launch',
    label: 'Rocket Launch',
    category: 'business',
    viewBox: '0 0 48 64',
    tags: ['rocket', 'startup', 'launch', 'growth'],
    paths: [
      { d: 'M24 2c-4 10-4 22 0 32 4-10 4-22 0-32z', fill: '#E0E0E0' },
      { d: 'M20 30h8v8h-8z', fill: '#42A5F5' },
      { d: 'M14 34l6-4v8zM34 34l-6-4v8z', fill: '#EF5350' },
      { d: 'M20 38l-2 10h4zM28 38l2 10h-4z', fill: '#FFA726' },
      { d: 'M22 40l2 14 2-14', fill: '#FFCC80' },
      { d: 'M24 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', fill: '#90CAF9' },
    ],
  },
  {
    id: 'lightbulb',
    label: 'Lightbulb',
    category: 'business',
    viewBox: '0 0 40 56',
    tags: ['idea', 'innovation', 'creative', 'bulb'],
    paths: [
      { d: 'M20 4a14 14 0 0 0-8 25.4V36h16v-6.6A14 14 0 0 0 20 4z', fill: '#FDD835' },
      { d: 'M14 38h12v4H14zM16 44h8v4h-8z', fill: '#BDBDBD' },
      { d: 'M20 14v10M14 20h12', stroke: '#FFF', strokeWidth: 2 },
    ],
  },
  {
    id: 'calendar',
    label: 'Calendar',
    category: 'business',
    viewBox: '0 0 48 48',
    tags: ['calendar', 'schedule', 'date', 'planning'],
    paths: [
      { d: 'M6 8h36a2 2 0 0 1 2 2v32a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z', fill: '#FFF' },
      { d: 'M4 8h40v10H4z', fill: '#EF5350' },
      { d: 'M14 4v8M34 4v8', stroke: '#455A64', strokeWidth: 2 },
      { d: 'M10 24h6v6h-6zM20 24h6v6h-6zM30 24h6v6h-6zM10 34h6v6h-6zM20 34h6v6h-6z', fill: '#E0E0E0' },
    ],
  },
  {
    id: 'clipboard-checklist',
    label: 'Checklist',
    category: 'business',
    viewBox: '0 0 40 52',
    tags: ['checklist', 'todo', 'tasks', 'productivity'],
    paths: [
      { d: 'M6 6h28a2 2 0 0 1 2 2v38a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z', fill: '#FFECB3' },
      { d: 'M14 2h12v8H14z', fill: '#8D6E63' },
      { d: 'M10 18l3 3 6-6', stroke: '#66BB6A', strokeWidth: 2 },
      { d: 'M24 18h8v2h-8z', fill: '#BDBDBD' },
      { d: 'M10 28l3 3 6-6', stroke: '#66BB6A', strokeWidth: 2 },
      { d: 'M24 28h8v2h-8z', fill: '#BDBDBD' },
      { d: 'M10 38h4v4h-4z', stroke: '#BDBDBD', strokeWidth: 1 },
      { d: 'M24 38h8v2h-8z', fill: '#BDBDBD' },
    ],
  },
  {
    id: 'trophy',
    label: 'Trophy',
    category: 'business',
    viewBox: '0 0 48 52',
    tags: ['trophy', 'award', 'winner', 'achievement'],
    paths: [
      { d: 'M14 4h20v20a10 10 0 0 1-20 0V4z', fill: '#FDD835' },
      { d: 'M4 4h10v8c-4 0-8-2-10-8zM34 4h10c-2 6-6 8-10 8V4z', fill: '#FBC02D' },
      { d: 'M20 34h8v6h-8z', fill: '#8D6E63' },
      { d: 'M14 40h20v4H14z', fill: '#455A64' },
      { d: 'M10 44h28v4H10z', fill: '#546E7A' },
    ],
  },
]
