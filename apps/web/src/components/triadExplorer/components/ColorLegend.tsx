import styles from '../TriadExplorer.module.css';
import { LEGEND_ITEMS } from '../constants';

export const ColorLegend = () => (
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
