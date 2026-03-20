import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Volume2, Turtle, Mic, RotateCcw, Loader2 } from "lucide-react";
import AvatarSection from "../components/speaking/AvatarSection";
import WaveVisualizer from "../components/speaking/WaveVisualizer";
import ScoreSection from "../components/speaking/ScoreSection";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import api from "../lib/axios";
import { toast } from "sonner";

interface PracticeItem {
    id: string;
    english: string;
    vietnamese: string;
    order: number;
    type: 'vocab' | 'sentence';
}

export default function SpeakingPracticePage() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Data State
    const [items, setItems] = useState<PracticeItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [lessonTitle, setLessonTitle] = useState("");
    const [loading, setLoading] = useState(true);

    // Evaluation State
    const [score, setScore] = useState<number | null>(null);
    const [pronunciation, setPronunciation] = useState<number>(0);
    const [fluency, setFluency] = useState<number>(0);
    const [completion, setCompletion] = useState<number>(0);
    const [spokenText, setSpokenText] = useState<string | null>(null);
    const [wrongWords, setWrongWords] = useState<string[]>([]);
    const [evaluating, setEvaluating] = useState(false);

    // Accumulation
    const accumulatedWrongWords = useRef<string[]>([]);
    const accumulatedScores = useRef<number[]>([]);

    // Audio Settings
    const [ttsSettings, setTtsSettings] = useState({ accent: "US", audioSpeed: 1, feedbackMode: "friendly" });

    // Add voices initialization state
    const [voicesLoaded, setVoicesLoaded] = useState(false);

    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                setVoicesLoaded(true);
            }
        };
        
        loadVoices();
        window.speechSynthesis.onvoiceschanged = () => {
            loadVoices();
        };
        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        }
    }, []);

    useEffect(() => {
        const fetchLessonData = async () => {
            try {
                const settingsRes = await api.get('/api/users/settings');
                if (settingsRes.data) {
                    setTtsSettings({
                        accent: settingsRes.data.accent || "US",
                        audioSpeed: settingsRes.data.audioSpeed || 1,
                        feedbackMode: settingsRes.data.feedbackMode || "friendly",
                    });
                }

                const res = await api.get(`/api/lessons/${id}/practice-data`);
                const { vocabularies, sentences, title } = res.data;
                setItems([...vocabularies, ...sentences]);
                setLessonTitle(title || "Bài Tập Luyện Nói");
                setLoading(false);
            } catch (error: any) {
                console.error("Failed to load lesson practice data", error);
                
                // If it's 401, axios interceptor will handle redirect
                if (error.response?.status !== 401) {
                    toast.error("Không thể tải bài học");
                    navigate('/lessons');
                }
            }
        };
        fetchLessonData();
    }, [id, navigate]);

    // ===== TTS Functions (Web Speech API — miễn phí) =====
    const playTTS = (text: string, speed: number = 1.0) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speed * ttsSettings.audioSpeed;
        
        const voices = window.speechSynthesis.getVoices();
        
        // Find Google UK English Male or Google US English Male based on settings
        let selectedVoice = null;
        
        if (ttsSettings.accent === 'UK') {
            // Try Google UK English Male first
            selectedVoice = voices.find(v => 
                v.name.includes('Google UK English Male') || 
                v.name.includes('Google UK English')
            );
            // Fallback to any UK English voice
            if (!selectedVoice) {
                selectedVoice = voices.find(v => v.lang.startsWith('en-GB'));
            }
        } else {
            // US English - try Google US English Male first
            selectedVoice = voices.find(v => 
                v.name.includes('Google US English') ||
                v.name.includes('Google English Male')
            );
            // Fallback to any US English voice
            if (!selectedVoice) {
                selectedVoice = voices.find(v => v.lang.startsWith('en-US'));
            }
        }
        
        // Final fallback to any English voice
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang.startsWith('en'));
        }
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log('[TTS] Using voice:', selectedVoice.name);
        }
        
        window.speechSynthesis.speak(utterance);
    };

    const playVietnameseTTS = (text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = 1.0;
        
        const voices = window.speechSynthesis.getVoices();
        
        // Try to find Google Vietnamese voice
        const viVoice = voices.find(v => 
            v.name.includes('Google Vietnamese') || 
            v.lang.startsWith('vi')
        );
        
        if (viVoice) {
            utterance.voice = viVoice;
            console.log('[TTS] Using Vietnamese voice:', viVoice.name);
        }
        
        window.speechSynthesis.speak(utterance);
    };

    // Auto-play TTS when entering a new question
    useEffect(() => {
        if (!loading && items.length > 0 && voicesLoaded) {
            const timer = setTimeout(() => {
                playTTS(items[currentIndex].english, 1.0);
            }, currentIndex === 0 ? 800 : 300);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, items, loading, voicesLoaded]);

    // ===== Evaluation Handler =====
    const handleEvaluation = async (audioBlob: Blob) => {
        if (evaluating) return;

        if (!audioBlob || audioBlob.size === 0) {
            toast.error("Âm thanh quá ngắn hoặc không có, vui lòng nói lại");
            return;
        }

        const currentItem = items[currentIndex];
        const formData = new FormData();
        formData.append("audio", audioBlob, "speech.webm");
        formData.append("lessonItemId", currentItem.id);
        formData.append("type", currentItem.type);
        formData.append("feedbackMode", ttsSettings.feedbackMode || "friendly");

        setEvaluating(true);
        try {
            const res = await api.post('/api/lessons/evaluate-speaking-audio', formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            const { 
                overall_score, 
                pronunciation: pronScore, 
                fluency: fluScore, 
                completion: compScore,
                feedback: resultFeedback, 
                wrongWords: resultWrongWords, 
                spokenText: resultSpokenText 
            } = res.data;
            
            setScore(overall_score);
            setPronunciation(pronScore || 0);
            setFluency(fluScore || 0);
            setCompletion(compScore || 0);
            setSpokenText(resultSpokenText || null);
            setWrongWords(resultWrongWords || []);

            // Play feedback audio (Vietnamese TTS via ElevenLabs)
            if (resultFeedback && resultFeedback.trim()) {
                console.log('[Feedback] Playing feedback:', resultFeedback);
                
                try {
                    console.log('[TTS] Calling ElevenLabs TTS API...');
                    const ttsRes = await api.post('/api/lessons/tts/vietnamese', { 
                        text: resultFeedback 
                    }, {
                        responseType: 'blob'
                    });
                    
                    console.log('[TTS] Received response, status:', ttsRes.status);
                    
                    const audioUrl = URL.createObjectURL(ttsRes.data);
                    const audio = new Audio(audioUrl);
                    
                    audio.onplay = () => {
                        console.log('[TTS] Audio started playing (ElevenLabs)');
                    };
                    
                    audio.onerror = (e) => {
                        console.error('[TTS] Audio error:', e);
                        // Fallback to Web Speech API
                        playVietnameseTTS(resultFeedback);
                    };
                    
                    audio.play();
                    
                    audio.onended = () => {
                        console.log('[TTS] Audio finished playing');
                        URL.revokeObjectURL(audioUrl);
                    };
                } catch (ttsError: any) {
                    console.error('[TTS] ElevenLabs Error:', ttsError?.response?.data || ttsError.message);
                    console.log('[TTS] Falling back to Web Speech API...');
                    // Fallback to Web Speech API
                    playVietnameseTTS(resultFeedback);
                }
            }

            if (resultWrongWords && resultWrongWords.length > 0) {
                resultWrongWords.forEach((word: string) => {
                    if (!accumulatedWrongWords.current.includes(word)) {
                        accumulatedWrongWords.current.push(word);
                    }
                });
            }

            // Bỏ phản hồi bằng giọng nói - chỉ cần nói lại

        } catch (error) {
            console.error("Evaluation error", error);
            toast.error("Lỗi khi chấm điểm");
        } finally {
            setEvaluating(false);
        }
    };

    const { isRecording, startRecording, stopRecording, analyser } = useAudioRecorder({
        onStop: handleEvaluation,
        silenceTimeoutMs: 3000,
        silenceThreshold: 30
    });

    const handleNext = async () => {
        // Save score of current item before moving next
        if (score !== null) {
            accumulatedScores.current.push(score);
        }

        if (currentIndex < items.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setScore(null);
            setPronunciation(0);
            setFluency(0);
            setCompletion(0);
            setSpokenText(null);
            setWrongWords([]);
        } else {
            try {
                const completeRes = await api.post(`/api/lessons/${id}/complete-practice`, {
                    wrongWordsArray: accumulatedWrongWords.current,
                    scores: accumulatedScores.current
                });
                
                const { expEarned, newLevel } = completeRes.data;
                toast.success(`Chúc mừng! Bạn nhận được +${expEarned} EXP 🎉 ${newLevel ? `(Cấp độ: ${newLevel})` : ""}`);
                navigate('/lessons');
            } catch (error) {
                console.error("Failed to complete lesson", error);
                toast.error("Lỗi khi lưu tiến trình");
            }
        }
    };

    const handleRetry = () => {
        setScore(null);
        setPronunciation(0);
        setFluency(0);
        setCompletion(0);
        setSpokenText(null);
        setWrongWords([]);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen dark:bg-slate-900">
                <Loader2 className="animate-spin text-green-500 mb-4" size={40} />
                <p>Đang chuẩn bị bài học...</p>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen dark:bg-slate-900">
                <p>Bài học này chưa có nội dung luyện tập.</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-green-500 underline">Quay lại</button>
            </div>
        );
    }

    const currentItem = items[currentIndex];

    // Helper to render sentence with highlighted wrong words
    const renderSentence = () => {
        if (score === null && wrongWords.length === 0) {
            return <span className="text-black dark:text-white">{currentItem.english}</span>;
        }

        const words = currentItem.english.split(' ');
        return words.map((word, i) => {
            const isWrong = wrongWords.find(w => w.toLowerCase().replace(/[^a-z0-9]/g, '') === word.toLowerCase().replace(/[^a-z0-9]/g, ''));
            return (
                <span key={i} className={isWrong ? "text-red-500 mr-2" : "text-green-500 mr-2"}>
                    {word}
                </span>
            );
        });
    };

    return (
        <div className="flex flex-col items-center py-8 space-y-1 min-h-screen bg-white dark:bg-slate-900">

            {/* Header */}
            <div className="w-full max-w-4xl flex items-center gap-3 px-4">
                <ArrowLeft className="cursor-pointer dark:text-white" onClick={() => navigate(-1)} />

                <div>
                    <p className="text-xs text-green-600 font-semibold tracking-wider uppercase">
                        {currentItem.type === 'vocab' ? "Từ vựng" : "Câu giao tiếp"} {currentIndex + 1} / {items.length}
                    </p>

                    <h1 className="text-xl font-bold dark:text-white">
                        {lessonTitle}
                    </h1>
                </div>
            </div>

            {/* Sentence */}
            <div className="text-center max-w-3xl px-4 mt-8">

                <h2 className="text-4xl font-bold leading-snug">
                    {renderSentence()}
                </h2>

                <p className="text-gray-500 dark:text-gray-400 mt-3 text-lg">
                    {currentItem.vietnamese}
                </p>

                {/* Actions */}
                <div className="flex justify-center gap-4 mt-5">

                    <button
                        onClick={() => playTTS(currentItem.english, 1.0)}
                        className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition"
                    >
                        <Volume2 size={18} className="text-green-600" />
                    </button>

                    <button
                        onClick={() => playTTS(currentItem.english, 0.5)}
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-600 transition"
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
            <div className="flex flex-col items-center gap-3 mt-8 min-h-[120px] justify-center">
                {evaluating ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-green-500" size={40} />
                        <p className="text-sm text-gray-500">Đang phân tích giọng nói...</p>
                    </div>
                ) : score !== null ? (
                    <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                        <ScoreSection 
                            score={score} 
                            pronunciation={pronunciation}
                            fluency={fluency}
                            completion={completion}
                            wrongWords={wrongWords}
                            expectedText={currentItem.english}
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
            <div className="flex items-center gap-5 mt-8 border-t dark:border-slate-700 pt-6 w-full max-w-md justify-center">
                <button
                    onClick={handleRetry}
                    disabled={isRecording || evaluating || score === null}
                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 transition"
                >
                    <RotateCcw size={18} />
                </button>

                <button
                    onClick={handleNext}
                    disabled={isRecording || evaluating || score === null}
                    className="px-6 py-2 bg-green-500 dark:bg-green-600 text-white rounded-full flex items-center gap-2 hover:bg-green-600 dark:hover:bg-green-700 disabled:opacity-50 transition font-medium shadow-md dark:shadow-none"
                >
                    {currentIndex === items.length - 1 ? "Hoàn Thành" : "Tiếp theo"}
                </button>
            </div>
        </div>
    )
}