import type { FormulaKey } from './types';

// --- Named Constants (replacing magic numbers) ---
export const NUM_STRINGS = 6;
export const MAX_FRET = 15;
export const NUM_SEMITONES = 12;
export const MAX_FRET_SPAN = 4;
export const DOUBLE_INLAY_FRET = 12;

// --- Note Names ---
export const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// --- Chord Formulas ---
export const FORMULAS = {
    major: { name: 'Major', abbr: 'Maj', intervals: [0, 4, 7], labels: ['R', '3', '5'] },
    minor: { name: 'Minor', abbr: 'Min', intervals: [0, 3, 7], labels: ['R', 'b3', '5'] },
    diminished: { name: 'Diminished', abbr: 'Dim', intervals: [0, 3, 6], labels: ['R', 'b3', 'b5'] },
    augmented: { name: 'Augmented', abbr: 'Aug', intervals: [0, 4, 8], labels: ['R', '3', '#5'] }
} as const;

// --- Scale Data ---
export const SCALES = {
    major: {
        name: 'Major',
        intervals: [0, 2, 4, 5, 7, 9, 11],
        scaleLabels: ['R', '2', '3', '4', '5', '6', '7'],
        chords: [
            { degree: 'I', quality: 'major' as FormulaKey },
            { degree: 'ii', quality: 'minor' as FormulaKey },
            { degree: 'iii', quality: 'minor' as FormulaKey },
            { degree: 'IV', quality: 'major' as FormulaKey },
            { degree: 'V', quality: 'major' as FormulaKey },
            { degree: 'vi', quality: 'minor' as FormulaKey },
            { degree: 'vii°', quality: 'diminished' as FormulaKey }
        ]
    },
    minor: {
        name: 'Natural Minor',
        intervals: [0, 2, 3, 5, 7, 8, 10],
        scaleLabels: ['R', '2', 'b3', '4', '5', 'b6', 'b7'],
        chords: [
            { degree: 'i', quality: 'minor' as FormulaKey },
            { degree: 'ii°', quality: 'diminished' as FormulaKey },
            { degree: 'III', quality: 'major' as FormulaKey },
            { degree: 'iv', quality: 'minor' as FormulaKey },
            { degree: 'v', quality: 'minor' as FormulaKey },
            { degree: 'VI', quality: 'major' as FormulaKey },
            { degree: 'VII', quality: 'major' as FormulaKey }
        ]
    }
} as const;

// --- Guitar Tuning (standard: E A D G B E) ---
export const TUNING = [4, 9, 2, 7, 11, 4];

// --- String Sets ---
export const STRING_SETS = [
    { id: 'all', label: 'All Sets', strings: [] as number[] },
    { id: '321', label: 'G-B-E (3-2-1)', strings: [3, 4, 5] },
    { id: '432', label: 'D-G-B (4-3-2)', strings: [2, 3, 4] },
    { id: '543', label: 'A-D-G (5-4-3)', strings: [1, 2, 3] },
    { id: '654', label: 'E-A-D (6-5-4)', strings: [0, 1, 2] }
];

/** O(1) lookup for string set strings by ID. Safer than find(...)! */
export const stringSetMap = new Map<string, number[]>(
    STRING_SETS.map((s) => [s.id, s.strings])
);

// --- Inversions ---
export const INVERSIONS = [
    { id: 'all', label: 'All Inversions', order: [] as number[] },
    { id: 'root', label: 'Root Position', order: [0, 1, 2] },
    { id: '1st', label: '1st Inversion', order: [1, 2, 0] },
    { id: '2nd', label: '2nd Inversion', order: [2, 0, 1] }
];

// --- Fretboard Display ---
export const INLAY_FRETS = [3, 5, 7, 9, 15];

export const LEGEND_ITEMS = [
    { label: 'Root', cls: 'nodeRoot' },
    { label: '3rd', cls: 'nodeThird' },
    { label: '5th', cls: 'nodeFifth' }
];

export const SHORTCUTS = [
    { keys: '1 – 7', desc: 'Select chord degree' },
    { keys: '8', desc: 'Toggle scale overlay' },
    { keys: '← →', desc: 'Cycle root note' },
    { keys: '↑ ↓', desc: 'Toggle Major / Minor' },
    { keys: 'N', desc: 'Toggle Notes / Intervals' },
    { keys: '?', desc: 'Show / hide shortcuts' }
];
