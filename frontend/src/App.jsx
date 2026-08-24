import { useState } from 'react';
import Header from './components/Header/Header';
import FilterBar from './components/FilterBar/FilterBar';
import JobCard from './components/JobCard/JobCard';
import PipelineDashboard from './components/PipelineDashboard/PipelineDashboard';
import VoiceNoteCapture from './components/VoiceNoteCapture/VoiceNoteCapture';
import { JobsProvider, useJobs } from './context/JobsContext';
import { Mic, LoaderCircle, Compass } from 'lucide-react';

/* ----- Static states ----- */
function LoadingState() {
    return (
        <div className="col-span-full flex flex-col items-center justify-center py-28 gap-5">
            <LoaderCircle size={40} className="text-sage animate-spin" style={{ animationDuration: '1.6s' }} />
            <p className="text-sm font-medium tracking-wide text-ink-faint">Gathering opportunities…</p>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="col-span-full text-center py-24">
            <div className="inline-flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-parchment flex items-center justify-center">
                    <Compass size={28} className="text-ink-faint" />
                </div>
                <h3 className="font-display text-xl font-semibold text-ink">Nothing matches those filters</h3>
                <p className="text-sm text-ink-soft max-w-sm">
                    Try clearing the search or picking a different category — new targets land every scan cycle.
                </p>
            </div>
        </div>
    );
}

/* ----- Error banner ----- */
function ErrorBanner({ message, onRetry }) {
    return (
        <div className="col-span-full text-center py-16">
            <div className="inline-flex flex-col items-center gap-4 paper-card px-10 py-8">
                <p className="text-sm text-rust-deep font-medium">{message}</p>
                <button
                    onClick={onRetry}
                    className="h-10 px-6 rounded-full bg-sage text-linen text-sm font-semibold hover:bg-sage-deep transition-colors duration-300"
                >
                    Retry connection
                </button>
            </div>
        </div>
    );
}

/* ----- Main dashboard ----- */
function DashboardContent() {
    const { jobs, loading, error, view, refreshJobs } = useJobs();
    const [showVoiceNote, setShowVoiceNote] = useState(false);

    const showCards = !loading && !error && view !== 'pipeline';
    const showPipeline = view === 'pipeline';

    return (
        <div className="pb-16 min-h-screen">
            <Header />
            <FilterBar />

            {/* Pipeline view */}
            {showPipeline && <PipelineDashboard />}

            {/* Discovery view — single <main> with all states inside */}
            {showCards && (
                <main className="px-6 max-w-7xl mx-auto mt-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 min-h-[60vh]">
                    {loading && <LoadingState />}
                    {error && <ErrorBanner message={error} onRetry={refreshJobs} />}
                    {!loading && !error && jobs.length === 0 && <EmptyState />}
                    {!loading && !error && jobs.map((job, i) => (
                        <JobCard key={job.id} job={job} index={i} />
                    ))}
                </main>
            )}

            {/* Voice note FAB */}
            <button
                onClick={() => setShowVoiceNote(true)}
                title="Quick voice note"
                className="fixed bottom-7 right-7 w-14 h-14 rounded-full bg-ink text-alabaster
                           flex items-center justify-center shadow-lg hover:shadow-xl
                           hover:scale-105 active:scale-95 transition-all duration-300 z-50"
            >
                <Mic size={22} />
            </button>

            <VoiceNoteCapture isOpen={showVoiceNote} onClose={() => setShowVoiceNote(false)} />
        </div>
    );
}

export default function App() {
    return (
        <JobsProvider>
            <div className="min-h-screen">
                <DashboardContent />
            </div>
        </JobsProvider>
    );
}
