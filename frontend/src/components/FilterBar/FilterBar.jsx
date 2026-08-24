import { LayoutGrid, KanbanSquare } from 'lucide-react';
import { useJobs } from '../../context/JobsContext';

const FILTER_DEFS = [
    { id: 'all', label: 'All Targets' },
    { id: 'tier1', label: 'Tier 1' },
    { id: 'tier2', label: 'Tier 2' },
    { id: 'high-match', label: 'Strong Matches' },
    { id: 'corporate', label: 'Corporate' },
    { id: 'nonprofit', label: 'Nonprofit' },
];

function FilterBar() {
    const { filters, updateFilter, allJobs, view, setView } = useJobs();

    const getCount = (type) => {
        if (type === 'all') return allJobs.length;
        if (type === 'tier1') return allJobs.filter(j => j.tier === 1).length;
        if (type === 'tier2') return allJobs.filter(j => j.tier === 2).length;
        if (type === 'high-match') return allJobs.filter(j => j.match_score >= 85).length;
        if (type === 'corporate') return allJobs.filter(j => j.search_type === 'corporate').length;
        if (type === 'nonprofit') return allJobs.filter(j => j.search_type === 'nonprofit').length;
        return 0;
    };

    return (
        <div className="sticky top-0 z-40 bg-alabaster/90 backdrop-blur-md border-b border-hairline">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 flex-wrap">
                    <LayoutGrid size={15} className="text-ink-faint mr-1" />
                    {FILTER_DEFS.map(f => {
                        const isActive = filters.type === f.id;
                        const count = getCount(f.id);
                        return (
                            <div
                                key={f.id}
                                data-filter={f.id}
                                data-active={isActive}
                                onClick={() => {
                                    updateFilter('type', f.id);
                                    setView('discovery');
                                }}
                                style={{ cursor: 'pointer' }}
                                className={`inline-flex items-center h-9 px-4 rounded-full text-[13px] font-semibold transition-all duration-300 select-none ${
                                    isActive
                                        ? 'bg-[#2D2A24] text-[#F3EFE7] shadow-sm'
                                        : 'text-[#55503F] hover:bg-[#EDE8DD] hover:text-[#2D2A24]'
                                }`}
                            >
                                {f.label}
                                <span
                                    className={`ml-1.5 text-xs ${isActive ? 'text-[#F3EFE7]/60' : 'text-[#8A8471]'}`}
                                    style={{ pointerEvents: 'none' }}
                                >
                                    {count}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div className="ml-auto">
                    <div
                        onClick={() => setView(view === 'pipeline' ? 'discovery' : 'pipeline')}
                        style={{ cursor: 'pointer' }}
                        className={`inline-flex items-center gap-2 h-9 px-4 rounded-full text-[13px] font-semibold border transition-all duration-300 select-none ${
                            view === 'pipeline'
                                ? 'bg-[#5C6B54] text-[#FCFAF5] border-[#5C6B54] shadow-sm'
                                : 'bg-[#FCFAF5] text-[#5C6B54] border-[#CCC3B0] hover:border-[#75836B] hover:bg-[#DCE3D4]/40'
                        }`}
                    >
                        <KanbanSquare size={15} />
                        Pipeline Tracker
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FilterBar;
