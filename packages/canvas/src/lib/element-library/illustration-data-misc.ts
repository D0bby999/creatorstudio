/**
 * Misc category illustrations — Nature, Education, Abstract
 */

import type { IllustrationDefinition } from './illustration-data-index'

export const MISC_ILLUSTRATIONS: IllustrationDefinition[] = [
  // --- Nature ---
  {
    id: 'tree',
    label: 'Tree',
    category: 'nature',
    viewBox: '0 0 48 56',
    tags: ['tree', 'nature', 'plant', 'forest'],
    paths: [
      { d: 'M24 4l16 24H8z', fill: '#66BB6A' },
      { d: 'M24 14l12 18H12z', fill: '#43A047' },
      { d: 'M20 38h8v14h-8z', fill: '#8D6E63' },
    ],
  },
  {
    id: 'mountain',
    label: 'Mountain',
    category: 'nature',
    viewBox: '0 0 64 40',
    tags: ['mountain', 'landscape', 'nature', 'outdoor'],
    paths: [
      { d: 'M0 40l24-36 24 36z', fill: '#78909C' },
      { d: 'M24 4l8 12-4-2-4 6-4-6-4 2z', fill: '#ECEFF1' },
      { d: 'M32 40l16-24 16 24z', fill: '#90A4AE' },
    ],
  },
  {
    id: 'sun',
    label: 'Sun',
    category: 'nature',
    viewBox: '0 0 48 48',
    tags: ['sun', 'sunny', 'weather', 'bright'],
    paths: [
      { d: 'M24 14a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', fill: '#FDD835' },
      { d: 'M24 2v8M24 38v8M2 24h8M38 24h8M8 8l6 6M34 34l6 6M8 40l6-6M34 14l6-6', stroke: '#FBC02D', strokeWidth: 3 },
    ],
  },
  {
    id: 'leaf',
    label: 'Leaf',
    category: 'nature',
    viewBox: '0 0 40 48',
    tags: ['leaf', 'eco', 'green', 'organic'],
    paths: [
      { d: 'M20 4C8 8 2 24 6 38c4-2 12-8 14-16 2 8 10 14 14 16 4-14-2-30-14-34z', fill: '#66BB6A' },
      { d: 'M20 4c0 16-2 28-2 28', stroke: '#43A047', strokeWidth: 2 },
    ],
  },
  {
    id: 'water-drop',
    label: 'Water Drop',
    category: 'nature',
    viewBox: '0 0 32 44',
    tags: ['water', 'drop', 'rain', 'liquid'],
    paths: [
      { d: 'M16 2C16 2 2 20 2 30a14 14 0 0 0 28 0C30 20 16 2 16 2z', fill: '#42A5F5' },
      { d: 'M10 28a6 6 0 0 0 6 6', stroke: '#E3F2FD', strokeWidth: 2 },
    ],
  },
  {
    id: 'flower',
    label: 'Flower',
    category: 'nature',
    viewBox: '0 0 48 56',
    tags: ['flower', 'garden', 'bloom', 'botanical'],
    paths: [
      { d: 'M24 18a6 6 0 1 0 0-12c-3 0-6 3-6 6a6 6 0 0 0-6-6c-3 0-6 3-6 6a6 6 0 0 0 12 0 6 6 0 0 0 0 12c3 0 6-3 6-6a6 6 0 0 0 6 6c3 0 6-3 6-6a6 6 0 0 0-12 0z', fill: '#F48FB1' },
      { d: 'M24 14a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', fill: '#FDD835' },
      { d: 'M22 26h4v24h-4z', fill: '#66BB6A' },
      { d: 'M18 36c4-4 6-8 6-8M30 32c-4-2-6-6-6-6', stroke: '#66BB6A', strokeWidth: 2 },
    ],
  },
  // --- Education ---
  {
    id: 'book',
    label: 'Book',
    category: 'education',
    viewBox: '0 0 44 48',
    tags: ['book', 'reading', 'education', 'knowledge'],
    paths: [
      { d: 'M6 4h32a2 2 0 0 1 2 2v36a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', fill: '#5C6BC0' },
      { d: 'M10 4h2v40h-2z', fill: '#3F51B5' },
      { d: 'M16 12h18v2H16zM16 18h14v2H16zM16 24h16v2H16z', fill: '#C5CAE9' },
    ],
  },
  {
    id: 'graduation-cap',
    label: 'Graduation Cap',
    category: 'education',
    viewBox: '0 0 56 40',
    tags: ['graduation', 'education', 'degree', 'university'],
    paths: [
      { d: 'M28 4L2 18l26 14 26-14z', fill: '#455A64' },
      { d: 'M12 22v10c0 4 7 8 16 8s16-4 16-8V22L28 30 12 22z', fill: '#37474F' },
      { d: 'M50 18v16', stroke: '#FDD835', strokeWidth: 2 },
      { d: 'M48 34a4 4 0 1 0 4 0', fill: '#FDD835' },
    ],
  },
  {
    id: 'pencil',
    label: 'Pencil',
    category: 'education',
    viewBox: '0 0 12 56',
    tags: ['pencil', 'write', 'draw', 'create'],
    paths: [
      { d: 'M2 8h8v36H2z', fill: '#FDD835' },
      { d: 'M2 8h8l-4-8z', fill: '#FFECB3' },
      { d: 'M2 44h8l-4 10z', fill: '#455A64' },
      { d: 'M4 48l2 6 2-6', fill: '#FFB74D' },
    ],
  },
  {
    id: 'globe',
    label: 'Globe',
    category: 'education',
    viewBox: '0 0 48 48',
    tags: ['globe', 'world', 'geography', 'earth'],
    paths: [
      { d: 'M24 4a20 20 0 1 0 0 40 20 20 0 0 0 0-40z', fill: '#42A5F5' },
      { d: 'M24 4c-6 0-10 9-10 20s4 20 10 20 10-9 10-20S30 4 24 4z', fill: '#66BB6A' },
      { d: 'M6 16h36M4 24h40M6 32h36', stroke: '#90CAF9', strokeWidth: 1 },
    ],
  },
  {
    id: 'microscope',
    label: 'Microscope',
    category: 'education',
    viewBox: '0 0 40 52',
    tags: ['microscope', 'science', 'research', 'lab'],
    paths: [
      { d: 'M22 4a4 4 0 0 1 4 4v20h-8V8a4 4 0 0 1 4-4z', fill: '#78909C' },
      { d: 'M18 28h8v4h-8z', fill: '#546E7A' },
      { d: 'M14 32h16v4H14z', fill: '#455A64' },
      { d: 'M22 36v8', stroke: '#455A64', strokeWidth: 3 },
      { d: 'M10 44h24v4H10z', fill: '#37474F' },
      { d: 'M26 8l8-4v4l-8 4', fill: '#90A4AE' },
    ],
  },
  {
    id: 'chalkboard',
    label: 'Chalkboard',
    category: 'education',
    viewBox: '0 0 56 44',
    tags: ['chalkboard', 'teaching', 'classroom', 'school'],
    paths: [
      { d: 'M4 2h48v32H4z', fill: '#2E7D32' },
      { d: 'M6 4h44v28H6z', fill: '#388E3C' },
      { d: 'M12 12h20v2H12zM12 18h16v2H12zM12 24h24v2H12z', fill: '#A5D6A7' },
      { d: 'M0 34h56v4H0z', fill: '#8D6E63' },
      { d: 'M16 38h6v6h-6zM34 38h6v6h-6z', fill: '#6D4C41' },
    ],
  },
  // --- Abstract ---
  {
    id: 'wavy-lines',
    label: 'Wavy Lines',
    category: 'abstract',
    viewBox: '0 0 64 40',
    tags: ['wave', 'abstract', 'pattern', 'decoration'],
    paths: [
      { d: 'M0 10c10-8 20 8 32 0s22-8 32 0', stroke: '#42A5F5', strokeWidth: 3 },
      { d: 'M0 20c10-8 20 8 32 0s22-8 32 0', stroke: '#66BB6A', strokeWidth: 3 },
      { d: 'M0 30c10-8 20 8 32 0s22-8 32 0', stroke: '#FFA726', strokeWidth: 3 },
    ],
  },
  {
    id: 'dots-pattern',
    label: 'Dots Pattern',
    category: 'abstract',
    viewBox: '0 0 48 48',
    tags: ['dots', 'pattern', 'abstract', 'decorative'],
    paths: [
      { d: 'M8 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', fill: '#EF5350' },
      { d: 'M24 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', fill: '#42A5F5' },
      { d: 'M40 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', fill: '#66BB6A' },
      { d: 'M8 24a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', fill: '#FFA726' },
      { d: 'M24 24a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', fill: '#AB47BC' },
      { d: 'M40 24a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', fill: '#EF5350' },
      { d: 'M8 40a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', fill: '#42A5F5' },
      { d: 'M24 40a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', fill: '#66BB6A' },
      { d: 'M40 40a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', fill: '#FFA726' },
    ],
  },
  {
    id: 'geometric-composition',
    label: 'Geometric',
    category: 'abstract',
    viewBox: '0 0 48 48',
    tags: ['geometric', 'shapes', 'abstract', 'modern'],
    paths: [
      { d: 'M4 4h18v18H4z', fill: '#42A5F5' },
      { d: 'M26 4h18v18H26z', fill: '#FFA726', stroke: '#F57C00', strokeWidth: 1 },
      { d: 'M4 26l18 18H4z', fill: '#66BB6A' },
      { d: 'M35 44a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', fill: '#EF5350' },
    ],
  },
  {
    id: 'gradient-blob',
    label: 'Blob',
    category: 'abstract',
    viewBox: '0 0 48 48',
    tags: ['blob', 'organic', 'abstract', 'shape'],
    paths: [
      { d: 'M24 6c12 0 20 6 18 14s-4 16-10 18-14 2-20-2S2 26 4 18 12 6 24 6z', fill: '#CE93D8' },
    ],
  },
  {
    id: 'zigzag',
    label: 'Zigzag',
    category: 'abstract',
    viewBox: '0 0 64 32',
    tags: ['zigzag', 'pattern', 'abstract', 'line'],
    paths: [
      { d: 'M0 24l8-16 8 16 8-16 8 16 8-16 8 16 8-16 8 16', stroke: '#EF5350', strokeWidth: 3 },
      { d: 'M0 16l8-8 8 8 8-8 8 8 8-8 8 8 8-8 8 8', stroke: '#42A5F5', strokeWidth: 2 },
    ],
  },
  {
    id: 'concentric-circles',
    label: 'Circles',
    category: 'abstract',
    viewBox: '0 0 48 48',
    tags: ['circles', 'concentric', 'abstract', 'rings'],
    paths: [
      { d: 'M24 4a20 20 0 1 0 0 40 20 20 0 0 0 0-40z', stroke: '#42A5F5', strokeWidth: 2 },
      { d: 'M24 10a14 14 0 1 0 0 28 14 14 0 0 0 0-28z', stroke: '#66BB6A', strokeWidth: 2 },
      { d: 'M24 16a8 8 0 1 0 0 16 8 8 0 0 0 0-16z', stroke: '#FFA726', strokeWidth: 2 },
      { d: 'M24 22a2 2 0 1 0 0 4 2 2 0 0 0 0-4z', fill: '#EF5350' },
    ],
  },
]
