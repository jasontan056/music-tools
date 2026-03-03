import { useState, useMemo } from 'react';
import { Settings2, Music, Hash, SlidersHorizontal, X } from 'lucide-react';
import styles from './TriadExplorer.module.css';

// --- CONSTANTS & MUSICAL DATA ---
const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const FORMULAS = {
    major: { name: 'Major', intervals: [0, 4, 7], labels: ['R', '3', '5'] },
    minor: { name: 'Minor', intervals: [0, 3, 7], labels: ['R', 'b3', '5'] },
    diminished: { name: 'Diminished', intervals: [0, 3, 6], labels: ['R', 'b3', 'b5'] },
    augmented: { name: 'Augmented', intervals: [0, 4, 8], labels: ['R', '3', '#5'] }
} as const;

export type FormulaKey = keyof typeof FORMULAS;

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

export type ScaleKey = keyof typeof SCALES;

export const TUNING = [4, 9, 2, 7, 11, 4];

export const STRING_SETS = [
    { id: 'all', label: 'All Sets', strings: [] as number[] },
    { id: '321', label: 'G-B-E (3-2-1)', strings: [3, 4, 5] },
    { id: '432', label: 'D-G-B (4-3-2)', strings: [2, 3, 4] },
    { id: '543', label: 'A-D-G (5-4-3)', strings: [1, 2, 3] },
    { id: '654', label: 'E-A-D (6-5-4)', strings: [0, 1, 2] }
];

export const INVERSIONS = [
    { id: 'all', label: 'All Inversions', order: [] as number[] },
    { id: 'root', label: 'Root Position', order: [0, 1, 2] },
    { id: '1st', label: '1st Inversion', order: [1, 2, 0] },
    { id: '2nd', label: '2nd Inversion', order: [2, 0, 1] }
];

// --- PURE LOGIC (exported for tests) ---
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

