import { Filter } from 'lucide-react';
import { useStats } from '../../hooks/useStats';

const STAGE_COLORS = {
    New:        'var(--color-vintageblue)',
    Interested: 'var(--color-clay)',
    Applied:    'var(--color-mustard)',
    Interview:  'var(--color-rust)',
    Offer:      'var(--color-olive)',
};

function FunnelChart() {
    const { funnelData } = useStats();
    const top = funnelData[0]?.count || 1;

    return (
        <div className="paper-card p-5 h-full">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink-faint mb-5">
                <Filter size={14} /> Conversion Funnel
            </h3>

            <div className="space-y-3.5">
                {funnelData.map((item) => {
                    const width = Math.max(item.count > 0 ? (item.count / top) * 100 : 3, 3);
                    const color = STAGE_COLORS[item.stage] || 'var(--color-ink-faint)';

                    return (
                        <div key={item.stage}>
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-[12px] font-semibold text-ink">{item.stage}</span>
                                <span className="font-display text-sm font-semibold" style={{ color }}>
                                    {item.count}
                                </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-bone overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${width}%`,
                                        background: color,
                                        transitionTimingFunction: 'var(--ease-expo-out)',
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default FunnelChart;
