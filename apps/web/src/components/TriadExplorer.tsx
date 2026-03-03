import { useState, useMemo, useEffect, useCallback } from 'react';
import { Music, Hash, SlidersHorizontal, X, HelpCircle } from 'lucide-react';
import styles from './TriadExplorer.module.css';

// --- CONSTANTS & MUSICAL DATA ---
const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const FORMULAS = {
    major: { name: 'Major', abbr: 'Maj', intervals: [0, 4, 7], labels: ['R', '3', '5'] },
    minor: { name: 'Minor', abbr: 'Min', intervals: [0, 3, 7], labels: ['R', 'b3', '5'] },
    diminished: { name: 'Diminished', abbr: 'Dim', intervals: [0, 3, 6], labels: ['R', 'b3', 'b5'] },
    augmented: { name: 'Augmented', abbr: 'Aug', intervals: [0, 4, 8], labels: ['R', '3', '#5'] }
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
                        if (activeFrets.length === 0 || Math.max(...activeFrets) <= 4) isValid = true;
                    } else {
                        const span = Math.max(...frets) - Math.min(...frets);
                        if (span <= 4) isValid = true;
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
                for (let f = 0; f <= 15; f++) {
                    if ((TUNING[str] + f) % 12 === wantedNote) {
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

// --- URL HASH STATE ---
const parseHash = (): Record<string, string> => {
    const hash = window.location.hash.slice(1);
    if (!hash) return {};
    const params = new URLSearchParams(hash);
    const result: Record<string, string> = {};
    params.forEach((v, k) => { result[k] = v; });
    return result;
};

const updateHash = (state: Record<string, string>) => {
    const params = new URLSearchParams(state);
    const hash = params.toString();
    window.history.replaceState(null, '', hash ? `#${hash}` : window.location.pathname);
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

const LEGEND_ITEMS = [
    { label: 'Root', cls: 'nodeRoot' },
    { label: '3rd', cls: 'nodeThird' },
    { label: '5th', cls: 'nodeFifth' }
];

const INLAY_FRETS = [3, 5, 7, 9, 15];

const SHORTCUTS = [
    { keys: '1 – 7', desc: 'Select chord degree' },
    { keys: '8', desc: 'Toggle scale overlay' },
    { keys: '← →', desc: 'Cycle root note' },
    { keys: '↑ ↓', desc: 'Toggle Major / Minor' },
    { keys: 'N', desc: 'Toggle Notes / Intervals' },
    { keys: '?', desc: 'Show / hide shortcuts' }
];

// --- COLOR LEGEND ---
const ColorLegend = () => (
    <div className={styles.legend}>
        {LEGEND_ITEMS.map((item) => (
            <div key={item.cls} className={styles.legendItem}>
                <div className={`${styles.legendDot} ${styles[item.cls]}`} />
                <span>{item.label}</span>
            </div>
        ))}
        <div className={styles.legendItem}>
            <div className={`${styles.legendDot} ${styles.nodeScale}`} />
            <span>Scale</span>
        </div>
    </div>
);

// --- SHORTCUTS OVERLAY ---
const ShortcutHelp = ({ onClose }: { onClose: () => void }) => (
    <div className={styles.shortcutOverlay} onClick={onClose}>
        <div className={styles.shortcutCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.shortcutHeader}>
                <span>Keyboard Shortcuts</span>
                <button className={styles.shortcutClose} onClick={onClose}><X size={16} /></button>
            </div>
            {SHORTCUTS.map((s) => (
                <div key={s.keys} className={styles.shortcutRow}>
                    <kbd className={styles.kbd}>{s.keys}</kbd>
                    <span>{s.desc}</span>
                </div>
            ))}
        </div>
    </div>
);

// --- KEY CENTER PANEL ---
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
                            {notesList[chordRoot]}{FORMULAS[chord.quality].abbr}
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
}) => {
    const invDisabled = stringSet === 'all';

    return (
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
                {invDisabled && (
                    <div className={styles.filterHelper}>Select a string set to filter inversions</div>
                )}
                <div className={styles.filterStack}>
                    {INVERSIONS.map((inv) => (
                        <button
                            key={inv.id}
                            onClick={() => !invDisabled && setInversion(inv.id)}
                            disabled={invDisabled && inv.id !== 'all'}
                            className={`${styles.filterBtn} ${inversion === inv.id ? styles.filterBtnActive : ''} ${invDisabled && inv.id !== 'all' ? styles.filterBtnDisabled : ''}`}
                        >{inv.label}</button>
                    ))}
                </div>
            </div>
        </>
    );
};

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
}) => {
    const formula = FORMULAS[effectiveQuality];

    return (
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
                    const isChordTone = uniqueNodes.some((n) => n.string === node.string && n.fret === node.fret);
                    if (!showFullScale) {
                        return (
                            <div
                                key={`scale-dot-${node.string}-${node.fret}`}
                                className={`${styles.scaleDot} ${node.isKeyRoot ? styles.scaleDotRoot : styles.scaleDotNormal}`}
                                style={{ left: `${getColCenter(node.fret)}%`, top: `${getRowCenter(node.string)}%`, opacity: isActiveStringSet ? 0.6 : 0.15 }}
                            />
                        );
                    }
                    if (isChordTone) return null;
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
                    const scaleIntervalSemitones = formula.intervals[node.intervalIdx];
                    const scaleIdx = (SCALES[keyType].intervals as readonly number[]).indexOf(
                        (SCALES[keyType].intervals[activeDegree] + scaleIntervalSemitones) % 12
                    );
                    const scaleLabel = scaleIdx !== -1 ? SCALES[keyType].scaleLabels[scaleIdx] : formula.labels[node.intervalIdx];

                    return (
                        <div
                            key={`node-${node.string}-${node.fret}-${idx}`}
                            className={`${styles.nodeBase} ${styles.nodeTriad} ${getNodeColorClass(node.intervalIdx)}`}
                            style={{ left: `${getColCenter(node.fret)}%`, top: `${getRowCenter(node.string)}%` }}
                        >
                            {labelType === 'intervals' ? scaleLabel : notesList[(effectiveRoot + formula.intervals[node.intervalIdx]) % 12]}
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
};

// --- MAIN COMPONENT ---
export const TriadExplorer = () => {
    const initialHash = parseHash();

    const [rootNote, setRootNote] = useState(() => {
        const v = parseInt(initialHash.root || '0', 10);
        return v >= 0 && v < 12 ? v : 0;
    });
    const [accidental, setAccidental] = useState<'sharp' | 'flat'>(() =>
        initialHash.acc === 'flat' ? 'flat' : 'sharp'
    );
    const [keyType, setKeyType] = useState<ScaleKey>(() =>
        initialHash.key === 'minor' ? 'minor' : 'major'
    );
    const [activeDegree, setActiveDegree] = useState(() => {
        const v = parseInt(initialHash.deg || '0', 10);
        return v >= 0 && v < 7 ? v : 0;
    });
    const [showFullScale, setShowFullScale] = useState(() =>
        initialHash.scale !== '0'
    );
    const [stringSet, setStringSet] = useState(() => initialHash.set || 'all');
    const [inversion, setInversion] = useState(() => initialHash.inv || 'all');
    const [labelType, setLabelType] = useState<'intervals' | 'notes'>(() =>
        initialHash.label === 'notes' ? 'notes' : 'intervals'
    );
    const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);

    // When string set is 'all', force inversion to 'all'
    useEffect(() => {
        if (stringSet === 'all' && inversion !== 'all') {
            setInversion('all');
        }
    }, [stringSet, inversion]);

    // URL hash sync
    useEffect(() => {
        updateHash({
            root: String(rootNote),
            key: keyType,
            deg: String(activeDegree),
            set: stringSet,
            inv: inversion,
            label: labelType,
            acc: accidental,
            scale: showFullScale ? '1' : '0'
        });
    }, [rootNote, keyType, activeDegree, stringSet, inversion, labelType, accidental, showFullScale]);

    const notesList = accidental === 'sharp' ? SHARPS : FLATS;
    const effectiveQuality = SCALES[keyType].chords[activeDegree].quality;
    const effectiveRoot = (rootNote + SCALES[keyType].intervals[activeDegree]) % 12;
    const formula = FORMULAS[effectiveQuality];

    const scaleNodes = useMemo(() => computeScaleNodes(keyType, rootNote), [keyType, rootNote]);
    const shapes = useMemo(
        () => computeShapes(effectiveRoot, effectiveQuality, stringSet, inversion),
        [effectiveRoot, effectiveQuality, stringSet, inversion]
    );
    const uniqueNodes = useMemo(() => deduplicateNodes(shapes), [shapes]);

    // Keyboard shortcuts
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        const key = e.key;
        if (key >= '1' && key <= '7') {
            e.preventDefault();
            setActiveDegree(parseInt(key, 10) - 1);
        } else if (key === '8') {
            e.preventDefault();
            setShowFullScale((v) => !v);
        } else if (key === 'ArrowLeft') {
            e.preventDefault();
            setRootNote((v) => (v - 1 + 12) % 12);
        } else if (key === 'ArrowRight') {
            e.preventDefault();
            setRootNote((v) => (v + 1) % 12);
        } else if (key === 'ArrowUp' || key === 'ArrowDown') {
            e.preventDefault();
            setKeyType((k) => (k === 'major' ? 'minor' : 'major'));
            setActiveDegree(0);
        } else if (key === 'n' || key === 'N') {
            e.preventDefault();
            setLabelType((v) => (v === 'intervals' ? 'notes' : 'intervals'));
        } else if (key === '?') {
            e.preventDefault();
            setShowShortcuts((v) => !v);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

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
                <button
                    className={styles.helpBtn}
                    onClick={() => setShowShortcuts((v) => !v)}
                    aria-label="Keyboard shortcuts"
                >
                    <HelpCircle size={18} />
                </button>
            </header>

            {/* Chord info bar */}
            <div className={styles.chordInfoBar}>
                <div className={styles.chordInfoName}>
                    <span className={styles.chordInfoDegree}>{SCALES[keyType].chords[activeDegree].degree}</span>
                    <span>
                        {notesList[effectiveRoot]}
                        <span className={styles.chordInfoQuality}>{formula.abbr}</span>
                    </span>
                </div>
                <div className={styles.chordInfoDivider} />
                <div className={styles.chordInfoSpelling}>
                    {formula.intervals.map((int, i) => (
                        <span key={i} className={styles.spellingChip}>{notesList[(effectiveRoot + int) % 12]}</span>
                    ))}
                </div>
                <div className={styles.chordInfoDivider} />
                <div className={styles.chordInfoIntervals}>
                    {formula.labels.map((label, i) => (
                        <span key={i} className={styles.intervalChip}>{label}</span>
                    ))}
                </div>
                <div className={styles.chordInfoDivider} />
                <span style={{ fontSize: '0.7rem', color: '#737373', whiteSpace: 'nowrap' }}>
                    {notesList[rootNote]} {SCALES[keyType].name}
                </span>
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

            {/* Color Legend */}
            <ColorLegend />

            {/* Mobile inline controls */}
            <div className={styles.mobileInlineControls}>
                <KeyCenterPanel notesList={notesList} rootNote={rootNote} setRootNote={setRootNote} accidental={accidental} setAccidental={setAccidental} />
                <ChordsPanel
                    notesList={notesList} rootNote={rootNote} keyType={keyType}
                    setKeyType={setKeyType} activeDegree={activeDegree}
                    setActiveDegree={setActiveDegree} showFullScale={showFullScale}
                    setShowFullScale={setShowFullScale}
                />
            </div>

            {/* Desktop controls */}
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

            {/* Mobile bottom sheet */}
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

            {/* Shortcuts overlay */}
            {showShortcuts && <ShortcutHelp onClose={() => setShowShortcuts(false)} />}
        </div>
    );
};

export default TriadExplorer;
