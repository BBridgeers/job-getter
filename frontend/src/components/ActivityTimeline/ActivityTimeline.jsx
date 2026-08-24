import { Clock, Send, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { useJobs } from '../../context/JobsContext';

const EVENT_ICONS = {
    added:   { icon: Sparkles,      tone: 'text-vintageblue-deep bg-vintageblue-mist' },
    applied: { icon: Send,          tone: 'text-mustard-deep bg-mustard-mist' },
};

function ActivityTimeline() {
    const { allJobs } = useJobs();

    const st = (j) => j.display_status || 'New';

    const events = allJobs
        .flatMap(job => {
            const list = [{
                id: `${job.id}-added`,
                type: 'added',
                date: new Date(job.date_added || Date.now()),
                title: 'New target acquired',
                description: `${job.title} — ${job.company}`,
                ...EVENT_ICONS.added,
            }];
            if (['Applied', 'Interview', 'Offer'].includes(st(job))) {
                list.push({
                    id: `${job.id}-applied`,
                    type: 'applied',
                    date: job.applied_date ? new Date(job.applied_date) : new Date(),
                    title: 'Application submitted',
                    description: job.company,
                    ...EVENT_ICONS.applied,
                });
            }
            return list;
        })
        .sort((a, b) => b.date - a.date)
        .slice(0, 8);

    return (
        <div className="paper-card p-5 h-full flex flex-col">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink-faint mb-4">
                <Clock size={14} /> Recent Activity
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {events.map(e => {
                    const Icon = e.icon;
                    const when = e.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    return (
                        <div key={e.id} className="flex items-start gap-3">
                            <span className={`flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 ${e.tone}`}>
                                <Icon size={13} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="text-[12px] font-semibold text-ink leading-tight">{e.title}</div>
                                <div className="text-[11px] text-ink-faint truncate">{e.description}</div>
                            </div>
                            <span className="text-[10px] text-ink-faint flex-shrink-0 pt-0.5">{when}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ActivityTimeline;
