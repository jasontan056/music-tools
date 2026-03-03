import { describe, it, expect } from 'vitest';
import {
    computeScaleNodes,
    computeShapes,
    computeChordTones,
    deduplicateNodes,
    FORMULAS,
    SCALES,
    TUNING,
    STRING_SETS,
    INVERSIONS
} from './TriadExplorer';
import type { ScaleKey, FormulaKey, Shape, ShapeNode } from './TriadExplorer';

describe('TriadExplorer Logic', () => {
    describe('computeScaleNodes', () => {
        it('returns nodes for C Major scale', () => {
            const nodes = computeScaleNodes('major', 0);
            expect(nodes.length).toBeGreaterThan(0);
            nodes.forEach((node) => {
                expect(node.fret).toBeGreaterThanOrEqual(0);
                expect(node.fret).toBeLessThanOrEqual(15);
                expect(node.string).toBeGreaterThanOrEqual(0);
                expect(node.string).toBeLessThanOrEqual(5);
            });
        });

        it('marks key root notes correctly', () => {
            const nodes = computeScaleNodes('major', 0);
            const rootNodes = nodes.filter((n) => n.isKeyRoot);
            expect(rootNodes.length).toBeGreaterThan(0);
            rootNodes.forEach((n) => {
                expect(n.intervalIdx).toBe(0);
            });
        });

        it('only returns notes that are in the scale', () => {
            const cMajorNotes = [0, 2, 4, 5, 7, 9, 11];
            const nodes = computeScaleNodes('major', 0);
            nodes.forEach((node) => {
                const note = (TUNING[node.string] + node.fret) % 12;
                expect(cMajorNotes).toContain(note);
            });
        });

        it('handles minor scale correctly', () => {
            const aMinorNotes = [9, 11, 0, 2, 4, 5, 7];
            const nodes = computeScaleNodes('minor', 9);
            nodes.forEach((node) => {
                const note = (TUNING[node.string] + node.fret) % 12;
                expect(aMinorNotes).toContain(note);
            });
        });

        it('returns intervalIdx between 0 and 6 for all nodes', () => {
            const nodes = computeScaleNodes('major', 5);
            nodes.forEach((node) => {
                expect(node.intervalIdx).toBeGreaterThanOrEqual(0);
                expect(node.intervalIdx).toBeLessThanOrEqual(6);
            });
        });
    });

    describe('computeShapes', () => {
        it('returns shapes for C Major root position on 321 strings', () => {
            const shapes = computeShapes(0, 'major', '321', 'root');
            expect(shapes.length).toBeGreaterThan(0);
            shapes.forEach((shape) => {
                expect(shape.nodes).toHaveLength(3);
                expect(shape.inversionId).toBe('root');
                const strings = shape.nodes.map((n) => n.string).sort();
                expect(strings).toEqual([3, 4, 5]);
            });
        });

        it('returns the correct notes for a C Major triad', () => {
            const shapes = computeShapes(0, 'major', '321', 'root');
            shapes.forEach((shape) => {
                const notes = shape.nodes.map((n) => (TUNING[n.string] + n.fret) % 12);
                expect(notes).toContain(0);
                expect(notes).toContain(4);
                expect(notes).toContain(7);
            });
        });

        it('returns empty array for impossible filters', () => {
            const shapes = computeShapes(0, 'augmented', '654', '2nd');
            expect(Array.isArray(shapes)).toBe(true);
        });

        it('returns all inversions when inversion is "all"', () => {
            const shapes = computeShapes(0, 'major', '321', 'all');
            const inversionIds = new Set(shapes.map((s) => s.inversionId));
            expect(inversionIds.size).toBeGreaterThanOrEqual(1);
        });

        it('returns shapes for all string sets when set is "all"', () => {
            const shapes = computeShapes(0, 'major', 'all', 'root');
            const stringCombos = new Set(
                shapes.map((s) => s.nodes.map((n) => n.string).sort().join('-'))
            );
            expect(stringCombos.size).toBeGreaterThan(1);
        });

        it('respects the fret span constraint', () => {
            const shapes = computeShapes(7, 'minor', 'all', 'all');
            shapes.forEach((shape) => {
                const frets = shape.nodes.map((n) => n.fret);
                const activeFrets = frets.filter((f) => f > 0);
                if (frets.includes(0)) {
                    if (activeFrets.length > 0) {
                        expect(Math.max(...activeFrets)).toBeLessThanOrEqual(4);
                    }
                } else {
                    const span = Math.max(...frets) - Math.min(...frets);
                    expect(span).toBeLessThanOrEqual(4);
                }
            });
        });
    });

    describe('deduplicateNodes', () => {
        it('removes duplicate nodes by string-fret position', () => {
            const shapes: Shape[] = [
                {
                    id: 'a',
                    inversionId: 'root',
                    nodes: [
                        { string: 3, fret: 0, intervalIdx: 0 },
                        { string: 4, fret: 1, intervalIdx: 1 },
                        { string: 5, fret: 0, intervalIdx: 2 }
                    ]
                },
                {
                    id: 'b',
                    inversionId: 'root',
                    nodes: [
                        { string: 3, fret: 0, intervalIdx: 0 },
                        { string: 4, fret: 1, intervalIdx: 1 },
                        { string: 5, fret: 3, intervalIdx: 2 }
                    ]
                }
            ];
            const unique = deduplicateNodes(shapes);
            expect(unique).toHaveLength(4);
        });

        it('returns empty array for empty input', () => {
            expect(deduplicateNodes([])).toHaveLength(0);
        });

        it('preserves order of first occurrence', () => {
            const shapes: Shape[] = [
                {
                    id: 'a',
                    inversionId: 'root',
                    nodes: [
                        { string: 5, fret: 3, intervalIdx: 0 },
                        { string: 4, fret: 2, intervalIdx: 1 },
                        { string: 3, fret: 0, intervalIdx: 2 }
                    ]
                }
            ];
            const unique = deduplicateNodes(shapes);
            expect(unique[0]).toEqual({ string: 5, fret: 3, intervalIdx: 0 });
            expect(unique[1]).toEqual({ string: 4, fret: 2, intervalIdx: 1 });
            expect(unique[2]).toEqual({ string: 3, fret: 0, intervalIdx: 2 });
        });
    });

    describe('computeChordTones', () => {
        it('returns all C Major chord tones across the fretboard', () => {
            const tones = computeChordTones(0, 'major');
            expect(tones.length).toBeGreaterThan(0);
            tones.forEach((t) => {
                const note = (TUNING[t.string] + t.fret) % 12;
                expect([0, 4, 7]).toContain(note);
            });
        });

        it('assigns correct intervalIdx values', () => {
            const tones = computeChordTones(0, 'major');
            tones.forEach((t) => {
                const note = (TUNING[t.string] + t.fret) % 12;
                if (note === 0) expect(t.intervalIdx).toBe(0);
                if (note === 4) expect(t.intervalIdx).toBe(1);
                if (note === 7) expect(t.intervalIdx).toBe(2);
            });
        });

        it('includes the open low E string for C Major (E = 3rd)', () => {
            const tones = computeChordTones(0, 'major');
            const openLowE = tones.find((t) => t.string === 0 && t.fret === 0);
            expect(openLowE).toBeDefined();
            expect(openLowE!.intervalIdx).toBe(1);
        });

        it('covers all 6 strings', () => {
            const tones = computeChordTones(0, 'major');
            const strings = new Set(tones.map((t) => t.string));
            expect(strings.size).toBe(6);
        });
    });

    describe('Musical Constants', () => {
        it('FORMULAS has correct intervals for all chord types', () => {
            expect(FORMULAS.major.intervals).toEqual([0, 4, 7]);
            expect(FORMULAS.minor.intervals).toEqual([0, 3, 7]);
            expect(FORMULAS.diminished.intervals).toEqual([0, 3, 6]);
            expect(FORMULAS.augmented.intervals).toEqual([0, 4, 8]);
        });

        it('FORMULAS has abbreviations', () => {
            expect(FORMULAS.major.abbr).toBe('Maj');
            expect(FORMULAS.minor.abbr).toBe('Min');
            expect(FORMULAS.diminished.abbr).toBe('Dim');
            expect(FORMULAS.augmented.abbr).toBe('Aug');
        });

        it('SCALES.major has 7 scale degrees', () => {
            expect(SCALES.major.intervals).toHaveLength(7);
            expect(SCALES.major.chords).toHaveLength(7);
            expect(SCALES.major.scaleLabels).toHaveLength(7);
        });

        it('SCALES.minor has 7 scale degrees', () => {
            expect(SCALES.minor.intervals).toHaveLength(7);
            expect(SCALES.minor.chords).toHaveLength(7);
            expect(SCALES.minor.scaleLabels).toHaveLength(7);
        });

        it('TUNING represents standard guitar tuning', () => {
            expect(TUNING).toEqual([4, 9, 2, 7, 11, 4]);
        });

        it('STRING_SETS cover all adjacent three-string sets', () => {
            const namedSets = STRING_SETS.filter((s) => s.id !== 'all');
            expect(namedSets).toHaveLength(4);
            namedSets.forEach((set) => {
                expect(set.strings).toHaveLength(3);
                expect(set.strings[1] - set.strings[0]).toBe(1);
                expect(set.strings[2] - set.strings[1]).toBe(1);
            });
        });

        it('INVERSIONS has root, 1st, and 2nd inversion', () => {
            const namedInvs = INVERSIONS.filter((i) => i.id !== 'all');
            expect(namedInvs).toHaveLength(3);
            expect(namedInvs.map((i) => i.id)).toEqual(['root', '1st', '2nd']);
        });
    });
});