export const computeScaleNodes = (keyType: ScaleKey, rootNote: number): ScaleNode[] => {
    const list: ScaleNode[] = [];
    const targetNotes = SCALES[keyType].intervals.map((int) => (rootNote + int) % 12);
    for (let s = 0; s < 6; s++) {
        for (let f = 0; f <= 15; f++) {
            const note = (TUNING[s] + f) % 12;
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
    const targetNotes = formula.intervals.map((interval) => (effectiveRoot + interval) % 12);
    const activeSets = stringSet === 'all' ? STRING_SETS.filter((s) => s.id !== 'all') : STRING_SETS.filter((s) => s.id === stringSet);
    const activeInvs = inversion === 'all' ? INVERSIONS.filter((i) => i.id !== 'all') : INVERSIONS.filter((i) => i.id === inversion);

    activeSets.forEach((set) => {
        activeInvs.forEach((inv) => {
            const reqIntervals = inv.order;
            const [str0, str1, str2] = set.strings;
            for (let f0 = 0; f0 <= 15; f0++) {
                if ((TUNING[str0] + f0) % 12 === targetNotes[reqIntervals[0]]) {
                    for (let f1 = 0; f1 <= 15; f1++) {
                        if ((TUNING[str1] + f1) % 12 === targetNotes[reqIntervals[1]]) {
                            for (let f2 = 0; f2 <= 15; f2++) {
                                if ((TUNING[str2] + f2) % 12 === targetNotes[reqIntervals[2]]) {
                                    const frets = [f0, f1, f2];
                                    const activeFrets = frets.filter((f) => f > 0);
                                    let isValidShape = false;
                                    if (frets.includes(0)) {
                                        if (activeFrets.length === 0 || Math.max(...activeFrets) <= 4) isValidShape = true;
                                    } else {
                                        const span = Math.max(...frets) - Math.min(...frets);
                                        if (span <= 4) isValidShape = true;
                                    }
                                    if (isValidShape) {
                                        result.push({
                                            id: `${set.id}-${inv.id}-${f0}-${f1}-${f2}`,
                                            inversionId: inv.id,
                                            nodes: [
                                                { string: str0, fret: f0, intervalIdx: reqIntervals[0] },
                                                { string: str1, fret: f1, intervalIdx: reqIntervals[1] },
                                                { string: str2, fret: f2, intervalIdx: reqIntervals[2] }
                                            ]
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    });
    return result;
};

export const deduplicateNodes = (shapes: Shape[]): ShapeNode[] => {
    const list: ShapeNode[] = [];
    const map = new Set<string>();
    shapes.forEach((shape) => {
        shape.nodes.forEach((n) => {
            const key = `${n.string}-${n.fret}`;
            if (!map.has(key)) {
                map.add(key);
                list.push(n);
            }
        });
    });
    return list;
};

// --- RENDERING HELPERS ---
const getColCenter = (fret: number) => (fret === 0 ? 2 : 4 + (fret - 1) * 6.4 + 3.2);
const getRowCenter = (stringIdx: number) => 10 + (5 - stringIdx) * 16;

const getNodeColorClass = (intervalIdx: number) => {
    if (intervalIdx === 0) return styles.nodeRoot;
    if (intervalIdx === 1) return styles.nodeThird;
    if (intervalIdx === 2) return styles.nodeFifth;
    return '';
};

const INLAY_FRETS = [3, 5, 7, 9, 15];

// --- KEY CENTER PANEL (♭/♯ toggle inside) ---
const KeyCenterPanel = ({
    notesList, rootNote, setRootNote, accidental, setAccidental
}: {
    notesList: string[];
    rootNote: number;
    setRootNote: (v: number) => void;
    accidental: 'sharp' | 'flat';
    setAccidental: (fn: (a: 'sharp' | 'flat') => 'sharp' | 'flat') => void;
}) => (
    <div className={styles.panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span className={styles.panelLabel} style={{ marginBottom: 0 }}>Key Center</span>
            <button
                className={styles.accidentalBtn}
                onClick={() => setAccidental((a) => (a === 'sharp' ? 'flat' : 'sharp'))}
            >
                <Hash size={11} /> Toggle ♭/♯
            </button>
        </div>
        <div className={styles.noteGrid}>
            {notesList.map((note, idx) => (
                <button
                    key={note}
                    onClick={() => setRootNote(idx)}
                    className={`${styles.noteBtn} ${rootNote === idx ? styles.noteBtnActive : ''}`}
                >
                    {note}
                </button>
            ))}
        </div>
    </div>
);

// --- CHORDS PANEL ---
const ChordsPanel = ({
    notesList, rootNote, keyType, setKeyType, activeDegree, setActiveDegree,
    showFullScale, setShowFullScale
}: {
    notesList: string[];
    rootNote: number;
    keyType: ScaleKey;
    setKeyType: (v: ScaleKey) => void;
    activeDegree: number;
    setActiveDegree: (v: number) => void;
    showFullScale: boolean;
    setShowFullScale: (v: boolean) => void;
}) => (
    <div className={styles.panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span className={styles.panelLabel} style={{ marginBottom: 0 }}>Chords & Scale</span>
            <div className={styles.toggleBar}>
                <button
                    className={`${styles.toggleBtn} ${keyType === 'major' ? styles.toggleBtnActive : ''}`}
                    onClick={() => { setKeyType('major'); setActiveDegree(0); }}
                >Maj</button>
                <button
                    className={`${styles.toggleBtn} ${keyType === 'minor' ? styles.toggleBtnActive : ''}`}
                    onClick={() => { setKeyType('minor'); setActiveDegree(0); }}
                >Min</button>
            </div>
        </div>
        <div className={styles.chordGrid}>
            {SCALES[keyType].chords.map((chord, idx) => {
                const chordRoot = (rootNote + SCALES[keyType].intervals[idx]) % 12;
                return (
                    <button
                        key={idx}
                        onClick={() => setActiveDegree(idx)}
                        className={`${styles.chordBtn} ${activeDegree === idx ? styles.chordBtnActive : ''}`}
                    >
                        <span className={styles.chordDegree}>{chord.degree}</span>
                        <span className={styles.chordSubtext}>
                            {notesList[chordRoot]}{FORMULAS[chord.quality].name.substring(0, 3)}
                        </span>
                    </button>
                );
            })}
            <button
                onClick={() => setShowFullScale(!showFullScale)}
                className={`${styles.chordBtn} ${showFullScale ? styles.scaleBtnActive : ''}`}
            >
                <span className={styles.chordDegree}>Scale</span>
                <span className={styles.chordSubtext}>Overlay</span>
            </button>
        </div>
    </div>
);

// --- FILTERS PANEL ---
const FiltersPanel = ({
    stringSet, setStringSet, inversion, setInversion
}: {
    stringSet: string;
    setStringSet: (v: string) => void;
    inversion: string;
    setInversion: (v: string) => void;
}) => (
    <>
        <div className={styles.panel}>
            <span className={styles.panelLabel}>String Set</span>
            <div className={styles.filterStack}>
                {STRING_SETS.map((set) => (
                    <button
                        key={set.id}
                        onClick={() => setStringSet(set.id)}
                        className={`${styles.filterBtn} ${stringSet === set.id ? styles.filterBtnActive : ''}`}
                    >{set.label}</button>
                ))}
            </div>
        </div>
        <div className={styles.panel}>
            <span className={styles.panelLabel}>Inversion</span>
            <div className={styles.filterStack}>
                {INVERSIONS.map((inv) => (
                    <button
                        key={inv.id}
                        onClick={() => setInversion(inv.id)}
                        className={`${styles.filterBtn} ${inversion === inv.id ? styles.filterBtnActive : ''}`}
                    >{inv.label}</button>
                ))}
            </div>
        </div>
    </>
);

// --- FRETBOARD RENDERER ---
const FretboardView = ({
    scaleNodes, uniqueNodes, shapes, keyType, rootNote, activeDegree,
    effectiveRoot, effectiveQuality, stringSet, showFullScale, labelType, notesList
}: {
    scaleNodes: ScaleNode[];
    uniqueNodes: ShapeNode[];
    shapes: Shape[];
    keyType: ScaleKey;
    rootNote: number;
    activeDegree: number;
    effectiveRoot: number;
    effectiveQuality: FormulaKey;
    stringSet: string;
    showFullScale: boolean;
    labelType: 'intervals' | 'notes';
    notesList: string[];
}) => (
    <div className={styles.fretboardWrapper}>
        <div className={styles.fretboard}>
            <div className={styles.fretNut} />
            {[...Array(15)].map((_, i) => (
                <div key={i + 1} className={styles.fretColumn} style={{ left: `${4 + i * 6.4}%` }}>
                    {INLAY_FRETS.includes(i + 1) && <div className={styles.inlayDot} />}
                    {i + 1 === 12 && (
                        <div className={styles.doubleInlay}>
                            <div className={styles.inlayDot} />
                            <div className={styles.inlayDot} />
                        </div>
                    )}
                </div>
            ))}
            {[...Array(6)].map((_, i) => (
                <div
                    key={i}
                    className={styles.string}
                    style={{
                        top: `${getRowCenter(i)}%`,
                        height: `${1 + i * 0.5}px`,
                        transform: 'translateY(-50%)',
                        opacity: stringSet !== 'all' && !STRING_SETS.find((s) => s.id === stringSet)!.strings.includes(i) ? 0.2 : 1
                    }}
                />
            ))}
            <div className={styles.fretNumbers}>
                <div className={styles.fretNumNut}>0</div>
                {[...Array(15)].map((_, i) => (
                    <div key={i + 1} className={styles.fretNum}>{i + 1}</div>
                ))}
            </div>
            {scaleNodes.map((node) => {
                const isActiveStringSet = stringSet === 'all' || STRING_SETS.find((s) => s.id === stringSet)!.strings.includes(node.string);
                const isTriad = uniqueNodes.some((n) => n.string === node.string && n.fret === node.fret);
                if (!showFullScale) {
                    return (
                        <div
                            key={`scale-dot-${node.string}-${node.fret}`}
                            className={`${styles.scaleDot} ${node.isKeyRoot ? styles.scaleDotRoot : styles.scaleDotNormal}`}
                            style={{ left: `${getColCenter(node.fret)}%`, top: `${getRowCenter(node.string)}%`, opacity: isActiveStringSet ? 0.6 : 0.15 }}
                        />
                    );
                }
                if (isTriad) return null;
                return (
                    <div
                        key={`scale-full-${node.string}-${node.fret}`}
                        className={`${styles.nodeBase} ${styles.nodeScale}`}
                        style={{ left: `${getColCenter(node.fret)}%`, top: `${getRowCenter(node.string)}%`, opacity: isActiveStringSet ? 0.8 : 0.2 }}
                    >
                        {labelType === 'intervals' ? SCALES[keyType].scaleLabels[node.intervalIdx] : notesList[(rootNote + SCALES[keyType].intervals[node.intervalIdx]) % 12]}
                    </div>
                );
            })}
            {uniqueNodes.map((node, idx) => {
                const globalScaleIdx = (activeDegree + node.intervalIdx * 2) % 7;
                return (
                    <div
                        key={`node-${node.string}-${node.fret}-${idx}`}
                        className={`${styles.nodeBase} ${styles.nodeTriad} ${getNodeColorClass(node.intervalIdx)}`}
                        style={{ left: `${getColCenter(node.fret)}%`, top: `${getRowCenter(node.string)}%` }}
                    >
                        {labelType === 'intervals' ? SCALES[keyType].scaleLabels[globalScaleIdx] : notesList[(effectiveRoot + FORMULAS[effectiveQuality].intervals[node.intervalIdx]) % 12]}
                    </div>
                );
            })}
            {shapes.length === 0 && (
                <div className={styles.emptyState}>
                    <span className={styles.emptyCard}>No playable closed triads found for these filters.</span>
                </div>
            )}
        </div>
    </div>
);

// --- MAIN COMPONENT ---
export const TriadExplorer = () => {
    const [rootNote, setRootNote] = useState(0);
    const [accidental, setAccidental] = useState<'sharp' | 'flat'>('sharp');
    const [keyType, setKeyType] = useState<ScaleKey>('major');
    const [activeDegree, setActiveDegree] = useState(0);
    const [showFullScale, setShowFullScale] = useState(true);
    const [stringSet, setStringSet] = useState('all');
    const [inversion, setInversion] = useState('all');
    const [labelType, setLabelType] = useState<'intervals' | 'notes'>('intervals');
    const [mobileControlsOpen, setMobileControlsOpen] = useState(false);

    const notesList = accidental === 'sharp' ? SHARPS : FLATS;
    const effectiveRoot = (rootNote + SCALES[keyType].intervals[activeDegree]) % 12;
    const effectiveQuality = SCALES[keyType].chords[activeDegree].quality;

    const scaleNodes = useMemo(() => computeScaleNodes(keyType, rootNote), [keyType, rootNote]);
    const shapes = useMemo(
        () => computeShapes(effectiveRoot, effectiveQuality, stringSet, inversion),
        [effectiveRoot, effectiveQuality, stringSet, inversion]
    );
    const uniqueNodes = useMemo(() => deduplicateNodes(shapes), [shapes]);

    const fretboardProps = {
        scaleNodes, uniqueNodes, shapes, keyType, rootNote, activeDegree,
        effectiveRoot, effectiveQuality, stringSet, showFullScale, labelType, notesList
    };

    return (
        <div className={styles.triadRoot}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.headerTitle}>
                        <Music size={24} color="#6366f1" />
                        Triad Explorer
                    </div>
                </div>
            </header>

            {/* Chord info bar — with Display toggle on the right */}
            <div className={styles.chordInfoBar}>
                <div className={styles.chordInfoName}>
                    <span className={styles.chordInfoDegree}>{SCALES[keyType].chords[activeDegree].degree}</span>
                    <span>
                        {notesList[effectiveRoot]}
                        <span className={styles.chordInfoQuality}>{FORMULAS[effectiveQuality].name.substring(0, 3)}</span>
                    </span>
                </div>
                <div className={styles.chordInfoDivider} />
                <div className={styles.chordInfoSpelling}>
                    {FORMULAS[effectiveQuality].intervals.map((int, i) => (
                        <span key={i} className={styles.spellingChip}>{notesList[(effectiveRoot + int) % 12]}</span>
                    ))}
                </div>
                <div className={styles.chordInfoDivider} />
                <div className={styles.chordInfoIntervals}>
                    {[0, 1, 2].map((intervalIdx) => {
                        const globalScaleIdx = (activeDegree + intervalIdx * 2) % 7;
                        return <span key={intervalIdx} className={styles.intervalChip}>{SCALES[keyType].scaleLabels[globalScaleIdx]}</span>;
                    })}
                </div>
                <div className={styles.chordInfoDivider} />
                <span style={{ fontSize: '0.7rem', color: '#737373', whiteSpace: 'nowrap' }}>
                    {notesList[rootNote]} {SCALES[keyType].name}
                </span>

                {/* Display toggle — prominent position, pushed right */}
                <div className={styles.infoBarDisplayToggle}>
                    <div className={styles.toggleBar}>
                        <button
                            className={`${styles.toggleBtn} ${labelType === 'intervals' ? styles.toggleBtnActive : ''}`}
                            onClick={() => setLabelType('intervals')}
                        >Intervals</button>
                        <button
                            className={`${styles.toggleBtn} ${labelType === 'notes' ? styles.toggleBtnActive : ''}`}
                            onClick={() => setLabelType('notes')}
                        >Notes</button>
                    </div>
                </div>
            </div>

            {/* Fretboard */}
            <FretboardView {...fretboardProps} />

            {/* Mobile inline controls: Key + Chords (always visible on mobile) */}
            <div className={styles.mobileInlineControls}>
                <KeyCenterPanel notesList={notesList} rootNote={rootNote} setRootNote={setRootNote} accidental={accidental} setAccidental={setAccidental} />
                <ChordsPanel
                    notesList={notesList} rootNote={rootNote} keyType={keyType}
                    setKeyType={setKeyType} activeDegree={activeDegree}
                    setActiveDegree={setActiveDegree} showFullScale={showFullScale}
                    setShowFullScale={setShowFullScale}
                />
            </div>

            {/* Desktop: all 4 control panels */}
            <div className={styles.controlsSection}>
                <div className={styles.controlsGrid}>
                    <KeyCenterPanel notesList={notesList} rootNote={rootNote} setRootNote={setRootNote} accidental={accidental} setAccidental={setAccidental} />
                    <ChordsPanel
                        notesList={notesList} rootNote={rootNote} keyType={keyType}
                        setKeyType={setKeyType} activeDegree={activeDegree}
                        setActiveDegree={setActiveDegree} showFullScale={showFullScale}
                        setShowFullScale={setShowFullScale}
                    />
                    <FiltersPanel
                        stringSet={stringSet} setStringSet={setStringSet}
                        inversion={inversion} setInversion={setInversion}
                    />
                </div>
            </div>

            {/* Mobile bottom sheet: filters only */}
            {mobileControlsOpen && (
                <>
                    <div className={styles.mobileOverlay} onClick={() => setMobileControlsOpen(false)} />
                    <div className={styles.mobileSheet}>
                        <div className={styles.mobileSheetGrid}>
                            <div className={styles.mobileSheetRow}>
                                <FiltersPanel
                                    stringSet={stringSet} setStringSet={setStringSet}
                                    inversion={inversion} setInversion={setInversion}
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Mobile FAB */}
            <button
                className={styles.mobileControlsToggle}
                onClick={() => setMobileControlsOpen((v) => !v)}
                aria-label="Toggle filters"
            >
                {mobileControlsOpen ? <X size={22} /> : <SlidersHorizontal size={22} />}
            </button>
        </div>
    );
};

export default TriadExplorer;
