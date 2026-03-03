import { X } from 'lucide-react';
import styles from '../TriadExplorer.module.css';
import { SHORTCUTS } from '../constants';

export const ShortcutHelp = ({ onClose }: { onClose: () => void }) => (
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
