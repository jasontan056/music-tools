import type { ScaleKey, FormulaKey, ScaleNode, ShapeNode, Shape } from './types';
import {
    FORMULAS, SCALES, TUNING, STRING_SETS, INVERSIONS,
    NUM_STRINGS, MAX_FRET, NUM_SEMITONES, MAX_FRET_SPAN
} from './constants';

export const computeScaleNodes = (keyType: ScaleKey, rootNote: number): ScaleNode[] => {
    const list: ScaleNode[] = [];
    const targetNotes = SCALES[keyType].intervals.map((int) => (rootNote + int) % NUM_SEMITONES);
    for (let s = 0; s < NUM_STRINGS; s++) {
        for (let f = 0; f <= MAX_FRET; f++) {
            const note = (TUNING[s] + f) % NUM_SEMITONES;
            const intervalIdx = targetNotes.indexOf(note);
            if (intervalIdx !== -1) {
                list.push({ string: s, fret: f, intervalIdx, isKeyRoot: intervalIdx === 0 });
            }
        }
    }
    return list;
};

export const computeShapes = (
    effectiveRoot: number,
    effectiveQuality: FormulaKey,
    stringSet: string,
    inversion: string
): Shape[] => {
    const result: Shape[] = [];
    const formula = FORMULAS[effectiveQuality];
    const targetNotes = formula.intervals.map((interval) => (effectiveRoot + interval) % NUM_SEMITONES);

    const activeSets = stringSet === 'all'
        ? STRING_SETS.filter((s) => s.id !== 'all')
        : STRING_SETS.filter((s) => s.id === stringSet);
    const activeInvs = inversion === 'all'
        ? INVERSIONS.filter((i) => i.id !== 'all')
        : INVERSIONS.filter((i) => i.id === inversion);

    activeSets.forEach((set) => {
        activeInvs.forEach((inv) => {
            const reqIntervals = inv.order;
            const noteCount = set.strings.length;

            const findFrets = (idx: number, frets: number[]): void => {
                if (idx === noteCount) {
                    const activeFrets = frets.filter((f) => f > 0);
                    let isValid = false;
                    if (frets.includes(0)) {
                        if (activeFrets.length === 0 || Math.max(...activeFrets) <= MAX_FRET_SPAN) isValid = true;
                    } else {
                        const span = Math.max(...frets) - Math.min(...frets);
                        if (span <= MAX_FRET_SPAN) isValid = true;
                    }
                    if (isValid) {
                        result.push({
                            id: `${set.id}-${inv.id}-${frets.join('-')}`,
                            inversionId: inv.id,
                            nodes: frets.map((f, i) => ({
                                string: set.strings[i],
                                fret: f,
                                intervalIdx: reqIntervals[i]
                            }))
                        });
                    }
                    return;
                }
                const str = set.strings[idx];
                const wantedNote = targetNotes[reqIntervals[idx]];
                for (let f = 0; f <= MAX_FRET; f++) {
                    if ((TUNING[str] + f) % NUM_SEMITONES === wantedNote) {
                        findFrets(idx + 1, [...frets, f]);
                    }
                }
            };

            findFrets(0, []);
        });
    });
    return result;
};

export const deduplicateNodes = (shapes: Shape[]): ShapeNode[] => {
    const list: ShapeNode[] = [];
    const seen = new Set<string>();
    shapes.forEach((shape) => {
        shape.nodes.forEach((n) => {
            const key = `${n.string}-${n.fret}`;
            if (!seen.has(key)) {
                seen.add(key);
                list.push(n);
            }
        });
    });
    return list;
};

export const computeChordTones = (effectiveRoot: number, effectiveQuality: FormulaKey): ShapeNode[] => {
    const formula = FORMULAS[effectiveQuality];
    const targetNotes = formula.intervals.map((int) => (effectiveRoot + int) % NUM_SEMITONES);
    const list: ShapeNode[] = [];
    for (let s = 0; s < NUM_STRINGS; s++) {
        for (let f = 0; f <= MAX_FRET; f++) {
            const note = (TUNING[s] + f) % NUM_SEMITONES;
            const intervalIdx = targetNotes.indexOf(note);
            if (intervalIdx !== -1) {
                list.push({ string: s, fret: f, intervalIdx });
            }
        }
    }
    return list;
};

/** Build a Set<string> key for O(1) chord tone lookups in the fretboard renderer. */
export const buildNodeSet = (nodes: ShapeNode[]): Set<string> =>
    new Set(nodes.map((n) => `${n.string}-${n.fret}`));
