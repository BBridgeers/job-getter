import { useState } from 'react';
import { Clock, X, Mail, Copy, Check } from 'lucide-react';
import { useJobs } from '../../context/JobsContext';

function FollowUpAlert() {
    const { allJobs } = useJobs();
    const [dismissedIds, setDismissedIds] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    const getApplicationAge = (appliedDate) => {
        if (!appliedDate) return null;
        return Math.floor((Date.now() - new Date(appliedDate).getTime()) / 86400000);
    };

    const generateFollowUpEmail = (job) => `Subject: Following up — ${job.title} application

Dear Hiring Manager,

I wanted to follow up on my application for the ${job.title} role at ${job.company}, submitted ${Math.floor((Date.now() - new Date(job.applied_date).getTime()) / 86400000)} days ago.

I remain very interested in the opportunity and would welcome the chance to discuss how my background fits your team's needs.

Thank you for your time and consideration.

Best regards,
Blake E. Bridgers`;

    const alerts = allJobs
        .filter(job => {
            if (dismissedIds.includes(job.id)) return false;
            if ((job.display_status || 'New') === 'Applied' && job.applied_date) {
                return getApplicationAge(job.applied_date) >= 7;
            }
            return false;
        })
        .map(job => {
            const days = getApplicationAge(job.applied_date);
            return {
                id: job.id,
                job,
                days,
                severity: days >= 14 ? 'critical' : 'warning',
                message: days >= 14
                    ? `Applied ${days} days ago. Likely ghosted.`
                    : `Applied ${days} days ago. Consider following up.`,
            };
        })
        .sort((a, b) => b.days - a.days);

    const handleCopy = async (alert) => {
        try {
            await navigator.clipboard.writeText(generateFollowUpEmail(alert.job));
            setCopiedId(alert.id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Clipboard failed', err);
        }
    };

    if (alerts.length === 0) return null;

    return (
        <div className="fixed bottom-7 left-7 z-50 flex flex-col gap-3 max-w-sm">
            {alerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="paper-card p-4 flex flex-col gap-2.5 rise-in">
                    <div className="flex items-start gap-3">
                        <span className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 ${
                            alert.severity === 'critical'
                                ? 'bg-rust-mist text-rust-deep'
                                : 'bg-clay-mist text-clay'
                        }`}>
                            <Clock size={15} />
                        </span>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-[13px] font-bold text-ink">Follow-up needed</h4>
                            <p className="text-xs font-semibold text-ink-soft truncate mt-0.5">
                                {alert.job.title} · {alert.job.company}
                            </p>
                            <p className={`text-xs mt-1 ${alert.severity === 'critical' ? 'text-rust-deep' : 'text-clay'}`}>
                                {alert.message}
                            </p>
                        </div>
                        <button
                            onClick={() => setDismissedIds([...dismissedIds, alert.id])}
                            className="text-ink-faint hover:text-ink transition-colors duration-200 flex-shrink-0"
                        >
                            <X size={15} />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 pl-11">
                        <button
                            onClick={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sage-deep hover:text-sage transition-colors duration-200"
                        >
                            <Mail size={12} /> Draft email
                        </button>
                    </div>

                    {expandedId === alert.id && (
                        <div className="pl-11 pr-1 pt-1 border-t border-hairline mt-1">
                            <div className="flex justify-between items-center py-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">Follow-up template</span>
                                <button
                                    onClick={() => handleCopy(alert)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-vintageblue-deep hover:text-vintageblue transition-colors duration-200"
                                >
                                    {copiedId === alert.id ? <Check size={12} /> : <Copy size={12} />}
                                    {copiedId === alert.id ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <pre className="text-[11px] leading-relaxed well p-3 rounded-lg text-ink-soft max-h-40 overflow-y-auto whitespace-pre-wrap font-body">
                                {generateFollowUpEmail(alert.job)}
                            </pre>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default FollowUpAlert;
