export { TriadExplorer } from './TriadExplorer';
export { default } from './TriadExplorer';

// Re-export types and logic for tests
export type { ScaleKey, FormulaKey, ScaleNode, ShapeNode, Shape } from './types';
export {
    FORMULAS, SCALES, TUNING, STRING_SETS, INVERSIONS,
    NUM_STRINGS, MAX_FRET, NUM_SEMITONES, MAX_FRET_SPAN
} from './constants';
export {
    computeScaleNodes, computeShapes, computeChordTones, deduplicateNodes
} from './logic';
