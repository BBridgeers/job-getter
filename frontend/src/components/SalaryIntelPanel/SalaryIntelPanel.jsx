import { useState } from 'react';
import { DollarSign, TrendingUp, Copy, Check } from 'lucide-react';

function SalaryIntelPanel({ job }) {
    // Real band from the job record; graceful fallback
    const bandLow = job.salary_min || 105000;
    const bandHigh = job.salary_max || (bandLow + 50000);
    const marketMedian = Math.round((bandLow + bandHigh) / 2);

    const [targetSalary, setTargetSalary] = useState(marketMedian);
    const [copied, setCopied] = useState(false);

    const generateNegotiationScript = () => `Thank you for the offer. I'm excited about the opportunity to join ${job.company} as ${job.title}.

Based on my research and 12+ years of enterprise experience, the market rate for this role in ${job.location || 'this market'} typically ranges from $${bandLow.toLocaleString()} to $${bandHigh.toLocaleString()}, with a median around $${marketMedian.toLocaleString()}.

Given my specific expertise and the value I bring — retention programs, onboarding design, and C-suite relationship management — I'd like to discuss a base salary of $${targetSalary.toLocaleString()}.

I'm confident we can find a mutually beneficial arrangement.`;

    const handleCopyScript = async () => {
        try {
            await navigator.clipboard.writeText(generateNegotiationScript());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Clipboard failed', err);
        }
    };

    const percentage = Math.min(Math.max(((targetSalary - bandLow) / (bandHigh - bandLow)) * 100, 2), 98);

    return (
        <div>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink-faint mb-3">
                <DollarSign size={14} /> Salary Intelligence
            </h3>

            <div className="well rounded-xl p-5">
                {/* Market range */}
                <div className="flex justify-between items-baseline mb-2.5">
                    <span className="text-xs font-semibold text-ink-soft">Market Range</span>
                    <span className="font-display text-sm font-semibold text-ink">
                        ${bandLow.toLocaleString()} – ${bandHigh.toLocaleString()}
                    </span>
                </div>

                {/* Band bar */}
                <div className="relative h-2.5 rounded-full bg-linen border border-hairline overflow-hidden mb-1.5">
                    <div className="absolute inset-y-0 left-[15%] right-[15%] bg-mustard/30 rounded-full" />
                    <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-4.5 h-5 bg-clay rounded-full shadow-sm transition-all duration-500"
                        style={{ left: `${percentage}%`, transitionTimingFunction: 'var(--ease-expo-out)' }}
                        title={`Target: $${targetSalary.toLocaleString()}`}
                    />
                </div>
                <div className="flex justify-between text-[10px] text-ink-faint mb-4">
                    <span>${bandLow.toLocaleString()}</span>
                    <span className="font-display font-semibold text-mustard-deep">${marketMedian.toLocaleString()} median</span>
                    <span>${bandHigh.toLocaleString()}</span>
                </div>

                {/* Negotiation helper */}
                <div className="pt-3 border-t border-hairline">
                    <label className="flex justify-between items-baseline mb-2">
                        <span className="text-xs font-semibold text-ink-soft">Target counter-offer</span>
                        <span className="font-display text-base font-semibold text-sage-deep">${targetSalary.toLocaleString()}</span>
                    </label>
                    <input
                        id="salary-target"
                        name="salary-target"
                        type="range"
                        min={bandLow}
                        max={bandHigh}
                        step={1000}
                        value={targetSalary}
                        onChange={(e) => setTargetSalary(Number(e.target.value))}
                        className="w-full accent-[#75836B] cursor-pointer"
                    />
                    <button
                        onClick={handleCopyScript}
                        className="mt-4 w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-full border border-hairline-strong text-[13px] font-semibold text-vintageblue-deep hover:bg-vintageblue-mist/50 hover:border-vintageblue transition-all duration-300"
                    >
                        {copied ? <Check size={14} /> : <Copy size={13} />}
                        {copied ? 'Copied to clipboard' : 'Copy negotiation script'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SalaryIntelPanel;
