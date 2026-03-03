import { Hash } from 'lucide-react';
import styles from '../TriadExplorer.module.css';

interface KeyCenterPanelProps {
    notesList: string[];
    rootNote: number;
    setRootNote: (v: number) => void;
    accidental: 'sharp' | 'flat';
    setAccidental: (fn: (a: 'sharp' | 'flat') => 'sharp' | 'flat') => void;
}

export const KeyCenterPanel = ({
    notesList, rootNote, setRootNote, accidental, setAccidental
}: KeyCenterPanelProps) => (
    <div className={styles.panel}>
        <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Key Center</span>
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
