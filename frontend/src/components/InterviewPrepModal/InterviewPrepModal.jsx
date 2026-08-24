import React, { useState, useEffect } from 'react';
import { X, Target, FileText, Lightbulb, Building, Loader2 } from 'lucide-react';
import Button from '../common/Button';

function InterviewPrepModal({ job, isOpen, onClose }) {
    const [prepData, setPrepData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedQuestion, setExpandedQuestion] = useState(null);

    useEffect(() => {
        if (isOpen && job) {
            fetchPrepData();
        }
    }, [isOpen, job]);

    const fetchPrepData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/interview-prep/${job.id}`);
            if (!res.ok) throw new Error(`API ${res.status}`);
            const data = await res.json();

            // Shape the real API data into the component's expected format
            const shaped = {
                predictedQuestions: (data.predictedQuestions || []).map(q => ({
                    id: q.id,
                    category: q.category || 'Role-Specific',
                    question: q.question,
                    talkingPoints: q.talkingPoints && q.talkingPoints.length ? q.talkingPoints : null,
                })),
                companyIntel: {
                    overview: data.companyIntel?.overview || '',
                    roleInsights: data.companyIntel?.roleInsights || '',
                    keyRequirements: data.companyIntel?.keyRequirements || [],
                    redFlags: data.companyIntel?.redFlags || '',
                    salaryBand: data.companyIntel?.salaryBand || null,
                    location: data.location,
                }
            };
            setPrepData(shaped);
        } catch (err) {
            console.error('Failed to fetch prep data:', err);
            setPrepData(null);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-linen w-full max-w-4xl max-h-[88vh] rounded-2xl border border-hairline shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="px-7 py-5 bg-parchment border-b border-hairline flex justify-between items-center">
                    <h2 className="font-display text-xl font-semibold text-rust-deep flex items-center gap-2">
                        <Target /> Interview Prep: {job.title}
                    </h2>
                    <button onClick={onClose} className="w-9 h-9 rounded-full border border-hairline-strong text-ink-faint flex items-center justify-center hover:bg-bone hover:text-ink transition-all duration-200">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-7 space-y-7">

                    {loading ? (
                        <div className="flex items-center justify-center gap-2 py-12 text-sage-deep">
                            <Loader2 className="animate-spin" /> Generating interview prep...
                        </div>
                    ) : !prepData ? (
                        <div className="text-center text-ink-faint py-12">Could not load prep data</div>
                    ) : (
                        <>
                            {/* Predicted Questions */}
                            <section>
                                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink-faint mb-3">
                                    <Lightbulb className="text-ink-faint" /> Predicted Questions
                                </h3>
                                <div className="space-y-4">
                                    {prepData.predictedQuestions.map(q => (
                                        <div key={q.id} className="bg-linen border border-hairline rounded-xl p-4">
                                            <div
                                                className="flex justify-between items-start cursor-pointer"
                                                onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                                            >
                                                <div className="flex-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-vintageblue-deep bg-vintageblue-mist px-2 py-0.5 rounded-full">
                                                        {q.category}
                                                    </span>
                                                    <p className="text-[13px] font-semibold text-ink mt-2">{q.question}</p>
                                                </div>
                                                <span className="text-ink-faint">
                                                    {expandedQuestion === q.id ? '−' : '+'}
                                                </span>
                                            </div>

                                            {expandedQuestion === q.id && (
                                                <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
                                                    {q.talkingPoints ? (
                                                        <div>
                                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-ink-faint mb-2">Talking Points:</h4>
                                                            <ul className="space-y-2">
                                                                {q.talkingPoints.map((point, idx) => (
                                                                    <li key={idx} className="text-xs text-ink-soft flex items-start gap-1.5 leading-relaxed">
                                                                        <span className="text-sage-deep">✓</span> {point}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ) : q.starTemplate ? (
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {Object.entries(q.starTemplate).map(([key, value]) => (
                                                                <div key={key} className="well p-3 rounded-lg">
                                                                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-clay mb-1">{key}</h5>
                                                                    <p className="text-xs text-ink-soft italic leading-relaxed">{value}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Company Intel */}
                            <section>
                                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink-faint mb-3">
                                    <Building size={14} /> Company Intel Brief
                                </h3>
                                <div className="well rounded-xl p-5 space-y-3.5">
                                    <div>
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-sage-deep mb-1">Overview</h4>
                                        <p className="text-[13px] text-ink-soft leading-relaxed">{prepData.companyIntel.overview}</p>
                                    </div>
                                    {prepData.companyIntel.roleInsights && (
                                        <div>
                                            <h4 className="text-xs font-bold text-ink-faint mb-1">Role Insights</h4>
                                            <p className="text-[13px] text-ink-soft leading-relaxed">{prepData.companyIntel.roleInsights}</p>
                                        </div>
                                    )}
                                    {prepData.companyIntel.keyRequirements.length > 0 && (
                                        <div>
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-mustard-deep mb-1">Key Requirements</h4>
                                            <ul className="space-y-1">
                                                {prepData.companyIntel.keyRequirements.map((req, idx) => (
                                                    <li key={idx} className="text-xs text-ink-soft flex items-start gap-1.5 leading-relaxed">
                                                        <span className="text-sage-deep">✓</span> {req}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {prepData.companyIntel.salaryBand && (
                                        <div>
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-clay mb-1">Salary Band</h4>
                                            <p className="font-display text-base font-semibold text-ink">
                                                ${prepData.companyIntel.salaryBand.low?.toLocaleString()} — ${prepData.companyIntel.salaryBand.high?.toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                    {prepData.companyIntel.redFlags && (
                                        <div className="pt-3 border-t border-hairline">
                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-rust-deep mb-1">⚠ Watch For</h4>
                                            <p className="text-xs text-ink-soft italic leading-relaxed">{prepData.companyIntel.redFlags}</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-7 py-4 bg-parchment border-t border-hairline flex justify-end">
                    <Button variant="ghost" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default InterviewPrepModal;
