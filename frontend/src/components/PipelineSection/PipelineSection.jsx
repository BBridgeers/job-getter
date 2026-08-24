import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, ArrowUpRight, GripVertical } from 'lucide-react';
import { useJobs } from '../../context/JobsContext';

const STAGE_TONES = {
    New:        'text-vintageblue-deep bg-vintageblue-mist',
    Interested: 'bg-clay-mist text-clay',
    Applied:    'bg-mustard-mist text-mustard-deep',
    Interview:  'bg-rust-mist text-rust-deep',
    Offer:      'bg-olive-mist text-olive',
    Rejected:   'bg-bone text-ink-faint',
};

function JobRow({ job }) {
    const [showActions, setShowActions] = useState(false);

    const handleDragStart = (e) => {
        e.dataTransfer.setData('jobId', String(job.id));
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            className="group flex items-center gap-3 px-3 py-2.5 bg-linen border-b border-hairline
                       hover:bg-parchment/70 transition-colors duration-200 cursor-grab active:cursor-grabbing"
        >
            <GripVertical size={14} className="text-ink-faint/50 flex-shrink-0" />

            {/* Score */}
            <span className={`font-display text-sm font-semibold w-8 text-right flex-shrink-0 ${
                (job.match_score || 0) >= 85 ? 'text-olive' : 'text-clay'
            }`}>
                {job.match_score}
            </span>

            {/* Title + company */}
            <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-ink truncate">{job.title}</div>
                <div className="text-[11px] uppercase tracking-wide text-ink-faint truncate">{job.company}</div>
            </div>

            {/* Hover actions */}
            <div className={`flex items-center gap-1 flex-shrink-0 transition-opacity duration-200 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
                <a href={job.url} target="_blank" rel="noreferrer"
                   title="View listing"
                   className="p-1.5 rounded-md hover:bg-vintageblue-mist text-vintageblue-deep transition-colors duration-200">
                    <ExternalLink size={13} />
                </a>
                <a href={job.url} target="_blank" rel="noreferrer"
                   title="Apply now"
                   className="p-1.5 rounded-md hover:bg-sage-mist text-sage-deep transition-colors duration-200">
                    <ArrowUpRight size={13} />
                </a>
            </div>
        </div>
    );
}

function PipelineStage({ title, status, jobs, count }) {
    const [isExpanded, setIsExpanded] = useState(count > 0);
    const [isDragOver, setIsDragOver] = useState(false);
    const { refreshJobs } = useJobs();

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const jobId = e.dataTransfer.getData('jobId');
        if (!jobId) return;
        try {
            await fetch('/api/update_status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ job_id: Number(jobId), status })
            });
            refreshJobs();
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    return (
        <div className="mb-3">
            {/* Stage header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-t-xl transition-colors duration-200 ${
                    isExpanded ? 'bg-parchment' : 'bg-parchment/60 hover:bg-parchment'
                }`}
            >
                <span className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown size={15} className="text-ink-faint" /> : <ChevronRight size={15} className="text-ink-faint" />}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${STAGE_TONES[status]}`}>
                        {title}
                    </span>
                </span>
                <span className="font-display text-sm font-semibold text-ink-soft">{count}</span>
            </button>

            {/* Stage body / drop zone */}
            {isExpanded && (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={() => setIsDragOver(false)}
                    className={`rounded-b-xl overflow-hidden border-x border-b transition-all duration-200 ${
                        isDragOver
                            ? 'border-sage bg-sage-mist/40 border-dashed'
                            : 'border-hairline bg-linen/50'
                    }`}
                >
                    {jobs.length === 0 ? (
                        <div className="p-5 text-center text-xs text-ink-faint italic">
                            {isDragOver ? 'Release to move here' : 'Drop jobs here'}
                        </div>
                    ) : (
                        jobs.map(job => <JobRow key={job.id} job={job} />)
                    )}
                </div>
            )}
        </div>
    );
}

function PipelineSection() {
    const { allJobs } = useJobs();

    const stages = [
        { id: 'New', label: 'New' },
        { id: 'Interested', label: 'Interested' },
        { id: 'Applied', label: 'Applied' },
        { id: 'Interview', label: 'Interview' },
        { id: 'Offer', label: 'Offer' },
        { id: 'Rejected', label: 'Rejected' },
    ];

    return (
        <div className="max-w-3xl mx-auto">
            {stages.map(stage => {
                const stageJobs = allJobs.filter(j => (j.display_status || 'New') === stage.id);
                return (
                    <PipelineStage
                        key={stage.id}
                        title={stage.label}
                        status={stage.id}
                        jobs={stageJobs}
                        count={stageJobs.length}
                    />
                );
            })}
        </div>
    );
}

export default PipelineSection;
