import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Loader2, X, CheckCircle } from 'lucide-react';
import Button from '../common/Button';
import { useJobs } from '../../context/JobsContext';

function VoiceNoteCapture({ isOpen, onClose }) {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const recognitionRef = useRef(null);
    const { allJobs } = useJobs();

    useEffect(() => {
        // Check for Web Speech API support
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcriptPiece = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcriptPiece + ' ';
                    } else {
                        interimTranscript += transcriptPiece;
                    }
                }

                setTranscript(prev => prev + finalTranscript);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsRecording(false);
            };
        }

        return () => {
            if (recognitionRef.current && isRecording) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const startRecording = () => {
        if (recognitionRef.current) {
            setTranscript('');
            recognitionRef.current.start();
            setIsRecording(true);
        } else {
            alert('Speech recognition not supported in this browser. Try Chrome or Edge.');
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSave = async () => {
        if (!transcript.trim()) return;

        setIsProcessing(true);

        // Simple AI extraction (mock for now - could be enhanced with actual AI)
        const keywords = transcript.toLowerCase();
        let autoSelectedJob = null;

        // Try to match company or role mentions
        for (const job of allJobs) {
            if (keywords.includes(job.company.toLowerCase()) || keywords.includes(job.title.toLowerCase())) {
                autoSelectedJob = job.id;
                break;
            }
        }

        const jobId = selectedJobId || autoSelectedJob;

        if (jobId) {
            try {
                await fetch('/api/update_notes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        job_id: jobId,
                        notes: `[Voice Note - ${new Date().toLocaleDateString()}]\n${transcript}`
                    })
                });
            } catch (err) {
                console.error('Failed to save voice note:', err);
            }
        }

        setIsProcessing(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-[3000] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-linen w-full max-w-lg rounded-2xl border border-hairline shadow-2xl p-6 flex flex-col gap-6" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex justify-between items-center">
                    <h2 className="font-display text-xl font-semibold text-ink flex items-center gap-2">
                        <Mic size={24} /> Voice Note
                    </h2>
                    <button onClick={onClose} className="text-ink-faint hover:text-ink transition-colors duration-200">
                        <X size={20} />
                    </button>
                </div>

                {/* Recording Controls */}
                <div className="flex justify-center">
                    {!isRecording ? (
                        <button
                            onClick={startRecording}
                            className="w-20 h-20 rounded-full bg-sage text-linen flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform duration-300"
                        >
                            <Mic size={36} />
                        </button>
                    ) : (
                        <button
                            onClick={stopRecording}
                            className="w-20 h-20 rounded-full bg-rust text-linen flex items-center justify-center animate-pulse shadow-md hover:scale-105 transition-transform duration-300"
                        >
                            <Square size={36} fill="white" />
                        </button>
                    )}
                </div>

                {/* Status */}
                <div className="text-center">
                    {isRecording && (
                        <div className="text-rust-deep text-xs font-bold tracking-widest uppercase animate-pulse">
                            ● RECORDING...
                        </div>
                    )}
                    {!isRecording && transcript && (
                        <div className="text-sage-deep text-xs font-semibold flex items-center justify-center gap-2">
                            <CheckCircle size={14} /> Ready to save
                        </div>
                    )}
                </div>

                {/* Transcript */}
                {transcript && (
                    <div className="well rounded-xl p-4 max-h-40 overflow-y-auto">
                        <div className="text-sm text-ink-soft leading-relaxed">
                            {transcript || 'Start speaking...'}
                        </div>
                    </div>
                )}

                {/* Job Selection */}
                {transcript && (
                    <div>
                        <label className="block text-xs font-medium text-ink-faint mb-2">Attach to job (optional)</label>
                        <select
                            id="voice-note-job"
                            name="voice-note-job"
                            value={selectedJobId || ''}
                            onChange={(e) => setSelectedJobId(e.target.value)}
                            className="w-full bg-linen border border-hairline-strong rounded-lg p-2.5 text-sm text-ink bg-linen outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
                        >
                            <option value="">Auto-detect from transcript</option>
                            {allJobs.map(job => (
                                <option key={job.id} value={job.id}>{job.title} - {job.company}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <Button variant="ghost" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={!transcript.trim() || isProcessing}
                        className="flex-1"
                        icon={isProcessing ? Loader2 : CheckCircle}
                    >
                        {isProcessing ? 'Saving...' : 'Save Note'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default VoiceNoteCapture;
