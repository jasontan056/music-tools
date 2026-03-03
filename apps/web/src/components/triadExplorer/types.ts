// --- Type Definitions ---

export type FormulaKey = 'major' | 'minor' | 'diminished' | 'augmented';

export type ScaleKey = 'major' | 'minor';

export type ScaleNode = {
    string: number;
    fret: number;
    intervalIdx: number;
    isKeyRoot: boolean;
};

export type ShapeNode = {
    string: number;
    fret: number;
    intervalIdx: number;
};

export type Shape = {
    id: string;
    inversionId: string;
    nodes: ShapeNode[];
};
