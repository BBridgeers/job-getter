import { Target, Upload, Mic2, Trophy, BarChart3, Clock3, TrendingUp, ExternalLink } from 'lucide-react';
import { useStats } from '../../hooks/useStats';
import { useJobs } from '../../context/JobsContext';

function StatItem({ icon: Icon, label, value, tone = 'sage', onClick, clickable = false }) {
    const tones = {
        sage: 'text-sage-deep bg-sage-mist/60',
        blue: 'text-vintageblue-deep bg-vintageblue-mist/60',
        rust: 'text-rust-deep bg-rust-mist/60',
        gold: 'text-mustard-deep bg-mustard-mist/60',
        olive: 'text-olive bg-olive-mist',
        neutral: 'text-ink-soft bg-bone',
    };

    const baseClasses = 'flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300';
    const clickClasses = clickable ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]' : '';

    return (
        <div
            onClick={onClick}
            className={`${baseClasses} ${clickClasses} ${clickable ? 'bg-linen border-hairline' : 'bg-linen border-hairline'}`}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            onKeyDown={clickable ? (e) => { if (e.key === 'Enter') onClick?.(); } : undefined}
        >
            <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${tones[tone]}`}>
                <Icon size={15} />
            </span>
            <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint flex items-center gap-1">
                    {label}
                    {clickable && <ExternalLink size={9} className="opacity-50" />}
                </div>
                <div className="font-display text-lg font-semibold text-ink leading-tight">{value}</div>
            </div>
        </div>
    );
}

function StatsBar() {
    const stats = useStats();
    const { updateFilter, setView } = useJobs();

    return (
        <div className="max-w-7xl mx-auto px-6 pt-6 pb-2">
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2.5">
                <StatItem
                    icon={Target}
                    label="Active"
                    value={stats.totalActive}
                    tone="sage"
                    clickable
                    onClick={() => { updateFilter('type', 'all'); setView('discovery'); }}
                />
                <StatItem
                    icon={Upload}
                    label="Applied"
                    value={stats.appliedCount}
                    tone="gold"
                    clickable
                    onClick={() => { updateFilter('type', 'all'); window.dispatchEvent(new CustomEvent('filter-status', { detail: 'Applied' })); }}
                />
                <StatItem
                    icon={Mic2}
                    label="Interviews"
                    value={stats.interviewCount}
                    tone="rust"
                    clickable
                    onClick={() => { updateFilter('type', 'all'); window.dispatchEvent(new CustomEvent('filter-status', { detail: 'Interview' })); }}
                />
                <StatItem
                    icon={Trophy}
                    label="Offers"
                    value={stats.offerCount}
                    tone="olive"
                    clickable
                    onClick={() => { updateFilter('type', 'all'); window.dispatchEvent(new CustomEvent('filter-status', { detail: 'Offer' })); }}
                />
                <StatItem
                    icon={BarChart3}
                    label="Response"
                    value={`${stats.responseRate}%`}
                    tone={stats.responseRate > 20 ? 'olive' : 'rust'}
                />
                <StatItem
                    icon={Clock3}
                    label="Avg Days"
                    value={`${stats.avgDaysToResponse}d`}
                    tone="neutral"
                />
                <StatItem
                    icon={TrendingUp}
                    label="This Week"
                    value={`+${stats.weeklyApplications}`}
                    tone="blue"
                />
            </div>
        </div>
    );
}

export default StatsBar;
