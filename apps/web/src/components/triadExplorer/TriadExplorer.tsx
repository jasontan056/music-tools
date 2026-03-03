import { useState, useMemo, useEffect, useCallback } from 'react';
import { Music, SlidersHorizontal, X, HelpCircle } from 'lucide-react';
import styles from './TriadExplorer.module.css';

// Types
import type { ScaleKey } from './types';

// Constants
import { FORMULAS, SCALES, SHARPS, FLATS, NUM_SEMITONES } from './constants';

// Logic
import { computeScaleNodes, computeShapes, deduplicateNodes } from './logic';

// URL State
import { parseHash, updateHash } from './urlState';

// Sub-components
import { FretboardView } from './components/FretboardView';
import { ColorLegend } from './components/ColorLegend';
import { ShortcutHelp } from './components/ShortcutHelp';
import { KeyCenterPanel } from './components/KeyCenterPanel';
import { ChordsPanel } from './components/ChordsPanel';
import { FiltersPanel } from './components/FiltersPanel';

// --- MAIN COMPONENT ---
export const TriadExplorer = () => {
    const initialHash = parseHash();

    const [rootNote, setRootNote] = useState(() => {
        const v = parseInt(initialHash.root || '0', 10);
        return v >= 0 && v < NUM_SEMITONES ? v : 0;
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
    const effectiveRoot = (rootNote + SCALES[keyType].intervals[activeDegree]) % NUM_SEMITONES;
    const formula = FORMULAS[effectiveQuality];

    const scaleNodes = useMemo(() => computeScaleNodes(keyType, rootNote), [keyType, rootNote]);
    const shapes = useMemo(
        () => computeShapes(effectiveRoot, effectiveQuality, stringSet, inversion),
        [effectiveRoot, effectiveQuality, stringSet, inversion]
    );
    const uniqueNodes = useMemo(() => deduplicateNodes(shapes), [shapes]);



    // Keyboard shortcuts — uses functional state setters so the empty deps array is safe
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
            setRootNote((v) => (v - 1 + NUM_SEMITONES) % NUM_SEMITONES);
        } else if (key === 'ArrowRight') {
            e.preventDefault();
            setRootNote((v) => (v + 1) % NUM_SEMITONES);
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

    // Shared panel props (rendered once, visibility controlled by CSS)
    const keyCenterProps = { notesList, rootNote, setRootNote, accidental, setAccidental };
    const chordsProps = {
        notesList, rootNote, keyType, setKeyType,
        activeDegree, setActiveDegree, showFullScale, setShowFullScale
    };
    const filtersProps = { stringSet, setStringSet, inversion, setInversion };

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
                        <span key={i} className={styles.spellingChip}>{notesList[(effectiveRoot + int) % NUM_SEMITONES]}</span>
                    ))}
                </div>
                <div className={styles.chordInfoDivider} />
                <div className={styles.chordInfoIntervals}>
                    {formula.labels.map((label, i) => (
                        <span key={i} className={styles.intervalChip}>{label}</span>
                    ))}
                </div>
                <div className={styles.chordInfoDivider} />
                <span className={styles.chordInfoKeyName}>
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
                <KeyCenterPanel {...keyCenterProps} />
                <ChordsPanel {...chordsProps} />
            </div>

            {/* Desktop controls */}
            <div className={styles.controlsSection}>
                <div className={styles.controlsGrid}>
                    <KeyCenterPanel {...keyCenterProps} />
                    <ChordsPanel {...chordsProps} />
                    <FiltersPanel {...filtersProps} />
                </div>
            </div>

            {/* Mobile bottom sheet */}
            {mobileControlsOpen && (
                <>
                    <div className={styles.mobileOverlay} onClick={() => setMobileControlsOpen(false)} />
                    <div className={styles.mobileSheet}>
                        <div className={styles.mobileSheetGrid}>
                            <div className={styles.mobileSheetRow}>
                                <FiltersPanel {...filtersProps} />
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
