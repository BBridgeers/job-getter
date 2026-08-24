import { useState } from 'react';
import { Search, RefreshCw, FileText, Loader2, Download, Send } from 'lucide-react';
import { useJobs } from '../../context/JobsContext';
import StoneField from '../StoneField';

function Header() {
    const { filters, updateFilter, loading, error, allJobs, refreshJobs } = useJobs();
    const [isFocused, setIsFocused] = useState(false);
    const [briefState, setBriefState] = useState('idle'); // idle | generating | done | error
    const [briefResult, setBriefResult] = useState(null);
    const [showBriefDropdown, setShowBriefDropdown] = useState(false);

    const highMatch = allJobs.filter(j => (j.match_score || 0) >= 85).length;

    const handleBrief = async (action) => {
        setBriefState('generating');
        setShowBriefDropdown(false);
        try {
            const sendTg = action === 'telegram' || action === 'both';
            const response = await fetch('/api/brief', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram: sendTg, actor: 'user' }),
            });
            if (!response.ok) throw new Error('Brief generation failed');
            const data = await response.json();
            setBriefResult(data);
            setBriefState('done');

            if (action === 'download' || action === 'both') {
                // Download as .txt file
                const blob = new Blob([data.brief], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `job-getter-brief-${new Date().toISOString().slice(0,10)}.txt`;
                a.click();
                URL.revokeObjectURL(url);
            }

            // Reset after 4 seconds
            setTimeout(() => setBriefState('idle'), 4000);
        } catch (err) {
            console.error(err);
            setBriefState('error');
            setTimeout(() => setBriefState('idle'), 4000);
        }
    };

    return (
        <header className="bg-linen border-b border-hairline shadow-sm relative overflow-hidden">
            {/* Three.js stone field */}
            <div className="absolute inset-y-0 right-0 w-[46%] hidden lg:block
                            [mask-image:linear-gradient(to_left,black_55%,transparent)]">
                <StoneField />
            </div>

            <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-8 z-10">
                {/* Eyebrow */}
                <div className="flex items-center gap-3 mb-4 rise-in" style={{ animationDelay: '0ms' }}>
                    <span className="h-px w-10 bg-sage" />
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-sage-deep">
                        Blake E. Bridgers — Opportunity Engine
                    </span>
                </div>

                {/* Masthead */}
                <h1 className="font-display text-balance text-5xl md:text-6xl font-medium text-ink leading-[1.05] tracking-tight rise-in"
                    style={{ animationDelay: '80ms' }}>
                    Job Getter
                </h1>
                <p className="mt-3 max-w-xl text-base text-ink-soft leading-relaxed rise-in"
                   style={{ animationDelay: '160ms' }}>
                    {allJobs.length} live targets · {highMatch} strong matches.
                    Every application tailored, tracked, and timed.
                </p>

                {/* Search + status row */}
                <div className="mt-6 flex flex-wrap items-center gap-3 rise-in" style={{ animationDelay: '240ms' }}>
                    <div className={`relative w-full max-w-md transition-transform duration-500 ${isFocused ? 'scale-[1.02]' : ''}`}
                         style={{ transitionTimingFunction: 'var(--ease-expo-out)' }}>
                        <Search size={18}
                                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isFocused ? 'text-sage-deep' : 'text-ink-faint'}`} />
                        <input
                            id="search-roles"
                            name="search"
                            type="text"
                            placeholder="Search roles, companies, locations…"
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            className="w-full h-12 pl-11 pr-4 rounded-full bg-alabaster border border-hairline
                                       text-sm text-ink placeholder:text-ink-faint
                                       focus:outline-none focus:border-sage focus:ring-4 focus:ring-sage-mist/60
                                       transition-all duration-300"
                        />
                    </div>

                    {/* Sync status pill */}
                    <button
                        onClick={refreshJobs}
                        title="Refresh from backend"
                        className={`group flex items-center gap-2 h-10 px-5 rounded-full border text-xs font-semibold tracking-wide transition-all duration-300 ${
                            error
                                ? 'border-rust-mist bg-rust-mist text-rust-deep hover:brightness-95'
                                : loading
                                    ? 'border-mustard-mist bg-mustard-mist text-mustard-deep'
                                    : 'border-sage-mist bg-sage-mist text-sage-deep hover:brightness-95'
                        }`}
                    >
                        <RefreshCw size={13} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                        {error ? 'Offline — retry' : loading ? 'Syncing…' : 'Live'}
                    </button>

                    {/* Brief button with dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowBriefDropdown(!showBriefDropdown)}
                            disabled={briefState === 'generating'}
                            title="Generate activity brief"
                            className={`group flex items-center gap-2 h-10 px-5 rounded-full border text-xs font-semibold tracking-wide transition-all duration-300 ${
                                briefState === 'done'
                                    ? 'border-sage bg-sage text-linen'
                                    : briefState === 'error'
                                        ? 'border-rust-mist bg-rust-mist text-rust-deep'
                                        : 'border-hairline bg-alabaster text-ink-soft hover:border-sage hover:text-sage-deep'
                            }`}
                        >
                            {briefState === 'generating' ? (
                                <Loader2 size={13} className="animate-spin" />
                            ) : briefState === 'done' ? (
                                <FileText size={13} />
                            ) : (
                                <FileText size={13} />
                            )}
                            {briefState === 'generating' ? 'Generating…' : briefState === 'done' ? 'Brief sent!' : 'Generate Brief'}
                        </button>

                        {showBriefDropdown && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowBriefDropdown(false)} />
                                <div className="absolute top-full right-0 mt-2 z-50 w-64 rounded-2xl bg-alabaster border border-hairline shadow-xl overflow-hidden rise-in" style={{ animationDuration: '200ms' }}>
                                    <button
                                        onClick={() => handleBrief('telegram')}
                                        className="w-full flex items-center gap-3 px-5 py-4 text-sm text-ink hover:bg-sage-mist transition-colors duration-200 text-left"
                                    >
                                        <Send size={16} className="text-sage-deep" />
                                        <div>
                                            <div className="font-semibold">Send to Telegram</div>
                                            <div className="text-xs text-ink-faint mt-0.5">Push brief to your phone</div>
                                        </div>
                                    </button>
                                    <div className="h-px bg-hairline" />
                                    <button
                                        onClick={() => handleBrief('download')}
                                        className="w-full flex items-center gap-3 px-5 py-4 text-sm text-ink hover:bg-sage-mist transition-colors duration-200 text-left"
                                    >
                                        <Download size={16} className="text-sage-deep" />
                                        <div>
                                            <div className="font-semibold">Download locally</div>
                                            <div className="text-xs text-ink-faint mt-0.5">Save as .txt file</div>
                                        </div>
                                    </button>
                                    <div className="h-px bg-hairline" />
                                    <button
                                        onClick={() => handleBrief('both')}
                                        className="w-full flex items-center gap-3 px-5 py-4 text-sm text-ink hover:bg-sage-mist transition-colors duration-200 text-left"
                                    >
                                        <FileText size={16} className="text-sage-deep" />
                                        <div>
                                            <div className="font-semibold">Send + Download</div>
                                            <div className="text-xs text-ink-faint mt-0.5">Both at once</div>
                                        </div>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;
