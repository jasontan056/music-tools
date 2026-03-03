import styles from '../TriadExplorer.module.css';
import { LEGEND_ITEMS } from '../constants';

interface ColorLegendProps {
    labelType: 'intervals' | 'notes';
    setLabelType: (val: 'intervals' | 'notes') => void;
}

export const ColorLegend = ({ labelType, setLabelType }: ColorLegendProps) => (
    <div className={styles.legend}>
        <div className={styles.legendLeft}>
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
        <div className={styles.legendRight}>
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
);
