import { useState } from 'react';
import { MapPin, DollarSign, ExternalLink, ArrowUpRight, ChevronDown, ChevronRight, StickyNote } from 'lucide-react';
import { useJobs } from '../../context/JobsContext';
import JobDetailsModal from '../JobDetailsModal/JobDetailsModal';

/* Score arc — thin mustard ring, number set in Fraunces */
function ScoreArc({ score }) {
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - score / 100);
    const color =
        score >= 85 ? 'var(--color-olive)' :
        score >= 70 ? 'var(--color-mustard)' : 'var(--color-clay)';

    return (
        <div className="relative w-[62px] h-[62px] flex-shrink-0" title={`Match score: ${score}/100`}>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r={radius} fill="none" stroke="var(--color-bone)" strokeWidth="4" />
                <circle
                    cx="30" cy="30" r={radius} fill="none"
                    stroke={color} strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1.1s var(--ease-expo-out)' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-lg font-semibold text-ink leading-none">{score}</span>
            </div>
        </div>
    );
}

const STATUS_STYLES = {
    New:         'bg-vintageblue-mist text-vintageblue-deep border-vintageblue-mist',
    Interested:  'bg-clay-mist text-rust-deep border-clay-mist',
    Applied:     'bg-mustard-mist text-mustard-deep border-mustard-mist',
    Interview:   'bg-rust-mist text-rust-deep border-rust-mist',
    Offer:       'bg-olive-mist text-olive border-olive-mist',
    Rejected:    'bg-bone text-ink-faint border-bone',
};

const TIER_STYLES = {
    1: 'text-sage-deep border-sage/40 bg-sage-mist/50',
    2: 'text-vintageblue-deep border-vintageblue/40 bg-vintageblue-mist/50',
};

function JobCard({ job, index = 0 }) {
    const [showNotes, setShowNotes] = useState(false);
    const [notes, setNotes] = useState(job.notes || '');
    const [showModal, setShowModal] = useState(false);
    const [status, setStatus] = useState(job.display_status || 'New');

    const handleSaveNotes = async () => {
        if (notes === (job.notes || '')) return;
        try {
            await fetch('/api/update_notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ job_id: job.id, notes })
            });
        } catch (err) {
            console.error('Failed to save notes', err);
        }
    };

    const handleStatusChange = async (newStatus) => {
        setStatus(newStatus);
        try {
            await fetch('/api/update_status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ job_id: job.id, status: newStatus })
            });
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    return (
        <>
            <article
                className="paper-card p-6 flex flex-col rise-in"
                style={{ animationDelay: `${Math.min(index * 55, 550)}ms` }}
            >
                {/* Top row: badges + score */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex flex-wrap gap-1.5">
                        {job.tier && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${TIER_STYLES[job.tier] || TIER_STYLES[2]}`}>
                                Tier {job.tier}
                            </span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                            job.search_type === 'nonprofit'
                                ? 'text-clay border-clay/35 bg-clay-mist/60'
                                : 'text-vintageblue-deep border-vintageblue/25 bg-vintageblue-mist/40'
                        }`}>
                            {job.search_type === 'nonprofit' ? 'Nonprofit' : 'Corporate'}
                        </span>
                    </div>
                    <ScoreArc score={job.match_score || 0} />
                </div>

                {/* Title block */}
                <h3 className="font-display text-xl font-semibold text-ink leading-snug text-balance mb-1">
                    {job.title}
                </h3>
                <p className="text-sm font-semibold tracking-wide uppercase text-ink-faint mb-4">
                    {job.company}
                </p>

                {/* Metadata */}
                <div className="flex flex-col gap-1.5 pb-4 mb-4 border-b border-hairline mt-auto">
                    <div className="flex items-center gap-2 text-[13px] text-ink-soft">
                        <MapPin size={13} className="flex-shrink-0 text-ink-faint" />
                        <span className="truncate">{job.location || 'Remote'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-ink-soft">
                        <DollarSign size={13} className="flex-shrink-0 text-ink-faint" />
                        <span className="truncate">{job.salary_text || 'Market rate'}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <a href={job.url} target="_blank" rel="noreferrer"
                       className="inline-flex items-center justify-center gap-1.5 h-10 rounded-lg border border-hairline-strong
                                  text-[13px] font-semibold text-ink-soft hover:border-sage hover:text-sage-deep hover:bg-sage-mist/40
                                  transition-all duration-300">
                        Listing <ExternalLink size={13} />
                    </a>
                    <a href={job.url} target="_blank" rel="noreferrer"
                       className="inline-flex items-center justify-center gap-1.5 h-10 rounded-lg bg-sage text-linen
                                  text-[13px] font-semibold hover:bg-sage-deep active:scale-[0.98]
                                  shadow-sm hover:shadow-md transition-all duration-300">
                        Apply <ArrowUpRight size={14} />
                    </a>
                </div>

                {/* Status select */}
                <select
                    id={`app-status-${job.id}`}
                    name={`app-status-${job.id}`}
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className={`w-full h-10 px-3 rounded-lg border text-[13px] font-semibold cursor-pointer
                                focus:outline-none focus:ring-2 focus:ring-sage/40 focus:border-sage
                                transition-all duration-300 appearance-none text-center
                                ${STATUS_STYLES[status] || STATUS_STYLES.New}`}
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 10px center',
                    }}
                >
                    <option value="New">New</option>
                    <option value="Interested">Interested</option>
                    <option value="Applied">Applied</option>
                    <option value="Interview">Interview</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                </select>

                {/* Notes drawer */}
                <div className="mt-3 pt-3 border-t border-hairline">
                    <button
                        onClick={() => setShowNotes(!showNotes)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint hover:text-sage-deep transition-colors duration-300"
                    >
                        {showNotes ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        <StickyNote size={12} />
                        Notes
                    </button>
                    {showNotes && (
                        <textarea
                            id={`job-notes-${job.id}`}
                            name={`job-notes-${job.id}`}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            onBlur={handleSaveNotes}
                            placeholder="Private notes on this role…"
                            className="mt-2 w-full h-20 p-3 rounded-lg well border border-transparent text-sm text-ink
                                       placeholder:text-ink-faint focus:outline-none focus:border-sage focus:bg-linen
                                       resize-none transition-all duration-300"
                        />
                    )}
                </div>
            </article>

            {showModal && <JobDetailsModal job={job} onClose={() => setShowModal(false)} />}
        </>
    );
}

export default JobCard;
