import styles from '../TriadExplorer.module.css';
import { FORMULAS, SCALES } from '../constants';
import type { ScaleKey } from '../types';
import { NUM_SEMITONES } from '../constants';

interface ChordsPanelProps {
    notesList: string[];
    rootNote: number;
    keyType: ScaleKey;
    setKeyType: (v: ScaleKey) => void;
    activeDegree: number;
    setActiveDegree: (v: number) => void;
}

export const ChordsPanel = ({
    notesList, rootNote, keyType, setKeyType, activeDegree, setActiveDegree,
}: ChordsPanelProps) => (
    <div className={styles.panel}>
        <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Chords & Scale</span>
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
                const chordRoot = (rootNote + SCALES[keyType].intervals[idx]) % NUM_SEMITONES;
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
        </div>
    </div>
);
