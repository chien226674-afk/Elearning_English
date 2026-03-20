import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, RotateCcw, Volume2, Turtle, Mic } from "lucide-react";
import AvatarSection from "../components/speaking/AvatarSection";
import WaveVisualizer from "../components/speaking/WaveVisualizer";
import ScoreSection from "../components/speaking/ScoreSection";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import api from "../lib/axios";
import { toast } from "sonner";

export default function WrongWordPractice() {
    const { word } = useParams();
    const navigate = useNavigate();

    // Evaluation State
    const [score, setScore] = useState<number | null>(null);
    const [pronunciation, setPronunciation] = useState<number>(0);
    const [fluency, setFluency] = useState<number>(0);
    const [completion, setCompletion] = useState<number>(0);
    const [spokenText, setSpokenText] = useState<string | null>(null);
    const [wrongWords, setWrongWords] = useState<string[]>([]);
    const [evaluating, setEvaluating] = useState(false);
    const [completed, setCompleted] = useState(false);

    // Audio Settings
    const [ttsSettings, setTtsSettings] = useState({ accent: "US", audioSpeed: 1, feedbackMode: "friendly" });
    const [voicesLoaded, setVoicesLoaded] = useState(false);

    useEffect(() => {
        const loadVoices = () => {
            if (window.speechSynthesis.getVoices().length > 0) setVoicesLoaded(true);
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
        return () => { window.speechSynthesis.onvoiceschanged = null; }
    }, []);

    useEffect(() => {
        api.get('/api/users/settings').then(res => {
            if (res.data) setTtsSettings(prev => ({ ...prev, ...res.data }));
        }).catch(console.error);
    }, []);

    const playTTS = (text: string, speedModifier: number = 1.0) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = ttsSettings.audioSpeed * speedModifier;
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = voices.find(v => v.lang.startsWith(ttsSettings.accent === 'UK' ? 'en-GB' : 'en-US'));
        if (!selectedVoice) selectedVoice = voices.find(v => v.lang.startsWith('en'));
        if (selectedVoice) utterance.voice = selectedVoice;
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        if (voicesLoaded && word) {
            setTimeout(() => playTTS(word, 1.0), 300);
        }
    }, [voicesLoaded, word]);

    const handleEvaluation = async (audioBlob: Blob) => {
        if (evaluating) return;
        if (!audioBlob || audioBlob.size === 0) {
            toast.error("Âm thanh không hợp lệ, vui lòng nói lại");
            return;
        }

        const formData = new FormData();
        formData.append("audio", audioBlob, "speech.webm");
        formData.append("lessonItemId", word || "");
        formData.append("type", "custom_word");
        formData.append("feedbackMode", ttsSettings.feedbackMode || "friendly");

        setEvaluating(true);
        try {
            const res = await api.post('/api/lessons/evaluate-speaking-audio', formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            const evInfo = res.data;
            setScore(evInfo.overall_score);
            setPronunciation(evInfo.pronunciation || 0);
            setFluency(evInfo.fluency || 0);
            // Sometimes it's called completion or completeness depending on backend
            setCompletion(evInfo.completion || evInfo.completeness || 0);
            setSpokenText(evInfo.spokenText || null);
            setWrongWords(evInfo.wrongWords || []);

            if (evInfo.overall_score >= 80 && !completed) {
                const completeRes = await api.post('/api/users/wrong-words/complete', { word });
                toast.success(`Chính xác! +${completeRes.data.expAdded} EXP`);
                setCompleted(true);
            } else if (evInfo.overall_score < 80) {
                toast.error("Điểm chưa đạt (Cần 80+), hãy thử lại nhé!");
            }
        } catch (error: any) {
            toast.error("Có lỗi chấm điểm!");
        } finally {
            setEvaluating(false);
        }
    };

    const { isRecording, startRecording, stopRecording, analyser } = useAudioRecorder({
        onStop: handleEvaluation
    });

    const handleRetry = () => {
        setScore(null);
        setPronunciation(0);
        setFluency(0);
        setCompletion(0);
        setSpokenText(null);
        setWrongWords([]);
    };

    const handleNext = () => {
        navigate(-1);
    };

    if (!word) return null;

    // Helper to render sentence with highlighted wrong words
    const renderSentence = () => {
        if (score === null && wrongWords.length === 0) {
            return <span className="text-black">{word}</span>;
        }

        const words = word.split(' ');
        return words.map((w, i) => {
            const isWrong = wrongWords.find(w2 => w2.toLowerCase().replace(/[^a-z0-9]/g, '') === w.toLowerCase().replace(/[^a-z0-9]/g, ''));
            return (
                <span key={i} className={isWrong ? "text-red-500 mr-2" : "text-green-500 mr-2"}>
                    {w}
                </span>
            );
        });
    };

    return (
        <div className="flex flex-col items-center py-8 space-y-1">

            {/* Header */}
            <div className="w-full max-w-4xl flex items-center gap-3 px-4">
                <ArrowLeft className="cursor-pointer" onClick={() => navigate(-1)} />

                <div>
                    <p className="text-xs text-green-600 font-semibold tracking-wider uppercase">
                        Sửa Lỗi Phát Âm
                    </p>

                    <h1 className="text-xl font-bold">
                        Luyện Tập Từ Sai
                    </h1>
                </div>
            </div>

            {/* Sentence */}
            <div className="text-center max-w-3xl px-4 mt-8">

                <h2 className="text-4xl font-bold leading-snug">
                    {renderSentence()}
                </h2>

                {/* Actions */}
                <div className="flex justify-center gap-4 mt-5">

                    <button
                        onClick={() => playTTS(word, 1.0)}
                        className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition"
                    >
                        <Volume2 size={18} className="text-green-600" />
                    </button>

                    <button
                        onClick={() => playTTS(word, 0.5)}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                    >
                        <Turtle size={18} />
                    </button>

                </div>
            </div>

            {/* Avatar + Wave (Visualizer) */}
            <div className="flex items-center justify-center gap-4 md:gap-6 mt-8 w-full max-w-sm px-4 h-24 mx-auto">
                <AvatarSection />

                {evaluating ? (
                    <div className="flex items-center justify-center text-sm text-gray-400 font-medium h-24 w-[160px]">
                        Đang chấm điểm...
                    </div>
                ) : (
                    <div className="w-[160px] h-20 flex items-center justify-start">
                        <WaveVisualizer isActive={isRecording} analyser={analyser} />
                    </div>
                )}
            </div>

            {/* Speak, Processing or Score */}
            <div className="flex flex-col items-center gap-3 mt-8 min-h-[120px] justify-center w-full">
                {evaluating ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-green-500" size={40} />
                        <p className="text-sm text-gray-500">Đang phân tích giọng nói...</p>
                    </div>
                ) : score !== null ? (
                    <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 w-full px-4">
                        <ScoreSection 
                            score={score} 
                            pronunciation={pronunciation}
                            fluency={fluency}
                            completion={completion}
                            wrongWords={wrongWords}
                            expectedText={word}
                            spokenText={spokenText || ''}
                        />
                    </div>
                ) : (
                    <>
                        <p className="text-xs text-green-600 tracking-wider">
                            {isRecording ? "ĐANG THU ÂM (thả để chấm điểm)" : "HOLD TO SPEAK"}
                        </p>

                        <button
                            onMouseDown={startRecording}
                            onTouchStart={startRecording}
                            onMouseUp={stopRecording}
                            onTouchEnd={stopRecording}
                            onMouseLeave={stopRecording}
                            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${isRecording ? 'bg-red-500 scale-110 animate-pulse' : 'bg-green-500 hover:scale-105'}`}
                        >
                            <Mic size={28} className="text-white" />
                        </button>
                    </>
                )}
            </div>

            {/* Footer buttons */}
            <div className="flex items-center gap-5 mt-8 border-t pt-6 w-full max-w-md justify-center">
                <button
                    onClick={handleRetry}
                    disabled={isRecording || evaluating || score === null}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 transition"
                >
                    <RotateCcw size={18} />
                </button>

                <button
                    onClick={handleNext}
                    disabled={isRecording || evaluating}
                    className="px-6 py-2 bg-green-500 text-white rounded-full flex items-center gap-2 hover:bg-green-600 disabled:opacity-50 transition font-medium shadow-md"
                >
                    Hoàn Thành
                </button>
            </div>
        </div>
    );
}
