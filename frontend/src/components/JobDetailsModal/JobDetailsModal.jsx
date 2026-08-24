import { useEffect, useState } from 'react';
import { X, Target, FileText, Mail, ExternalLink, ArrowUpRight, Briefcase, LoaderCircle } from 'lucide-react';
import SalaryIntelPanel from '../SalaryIntelPanel/SalaryIntelPanel';
import InterviewPrepModal from '../InterviewPrepModal/InterviewPrepModal';

function JobDetailsModal({ job, onClose }) {
    const [strategy, setStrategy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showInterviewPrep, setShowInterviewPrep] = useState(false);

    useEffect(() => {
        async function fetchStrategy() {
            if (!job.has_strategy) {
                setLoading(false);
                return;
            }
            try {
                const res = await fetch(`/api/get_strategy/${job.id}`);
                const data = await res.json();
                setStrategy(data.strategy);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchStrategy();
    }, [job.id, job.has_strategy]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    if (!job) return null;

    return (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-linen w-full max-w-3xl max-h-[88vh] rounded-2xl border border-hairline shadow-2xl flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-7 py-5 bg-parchment border-b border-hairline flex justify-between items-start gap-4">
                    <div className="min-w-0">
                        <h2 className="font-display text-2xl font-semibold text-ink leading-tight text-balance">
                            {job.title}
                        </h2>
                        <p className="text-sm font-semibold uppercase tracking-wide text-ink-faint mt-1">
                            {job.company}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full border border-hairline-strong text-ink-faint flex items-center justify-center hover:bg-bone hover:text-ink transition-all duration-200 flex-shrink-0"
                    >
                        <X size={17} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-7 space-y-7">
                    {loading ? (
                        <div className="flex items-center justify-center gap-2 py-12 text-sage-deep">
                            <LoaderCircle size={18} className="animate-spin" />
                            <span className="text-sm font-medium">Loading strategy kit…</span>
                        </div>
                    ) : !strategy ? (
                        <div className="text-center py-12">
                            <p className="text-sm text-ink-faint">No strategy kit generated for this role yet.</p>
                            <p className="text-xs text-ink-faint/70 mt-1">The bot generates kits for jobs scoring 85+.</p>
                        </div>
                    ) : (
                        <>
                            {/* Match analysis */}
                            {strategy.precision_match && (
                                <section>
                                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink-faint mb-3">
                                        <Target size={14} /> Match Analysis
                                    </h3>
                                    <div className="well p-5 rounded-xl">
                                        <div className="font-display text-3xl font-semibold text-olive mb-1.5">
                                            {strategy.precision_match.total_score}<span className="text-base text-ink-faint">/100</span>
                                        </div>
                                        <p className="text-sm text-ink-soft leading-relaxed">
                                            {strategy.precision_match.reasoning}
                                        </p>
                                    </div>
                                </section>
                            )}

                            {/* Resume swaps */}
                            {strategy.resume_customization?.swap_instructions?.length > 0 && (
                                <section>
                                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink-faint mb-3">
                                        <FileText size={14} /> Resume Swaps
                                    </h3>
                                    <div className="space-y-2.5">
                                        {strategy.resume_customization.swap_instructions.map((tip, idx) => (
                                            <div key={idx} className="bg-linen border border-hairline rounded-xl p-4 space-y-1.5">
                                                <div className="text-xs text-rust-deep line-through decoration-rust/40">{tip.original}</div>
                                                <div className="text-xs font-semibold text-olive flex items-start gap-1.5">
                                                    <ArrowUpRight size={12} className="mt-0.5 flex-shrink-0" />
                                                    <span>{tip.new}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Cover letter hook */}
                            {strategy.cover_letter?.opening_paragraph && (
                                <section>
                                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink-faint mb-3">
                                        <Mail size={14} /> Cover Letter Hook
                                    </h3>
                                    <blockquote className="well p-5 rounded-xl text-sm italic text-ink-soft leading-relaxed border-l-4 border-clay">
                                        "{strategy.cover_letter.opening_paragraph}"
                                    </blockquote>
                                </section>
                            )}

                            {/* Salary intel */}
                            <SalaryIntelPanel job={job} />

                            {/* Company intel */}
                            <section>
                                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink-faint mb-3">
                                    <Briefcase size={14} /> Company Intel
                                </h3>
                                <div className="well rounded-xl p-5 grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] uppercase tracking-wider text-ink-faint mb-0.5">Type</div>
                                        <div className="text-sm font-semibold text-ink capitalize">{job.search_type}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase tracking-wider text-ink-faint mb-0.5">Match Tier</div>
                                        <div className="text-sm font-semibold text-vintageblue-deep">Tier {job.tier}</div>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-7 py-4 bg-parchment border-t border-hairline flex justify-between items-center gap-3">
                    {(job.display_status === 'Interview' || job.display_status === 'Offer') && (
                        <button
                            onClick={() => setShowInterviewPrep(true)}
                            className="h-10 px-5 rounded-full bg-rust text-linen text-[13px] font-semibold hover:bg-rust-deep transition-colors duration-300"
                        >
                            Interview Prep
                        </button>
                    )}
                    <div className="flex gap-2.5 ml-auto">
                        <a href={job.url} target="_blank" rel="noreferrer"
                           className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full border border-hairline-strong text-ink-soft text-[13px] font-semibold hover:border-vintageblue hover:text-vintageblue-deep transition-all duration-300">
                            Listing <ExternalLink size={13} />
                        </a>
                        <a href={job.url} target="_blank" rel="noreferrer"
                           className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-sage text-linen text-[13px] font-semibold hover:bg-sage-deep shadow-sm transition-all duration-300">
                            Apply Now <ArrowUpRight size={14} />
                        </a>
                    </div>
                </div>
            </div>

            <InterviewPrepModal job={job} isOpen={showInterviewPrep} onClose={() => setShowInterviewPrep(false)} />
        </div>
    );
}

export default JobDetailsModal;
