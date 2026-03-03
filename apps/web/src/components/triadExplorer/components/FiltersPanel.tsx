import styles from '../TriadExplorer.module.css';
import { STRING_SETS, INVERSIONS } from '../constants';

interface FiltersPanelProps {
    stringSet: string;
    setStringSet: (v: string) => void;
    inversion: string;
    setInversion: (v: string) => void;
}

export const FiltersPanel = ({
    stringSet, setStringSet, inversion, setInversion
}: FiltersPanelProps) => {
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
