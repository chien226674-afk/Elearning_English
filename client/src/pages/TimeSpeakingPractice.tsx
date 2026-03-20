import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, RotateCcw, Loader2, CheckCircle2, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import WaveVisualizer from "../components/speaking/WaveVisualizer";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import api from "../lib/axios";
import { toast } from "sonner";

interface TimedEvaluation {
    pronunciation: number;
    fluency: number;
    strengths: string;
    weaknesses: string;
    sampleAnswer: string;
    expEarned?: number;
    newTotalExp?: number;
    newLevel?: number;
}

export default function TimeSpeakingPracticePage() {
    const navigate = useNavigate();

    // Data State
    const [prompt, setPrompt] = useState<string>("");
    const [loadingPrompt, setLoadingPrompt] = useState(true);

    // Phases: 'thinking' (1 min) -> 'recording' (2 mins) -> 'evaluating' -> 'result'
    const [phase, setPhase] = useState<'thinking' | 'recording' | 'evaluating' | 'result'>('thinking');
    const phaseRef = useRef(phase);
    
    useEffect(() => {
        phaseRef.current = phase;
    }, [phase]);
    
    // Timers
    const TIMEOUT_THINKING = 60; // 1 minute
    const TIMEOUT_RECORDING = 120; // 2 minutes
    const [timeLeft, setTimeLeft] = useState(TIMEOUT_THINKING);

    // Evaluation State
    const [evaluation, setEvaluation] = useState<TimedEvaluation | null>(null);
    const [showSample, setShowSample] = useState(false);

    // Timer interval ref
    const timerRef = useRef<number | null>(null);

    // Audio tracking refs
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const isMounted = useRef(true);

    // Audio Recorder hook
    const handleEvaluation = async (audioBlob: Blob) => {
        if (!isMounted.current) return;
        if (phaseRef.current !== 'recording') return; // Prevent double submission

        setPhase('evaluating');
        clearTimer();

        if (!audioBlob || audioBlob.size === 0) {
            if (isMounted.current) {
                toast.error("Âm thanh quá ngắn hoặc không có, vui lòng nói lại");
                handleRetry();
            }
            return;
        }

        const formData = new FormData();
        formData.append("audio", audioBlob, "timed_speech.webm");
        formData.append("prompt", prompt);

        // Use a new abort controller for evaluation to ensure it can be canceled on unmount
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        try {
            const res = await api.post('/api/lessons/timed/evaluate', formData, {
                headers: { "Content-Type": "multipart/form-data" },
                signal: abortControllerRef.current.signal
            });

            if (!isMounted.current) return;

            setEvaluation(res.data);
            setPhase('result');
            
            if (res.data.expEarned) {
                toast.success(`Bạn nhận được +${res.data.expEarned} EXP 🎉`);
            }
        } catch (error: any) {
            if (error?.name === "CanceledError" || error?.name === "AbortError") return;
            
            if (isMounted.current) {
                console.error("Evaluation error", error);
                toast.error("Lỗi khi chấm điểm");
                handleRetry();
            }
        }
    };

    const { startRecording, stopRecording, analyser } = useAudioRecorder({
        onStop: handleEvaluation,
        silenceTimeoutMs: 60000, // No auto-stop on silence for long speaking
        silenceThreshold: 10
    });

    const clearTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const playTTS = async (text: string) => {
        try {
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current = null;
            }
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }

            const ttsRes = await api.post('/api/lessons/tts/english', { text }, { responseType: 'blob' });
            const audioUrl = URL.createObjectURL(ttsRes.data);
            if (!isMounted.current) {
                URL.revokeObjectURL(audioUrl);
                return;
            }
            const audio = new Audio(audioUrl);
            currentAudioRef.current = audio;
            audio.play().catch(e => console.error("Audio playback prevented:", e));
            audio.onended = () => URL.revokeObjectURL(audioUrl);
        } catch (error) {
            console.error('TTS Error', error);
            // Fallback to Web Speech API
            if (window.speechSynthesis) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'en-US';
                window.speechSynthesis.speak(utterance);
            }
        }
    };

    const fetchPrompt = async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setLoadingPrompt(true);
        try {
            const res = await api.get('/api/lessons/timed/prompt', { 
                signal: abortControllerRef.current.signal 
            });
            if (!isMounted.current) return;
            const newPrompt = res.data.prompt;
            setPrompt(newPrompt);
            setPhase('thinking');
            setTimeLeft(TIMEOUT_THINKING);
            
            // Play TTS when prompt is loaded
            playTTS(newPrompt);
            setLoadingPrompt(false);
        } catch (error: any) {
            // Silently ignore aborted requests to prevent race conditions and console errors
            if (error?.name === "CanceledError" || error?.name === "AbortError" || error?.message === "canceled") {
                return;
            }
            console.error("Failed to load prompt", error);
            toast.error("Không thể tải chủ đề nói");
            setLoadingPrompt(false);
        }
    };

    useEffect(() => {
        isMounted.current = true;
        fetchPrompt();
        return () => {
            isMounted.current = false;
            clearTimer();
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current = null;
            }
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    useEffect(() => {
        if (phase === 'thinking' || phase === 'recording') {
            clearTimer();
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearTimer();
                        if (phase === 'thinking') {
                            // transition to recording automatically
                            startRecordingPhase();
                        } else if (phase === 'recording') {
                            // stop recording automatically
                            stopRecordingAndEvaluate();
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearTimer();
    }, [phase]);

    const startRecordingPhase = () => {
        setPhase('recording');
        setTimeLeft(TIMEOUT_RECORDING);
        startRecording();
    };

    const stopRecordingAndEvaluate = () => {
        stopRecording();
    };

    const handleMicClick = () => {
        if (phase === 'thinking') {
            startRecordingPhase();
        } else if (phase === 'recording') {
            const elapsed = TIMEOUT_RECORDING - timeLeft;
            if (elapsed < 30) {
                toast.warning(`Vui lòng nói thêm ${30 - elapsed} giây nữa để AI đánh giá chính xác.`);
                return;
            }
            stopRecordingAndEvaluate();
        }
    };

    const handleRetry = () => {
        setEvaluation(null);
        setShowSample(false);
        fetchPrompt();
    };

    const handleComplete = () => {
        navigate(-1);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        if (m > 0) return `${m}:${s.toString().padStart(2, '0')}`;
        return `${s}`;
    };

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'text-green-500 border-green-500';
        if (score >= 5) return 'text-yellow-500 border-yellow-500';
        return 'text-red-500 border-red-500';
    };

    if (loadingPrompt) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen dark:bg-slate-900 dark:text-gray-300">
                <Loader2 className="animate-spin text-green-500 mb-4" size={40} />
                <p>Đang chuẩn bị chủ đề...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center py-6 min-h-[calc(100vh-65px)] overflow-y-auto space-y-4 bg-gradient-to-br from-green-50/50 via-teal-50/30 to-emerald-100/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
            {/* Header */}
            <div className="w-full max-w-lg flex items-center gap-3 px-4">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:shadow active:scale-95 cursor-pointer transition-all border dark:border-slate-700" onClick={() => navigate(-1)}>
                    <ArrowLeft className="text-gray-600 dark:text-gray-300" />
                </div>
                <div>
                    <h1 className="text-xl font-extrabold bg-gradient-to-r from-teal-600 to-green-500 dark:from-teal-400 dark:to-green-400 bg-clip-text text-transparent">
                        Luyện nói theo thời gian
                    </h1>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-0.5">Thời gian giới hạn</p>
                </div>
            </div>

            {/* Main Content Area (Thinking & Recording) */}
            {(phase === 'thinking' || phase === 'recording') && (
                <div className="w-full max-w-5xl px-4 mt-8 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 flex-1 min-h-0">
                    
                    {/* Left: Prompt Card */}
                    <div className="w-full max-w-md lg:w-1/2 flex justify-center h-full">
                        <div className="relative w-full h-full min-h-[260px] overflow-hidden bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-[2rem] p-8 shadow-xl shadow-teal-100/60 dark:shadow-slate-950/50 border border-white dark:border-slate-700 text-center flex flex-col items-center justify-center">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-green-200/30 rounded-full blur-3xl -z-10" />
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-200/30 rounded-full blur-3xl -z-10" />
                            
                            <div className="z-10 flex flex-col items-center justify-center h-full">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100/80 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full mb-6 shadow-sm">
                                    🎯 CHỦ ĐỀ
                                </div>
                                <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-800 dark:text-white leading-snug mb-8">
                                    "{prompt}"
                                </h2>
                                <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">
                                    Speak clearly for at least 30 seconds
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Recording UI */}
                    <div className="w-full max-w-md lg:w-1/2 flex flex-col items-center justify-center gap-10">
                        {/* Timer Circle */}
                        <div className="flex flex-col items-center gap-12 w-full">
                            <div className="flex items-center justify-center gap-12 lg:gap-16 w-full">
                                <div className={`relative w-36 h-36 rounded-full border-[6px] flex flex-col items-center justify-center bg-white dark:bg-slate-800 shadow-xl transition-colors duration-500 shrink-0 ${phase === 'thinking' ? 'border-blue-400 dark:border-blue-500 shadow-blue-200/50 dark:shadow-blue-900/20 text-blue-600 dark:text-blue-400' : 'border-green-500 dark:border-green-600 shadow-green-200/50 dark:shadow-green-900/20 text-green-600 dark:text-green-400'}`}>
                                    <span className="text-4xl lg:text-5xl font-extrabold font-mono text-slate-800 dark:text-white">{formatTime(timeLeft)}</span>
                                    <span className="text-xs font-bold tracking-widest mt-1">
                                        {phase === 'thinking' ? 'THINKING' : 'SECONDS'}
                                    </span>
                                </div>
                                
                                {/* Waveform (always takes space to keep center alignment, fades out if not recording) */}
                                <div className={`w-[160px] h-20 flex items-center justify-start transition-opacity duration-300 ${phase === 'recording' ? 'opacity-100' : 'opacity-0'}`}>
                                    <WaveVisualizer isActive={phase === 'recording'} analyser={analyser} />
                                </div>
                            </div>

                            {/* Mic Button */}
                            <div className="flex flex-col items-center gap-4 mt-2">
                                <button
                                    onClick={handleMicClick}
                                    className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all hover:-translate-y-1 ${
                                        phase === 'recording' 
                                        ? ((TIMEOUT_RECORDING - timeLeft < 30) 
                                            ? 'bg-red-400 cursor-not-allowed opacity-80 ring-[6px] ring-red-100' 
                                            : 'bg-red-500 animate-pulse ring-[6px] ring-red-200 hover:bg-red-600')
                                        : 'bg-green-500 ring-[6px] ring-transparent hover:ring-green-200 hover:shadow-green-300/50'
                                    }`}
                                >
                                    <Mic size={40} className="text-white" />
                                </button>
                                <div className="text-center h-12">
                                    <p className={`font-bold text-base ${phase === 'recording' ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                        {phase === 'thinking' ? 'Tap to Start Speaking' : (
                                            TIMEOUT_RECORDING - timeLeft < 30 
                                            ? `Speak for ${30 - (TIMEOUT_RECORDING - timeLeft)}s more` 
                                            : 'Tap to Stop'
                                        )}
                                    </p>
                                    {phase === 'thinking' && (
                                        <p className="text-xs text-slate-500 dark:text-gray-500 mt-2 font-medium">
                                            Bạn có 1 phút suy nghĩ, nhấn để nói luôn.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Evaluating State */}
            {phase === 'evaluating' && (
                <div className="w-full max-w-5xl px-4 mt-8 flex flex-col items-center justify-center gap-10 flex-1 min-h-0 text-center">
                    <div className="w-full max-w-lg">
                        <div className="relative overflow-hidden bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-[2rem] p-8 shadow-sm border border-white dark:border-slate-700 flex flex-col items-center justify-center opacity-70">
                            <div className="z-10">
                                <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white leading-snug">
                                    "{prompt}"
                                </h2>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 border-4 border-green-200 rounded-full border-t-green-500 animate-[spin_1.5s_linear_infinite]" />
                            <div className="w-16 h-16 flex items-center justify-center bg-white dark:bg-slate-700 rounded-full shadow-md z-10 relative border dark:border-slate-600">
                                <Loader2 className="animate-spin text-green-500 opacity-0" size={32} />
                                <span className="text-2xl absolute">🤖</span>
                            </div>
                        </div>
                        <p className="text-slate-700 dark:text-gray-300 font-bold tracking-wide animate-pulse">Đang phân tích bài nói của bạn...</p>
                    </div>
                </div>
            )}

            {/* Result State */}
            {phase === 'result' && evaluation && (
                <div className="w-full max-w-lg px-6 py-8 mt-6 flex flex-col gap-6 bg-white/85 dark:bg-slate-800/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-green-100/80 dark:shadow-slate-950/50 border border-white dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
                    
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-300/20 rounded-full blur-3xl -z-10" />
                    <div className="absolute bottom-10 left-0 w-48 h-48 bg-teal-300/20 rounded-full blur-3xl -z-10" />

                    <div className="text-center z-10">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-100 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-full flex items-center justify-center mb-5 shadow-inner border border-white dark:border-slate-700">
                            <span className="text-4xl text-green-600">🎉</span>
                        </div>
                        <h2 className="text-2xl font-extrabold bg-gradient-to-r from-teal-700 to-green-600 dark:from-teal-400 dark:to-green-400 bg-clip-text text-transparent">
                            Tuyệt vời! Bạn đang làm rất tốt!
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Bạn đã hoàn thành bài nói.</p>
                    </div>

                    {/* Scores */}
                    <div className="flex justify-center gap-8 py-4">
                        <div className="flex flex-col items-center gap-2">
                            <div className={`w-20 h-20 rounded-full border-[6px] flex items-center justify-center ${getScoreColor(evaluation.pronunciation)}`}>
                                <span className="text-2xl font-bold dark:text-white">{evaluation.pronunciation}/10</span>
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-gray-300">Phát âm</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className={`w-20 h-20 rounded-full border-[6px] flex items-center justify-center ${getScoreColor(evaluation.fluency)}`}>
                                <span className="text-2xl font-bold dark:text-white">{evaluation.fluency}/10</span>
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-gray-300">Trôi chảy</span>
                        </div>
                    </div>

                    {/* AI Feedback */}
                    <div className="mt-4">
                        <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white mb-4">
                            <span className="text-green-500">✨</span> Phản hồi từ AI
                        </h3>
                        
                        <div className="flex flex-col gap-4">
                            {/* Strengths */}
                            <div className="bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 rounded-2xl p-5 flex gap-4">
                                <div className="mt-0.5">
                                    <CheckCircle2 size={20} className="text-green-500" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">Điểm mạnh</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                        {evaluation.strengths}
                                    </p>
                                </div>
                            </div>

                            {/* Weaknesses */}
                            <div className="bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 rounded-2xl p-5 flex gap-4">
                                <div className="mt-0.5">
                                    <Lightbulb size={20} className="text-orange-500" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">Cần cải thiện</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                        {evaluation.weaknesses}
                                    </p>
                                </div>
                            </div>

                            {/* Sample Answer */}
                            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/50">
                                <button 
                                    onClick={() => setShowSample(!showSample)}
                                    className="flex items-center justify-between w-full p-5 text-left hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="mt-0.5">
                                            <span className="text-slate-700 dark:text-gray-300 font-bold">💡</span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">Câu trả lời mẫu</h4>
                                    </div>
                                    {showSample ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                </button>
                                
                                {showSample && (
                                    <div className="px-5 pb-5 pt-0">
                                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl text-sm text-slate-700 dark:text-gray-300 leading-relaxed border border-slate-100 dark:border-slate-800 shadow-sm">
                                            <p className="whitespace-pre-wrap">{evaluation.sampleAnswer}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Result Footer Buttons */}
                    <div className="flex items-center gap-4 mt-6 pb-8">
                        <button
                            onClick={handleRetry}
                            className="flex-1 py-3.5 rounded-full border-2 border-green-500 dark:border-green-600 text-green-600 dark:text-green-400 font-bold flex items-center justify-center gap-2 hover:bg-green-50 dark:hover:bg-green-900/20 transition"
                        >
                            <RotateCcw size={18} />
                            Làm lại
                        </button>

                        <button
                            onClick={handleComplete}
                            className="flex-1 py-3.5 rounded-full bg-green-500 dark:bg-green-600 text-white font-bold hover:bg-green-600 dark:hover:bg-green-700 transition shadow-md shadow-green-200 dark:shadow-none"
                        >
                            Hoàn thành ✓
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
