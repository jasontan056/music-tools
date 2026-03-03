import styles from '../TriadExplorer.module.css';
import type { ScaleNode, ShapeNode, Shape, ScaleKey, FormulaKey } from '../types';
import {
    FORMULAS, SCALES, INLAY_FRETS, DOUBLE_INLAY_FRET,
    NUM_STRINGS, MAX_FRET, NUM_SEMITONES, stringSetMap
} from '../constants';
import { buildNodeSet } from '../logic';

// --- Rendering Helpers ---
const getColCenter = (fret: number) => (fret === 0 ? 2 : 4 + (fret - 1) * 6.4 + 3.2);
const getRowCenter = (stringIdx: number) => 10 + (NUM_STRINGS - 1 - stringIdx) * 16;

const getNodeColorClass = (intervalIdx: number) => {
    if (intervalIdx === 0) return styles.nodeRoot;
    if (intervalIdx === 1) return styles.nodeThird;
    if (intervalIdx === 2) return styles.nodeFifth;
    return '';
};

/** Safely check if a string index is active for the current string set. */
const isStringActive = (stringSet: string, stringIdx: number): boolean => {
    if (stringSet === 'all') return true;
    const strings = stringSetMap.get(stringSet);
    return strings ? strings.includes(stringIdx) : true;
};

interface FretboardViewProps {
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
}

export const FretboardView = ({
    scaleNodes, uniqueNodes, shapes, keyType, rootNote, activeDegree,
    effectiveRoot, effectiveQuality, stringSet, showFullScale, labelType, notesList
}: FretboardViewProps) => {
    const formula = FORMULAS[effectiveQuality];

    // O(1) chord tone lookup set (for current voicing)
    const voicingSet = buildNodeSet(uniqueNodes);

    return (
        <div className={styles.fretboardWrapper}>
            <div className={styles.fretboard}>
                <div className={styles.fretNut} />
                {[...Array(MAX_FRET)].map((_, i) => (
                    <div key={i + 1} className={styles.fretColumn} style={{ left: `${4 + i * 6.4}%` }}>
                        {INLAY_FRETS.includes(i + 1) && <div className={styles.inlayDot} />}
                        {i + 1 === DOUBLE_INLAY_FRET && (
                            <div className={styles.doubleInlay}>
                                <div className={styles.inlayDot} />
                                <div className={styles.inlayDot} />
                            </div>
                        )}
                    </div>
                ))}
                {[...Array(NUM_STRINGS)].map((_, i) => (
                    <div
                        key={i}
                        className={styles.string}
                        style={{
                            top: `${getRowCenter(i)}%`,
                            height: `${1 + i * 0.5}px`,
                            transform: 'translateY(-50%)',
                            opacity: isStringActive(stringSet, i) ? 1 : 0.2
                        }}
                    />
                ))}
                <div className={styles.fretNumbers}>
                    <div className={styles.fretNumNut}>0</div>
                    {[...Array(MAX_FRET)].map((_, i) => (
                        <div key={i + 1} className={styles.fretNum}>{i + 1}</div>
                    ))}
                </div>
                {scaleNodes.map((node) => {
                    const active = isStringActive(stringSet, node.string);
                    const isVoicingNode = voicingSet.has(`${node.string}-${node.fret}`);

                    if (isVoicingNode) return null;

                    if (!showFullScale) {
                        return (
                            <div
                                key={`scale-dot-${node.string}-${node.fret}`}
                                className={`${styles.scaleDot} ${node.isKeyRoot ? styles.scaleDotRoot : styles.scaleDotNormal}`}
                                style={{ left: `${getColCenter(node.fret)}%`, top: `${getRowCenter(node.string)}%`, opacity: active ? 0.6 : 0.15 }}
                            />
                        );
                    }
                    return (
                        <div
                            key={`scale-full-${node.string}-${node.fret}`}
                            className={`${styles.nodeBase} ${styles.nodeScale}`}
                            style={{ left: `${getColCenter(node.fret)}%`, top: `${getRowCenter(node.string)}%`, opacity: active ? 0.8 : 0.2 }}
                        >
                            {labelType === 'intervals' ? SCALES[keyType].scaleLabels[node.intervalIdx] : notesList[(rootNote + SCALES[keyType].intervals[node.intervalIdx]) % NUM_SEMITONES]}
                        </div>
                    );
                })}

                {uniqueNodes.map((node, idx) => {
                    const scaleIntervalSemitones = formula.intervals[node.intervalIdx];
                    const scaleIdx = (SCALES[keyType].intervals as readonly number[]).indexOf(
                        (SCALES[keyType].intervals[activeDegree] + scaleIntervalSemitones) % NUM_SEMITONES
                    );
                    const scaleLabel = scaleIdx !== -1 ? SCALES[keyType].scaleLabels[scaleIdx] : formula.labels[node.intervalIdx];

                    return (
                        <div
                            key={`node-${node.string}-${node.fret}-${idx}`}
                            className={`${styles.nodeBase} ${styles.nodeTriad} ${getNodeColorClass(node.intervalIdx)}`}
                            style={{ left: `${getColCenter(node.fret)}%`, top: `${getRowCenter(node.string)}%` }}
                        >
                            {labelType === 'intervals' ? scaleLabel : notesList[(effectiveRoot + formula.intervals[node.intervalIdx]) % NUM_SEMITONES]}
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
