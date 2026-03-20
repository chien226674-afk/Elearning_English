import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Mic, Bot, User, Star, Lightbulb, CheckCircle2, RotateCcw, Trophy, Check } from "lucide-react";
import WaveVisualizer from "../components/speaking/WaveVisualizer";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { useAuth } from "../context/AuthContext";
import api from "../lib/axios";
import { toast } from "sonner";

// --- Types ---
interface Message {
    role: "ai" | "user";
    content: string;
    correction?: string | null;
    suggestion?: string | null;
}

type ChatState = "config" | "idle" | "listening" | "thinking" | "speaking" | "evaluation";

// --- Data Mapping ---
const ROLE_SCENARIOS: Record<string, { value: string; label: string }[]> = {
    Teacher: [
        { value: "Correcting Mistakes", label: "Sửa lỗi tiếng Anh cơ bản" },
        { value: "IELTS Speaking Part 1", label: "Luyện tập IELTS Speaking Part 1" },
        { value: "Debating a Topic", label: "Thảo luận về một chủ đề xã hội" },
    ],
    Friend: [
        { value: "Casual Talk", label: "Trò chuyện phiếm hàng ngày" },
        { value: "Weekend Plans", label: "Bàn về kế hoạch cuối tuần" },
        { value: "Movie/Book Gossip", label: "Bàn luận chung về phim/sách" },
    ],
    Interviewer: [
        { value: "Job Interview", label: "Phỏng vấn xin việc" },
        { value: "University Admission", label: "Phỏng vấn vào trường đại học" },
    ],
    "Customer Service": [
        { value: "Restaurant", label: "Gọi món tại nhà hàng / Quán cà phê" },
        { value: "Product Return", label: "Yêu cầu đổi trả sản phẩm" },
        { value: "Hotel Check-in", label: "Nhận/Trả phòng khách sạn" },
        { value: "Booking a Ticket", label: "Hỗ trợ đặt vé bay/tàu xe" },
    ],
    "Tour Guide": [
        { value: "Asking for Directions", label: "Hỏi đường đi/địa điểm" },
        { value: "City Tour", label: "Giới thiệu các điểm tham quan" },
        { value: "Local Food", label: "Hỏi về văn hóa/đặc sản địa phương" },
    ],
    Colleague: [
        { value: "Problem at Work", label: "Thảo luận giải quyết công việc" },
        { value: "Coffee Break", label: "Trò chuyện giờ nghỉ giải lao" },
        { value: "Project Update", label: "Báo cáo tiến độ dự án" },
    ],
    Stranger: [
        { value: "Greeting at the Park", label: "Chào hỏi tại công viên/đường phố" },
        { value: "Asking for Time", label: "Hỏi giờ/thông tin chung" },
        { value: "Small Talk on a Bus", label: "Trò chuyện trên các phương tiện công cộng" },
    ],
    Doctor: [
        { value: "Hospital", label: "Khám bệnh / Mô tả lời triệu chứng" },
        { value: "Pharmacy", label: "Hỏi mua thuốc tại nhà thuốc" },
        { value: "Health Advice", label: "Xin tư vấn sức khỏe tổng quát" },
    ]
};

export default function AiConversationPractice() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Configuration
    const [selectedRole, setSelectedRole] = useState("Friend");
    const [selectedScenario, setSelectedScenario] = useState("Casual Talk");

    // Update scenario when role changes
    useEffect(() => {
        const scenarios = ROLE_SCENARIOS[selectedRole];
        if (scenarios && scenarios.length > 0) {
            setSelectedScenario(scenarios[0].value);
        }
    }, [selectedRole]);

    // Chat State
    const [chatState, setChatState] = useState<ChatState>("config");
    const chatStateRef = useRef<ChatState>("config");
    useEffect(() => { chatStateRef.current = chatState; }, [chatState]);
    const sessionRef = useRef(0); // For identifying ghost timers
    const [history, setHistory] = useState<Message[]>([]);
    const historyRef = useRef<Message[]>([]);

    // Global Session Timer
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const sessionIntervalRef = useRef<number | null>(null);
    const ignoreOnStop = useRef(false);
    const consecutiveSilencesRef = useRef(0);

    const [evalResults, setEvalResults] = useState<any>(null);
    const [currentHint, setCurrentHint] = useState<string | null>(null);
    const nextHintsRef = useRef<string[]>([]);

    // AI Configuration Settings
    const [ttsSettings, setTtsSettings] = useState({ accent: "US", audioSpeed: 1, feedbackMode: "friendly" });

    // Silence detection for long pauses (different from VAD stopping speech)
    const silenceIntervalRef = useRef<number | null>(null);

    // Audio Refs
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Fetch user settings and avatar
    useEffect(() => {
        api.get('/api/users/settings').then(res => {
            if (res.data) setTtsSettings(prev => ({ ...prev, ...res.data }));
        }).catch(console.error);

        return () => {
            if (currentAudioRef.current) currentAudioRef.current.pause();
        };
    }, []);

    // Session Timeout Effect
    useEffect(() => {
        if (elapsedSeconds >= 180 && chatState !== "evaluation" && chatState !== "idle" && chatState !== "config") {
            toast.error("Đã hết thời gian 3 phút! Tự động kết thúc.");
            handleEndSession();
        }
    }, [elapsedSeconds, chatState]);

    // --- Audio Playback ---
    const playTTS = async (text: string, onEndedCallback?: () => void) => {
        try {
            setChatState("speaking");

            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
            }

            const ttsRes = await api.post('/api/lessons/tts/english', { text, speed: ttsSettings.audioSpeed }, { responseType: 'blob' });
            const audioUrl = URL.createObjectURL(ttsRes.data);
            const audio = new Audio(audioUrl);
            currentAudioRef.current = audio;

            audio.play().catch(e => console.error("Audio playback prevented:", e));

            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                if (onEndedCallback) onEndedCallback();
            };
        } catch (error) {
            console.error('TTS Error', error);
            // Fallback to Web Speech API
            if (window.speechSynthesis) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = ttsSettings.accent === 'UK' ? 'en-GB' : 'en-US';
                utterance.onend = () => { if (onEndedCallback) onEndedCallback(); };
                window.speechSynthesis.speak(utterance);
            } else {
                if (onEndedCallback) onEndedCallback();
            }
        }
    };

    // --- Audio Recording (VAD) ---
    const handleSilenceStop = async (audioBlob: Blob) => {
        // Called when user finishes speaking or VAD triggers a stop
        if (ignoreOnStop.current) {
            ignoreOnStop.current = false;
            clearSilenceTimers();
            return;
        }
        if (chatState !== "listening") return; // Prevent double trigger

        // If it's a very small blob (likely empty/noise), just ignore the silence logic
        // Extreme inclusive guard (100 bytes) to ensure every sound fragment is sent
        if (audioBlob.size < 100) {
            startRecording();
            return;
        }

        clearSilenceTimers();

        // If user actually spoke significantly, reset the consecutive silences
        // Lowered reset threshold to 3000 to catch short but meaningful sentences
        if (audioBlob.size > 3000) {
            consecutiveSilencesRef.current = 0;
        }

        await sendUserAudio(audioBlob);
    };

    const { isRecording, startRecording, stopRecording, analyser } = useAudioRecorder({
        onStop: handleSilenceStop,
        silenceTimeoutMs: 1500,
        silenceThreshold: 10,
        stopOnSilenceOnlyIfSpoken: false,
        disableSilenceDetection: true // MANUAL MODE: User holds to talk
    });
    const isRecordingRef = useRef(false);
    useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

    const triggerListening = () => {
        setChatState("listening");
        startSilenceTimers(sessionRef.current);
    };

    // --- Timers (Silence without speaking) ---
    const handleSilenceTick = async (seconds: number, sid: number) => {
        if (sid !== sessionRef.current) return; // Ignore if this timer belongs to an old session
        if (chatStateRef.current !== "listening") return;

        if (consecutiveSilencesRef.current === 0) {
            // Round 1: No previous re-engagement
            if (seconds === 5) {
                const currentHints = nextHintsRef.current;
                const hint = currentHints.length > 0
                    ? `Thử nói: "${currentHints[Math.floor(Math.random() * currentHints.length)]}"`
                    : "Gợi ý: 'Bạn hãy thử bắt đầu câu với I think...'";
                setCurrentHint(hint);
            } else if (seconds === 10 && !isRecordingRef.current) {
                // AI takes initiative
                clearSilenceTimers();
                setCurrentHint(null);
                consecutiveSilencesRef.current = 1;
                ignoreOnStop.current = true;
                await sendUserAudio(null);
            }
        } else {
            // Round 2: After AI already re-engaged
            if (seconds === 5) {
                // Terminal timeout at 15s total (10s first turn + 5s second turn)
                clearSilenceTimers();
                handleEndSession();
            }
        }
    };

    const startSilenceTimers = (sid: number) => {
        clearSilenceTimers();
        let seconds = 0;

        silenceIntervalRef.current = window.setInterval(() => {
            seconds += 1;
            handleSilenceTick(seconds, sid);
        }, 1000);
    };

    const clearSilenceTimers = () => {
        if (silenceIntervalRef.current) {
            clearInterval(silenceIntervalRef.current);
            silenceIntervalRef.current = null;
        }
    };

    const handlePressStart = () => {
        if (chatState !== "listening") return;
        setCurrentHint(null);
        startRecording();
    };

    const handlePressEnd = () => {
        if (isRecording) {
            stopRecording();
        }
    };

    const handleStart = async () => {
        setChatState("thinking");
        setHistory([]);
        setElapsedSeconds(0);

        if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
        sessionIntervalRef.current = window.setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);

        try {
            // Initialize AudioContext on user interaction
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            const res = await api.post('/api/lessons/conversation/init', { role: selectedRole, scenario: selectedScenario });
            const aiText = res.data.aiText;
            const initialHints = res.data.hints || [];

            nextHintsRef.current = initialHints;

            const initialHistory: Message[] = [{ role: "ai", content: aiText }];
            setHistory(initialHistory);
            historyRef.current = initialHistory;

            // Play TTS, then start listening
            playTTS(aiText, () => {
                triggerListening(); // Start mic and timers immediately after TTS finishes
            });
        } catch (error) {
            console.error("Failed to init conversation:", error);
            toast.error("Lỗi khi khởi tạo cuộc trò chuyện.");
            setChatState("config");
        }
    };

    const sendUserAudio = async (blob: Blob | null) => {
        // Guard: If we are not in a state to accept audio (e.g. session ended/reset), ignore
        if (chatStateRef.current !== "listening" && chatStateRef.current !== "thinking") return;

        setChatState("thinking");
        setCurrentHint(null);
        const formData = new FormData();

        // Only ignore if blob EXISTS but is too small (noise)
        if (blob && (blob.size < 1000)) {
            console.log("Audio too short, skipping server request");
            setChatState("listening");
            triggerListening();
            return;
        }

        if (blob && blob.size >= 1000) {
            formData.append("audio", blob, "speech.webm");
        }

        formData.append("role", selectedRole);
        formData.append("scenario", selectedScenario);
        formData.append("history", JSON.stringify(historyRef.current));

        try {
            const res = await api.post('/api/lessons/conversation/chat', formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            const { userText, aiText, correction, suggestion, hints } = res.data;

            // If the server actually transcribed something, we are definitely NOT silent
            if (userText && userText.length > 5 && !userText.includes("...")) {
                consecutiveSilencesRef.current = 0;
            }

            // Sync hints for next turn

            const newHistory = [...historyRef.current];

            // Add user message
            if (userText && userText.trim() !== "" && userText !== "...") {
                newHistory.push({
                    role: "user",
                    content: userText,
                    correction,
                    suggestion
                });
            }

            // Add AI message
            newHistory.push({
                role: "ai",
                content: aiText
            });

            setHistory(newHistory);
            historyRef.current = newHistory;

            // Sync hints for next turn IMMEDIATELY
            if (hints && hints.length > 0) {
                nextHintsRef.current = hints;
            } else {
                const fallback = ["Tell me more about it.", "What do you think?", "Could you explain further?"];
                nextHintsRef.current = fallback;
            }

            // Set the next hint based on AI's suggestion if it's relevant
            if (suggestion) {
                // If the suggestion is about a correction, it might not be a good conversation hint
                // But let's store it anyway for now
            }

            playTTS(aiText, () => {
                triggerListening();
            });

        } catch (error: any) {
            console.error("Failed to send chat", error);
            const detailMsg = error.response?.data?.details || error.message || "";
            toast.error(`Lỗi trò chuyện: ${detailMsg || "Vui lòng thử lại"}`);
            triggerListening(); // Return to listening mode on error so they can retry
        }
    };

    const handleEndSession = async () => {
        clearSilenceTimers();
        if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
        ignoreOnStop.current = true;
        if (isRecording) stopRecording();
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
        }
        if (window.speechSynthesis) window.speechSynthesis.cancel();

        setChatState("evaluation");

        try {
            const res = await api.post('/api/lessons/conversation/evaluate', {
                history: JSON.stringify(historyRef.current)
            });

            setEvalResults(res.data);
            if (res.data.expEarned > 0) toast.success(`Hoàn thành! Bạn được +${res.data.expEarned} EXP`);
        } catch (error) {
            console.error("Evaluate error", error);
            toast.error("Lỗi khi đánh giá cuộc trò chuyện.");
            setChatState("idle"); // Fallback
        }
    };

    // Just leave without scoring (back arrow)
    const handleLeaveWithoutEval = () => {
        clearSilenceTimers();
        if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
        ignoreOnStop.current = true;
        if (isRecording) stopRecording();
        if (currentAudioRef.current) currentAudioRef.current.pause();
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        navigate(-1);
    };

    const handleRetry = () => {
        clearSilenceTimers();
        if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
        sessionIntervalRef.current = null;
        ignoreOnStop.current = true;

        if (isRecording) stopRecording();
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
        }
        if (window.speechSynthesis) window.speechSynthesis.cancel();

        setHistory([]);
        historyRef.current = [];
        setElapsedSeconds(0);
        setEvalResults(null);
        consecutiveSilencesRef.current = 0;
        sessionRef.current += 1; // Mark old sessions as dead
        setChatState("config");
    };

    // Cleanup
    useEffect(() => {
        return () => {
            clearSilenceTimers();
            if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
            if (isRecording) stopRecording();
            if (currentAudioRef.current) currentAudioRef.current.pause();
            if (window.speechSynthesis) window.speechSynthesis.cancel();
        };
    }, []);

    // --- Render Views ---

    if (chatState === "config") {
        return (
            <div className="h-[calc(100vh-65px)] bg-[#f8f9fa] dark:bg-slate-900 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-3xl shadow-md p-8 mb-10 border dark:border-slate-700">
                    <div className="flex items-center gap-4 mb-8">
                        <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition">
                            <ArrowLeft size={20} className="dark:text-gray-300" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Cấu hình Hội Thoại</h1>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Vai diễn của AI</label>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full border border-gray-300 dark:border-slate-600 rounded-2xl p-4 bg-gray-50 dark:bg-slate-700 dark:text-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/20 transition-all outline-none"
                            >
                                <option value="Teacher">Giáo Viên (Sửa lỗi chi tiết)</option>
                                <option value="Friend">Bạn Bè (Thoải mái, vui vẻ)</option>
                                <option value="Interviewer">Nhà Tuyển Dụng (Chuyên nghiệp)</option>
                                <option value="Customer Service">Chăm Sóc Khách Hàng (Lịch sự, hỗ trợ)</option>
                                <option value="Tour Guide">Hướng Dẫn Viên (Nhiệt tình, am hiểu)</option>
                                <option value="Colleague">Đồng Nghiệp (Nơi công sở)</option>
                                <option value="Stranger">Người Lạ Mới Quen (Xã giao, lịch sự)</option>
                                <option value="Doctor">Bác Sĩ (Ân cần, hỏi thăm sức khỏe)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tình huống (Scenario)</label>
                            <select
                                value={selectedScenario}
                                onChange={(e) => setSelectedScenario(e.target.value)}
                                className="w-full border border-gray-300 dark:border-slate-600 rounded-2xl p-4 bg-gray-50 dark:bg-slate-700 dark:text-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/20 transition-all outline-none"
                            >
                                {ROLE_SCENARIOS[selectedRole]?.map((scenario) => (
                                    <option key={scenario.value} value={scenario.value}>
                                        {scenario.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-2xl text-sm leading-relaxed border dark:border-blue-800/30">
                            <strong>💡 Mẹo:</strong> Giữ phím <strong>Mic</strong> (hoặc đè chuột/tay) để nói. AI sẽ tự động trả lời khi bạn nhả tay ra.
                        </div>

                        <button
                            onClick={handleStart}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold text-lg py-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 mt-4"
                        >
                            Bắt đầu nói chuyện
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (chatState === "evaluation") {
        return (
            <div className="fixed inset-0 z-[100] overflow-y-auto p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md">
                <div className="flex min-h-full items-center justify-center py-8">
                    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[2rem] w-full max-w-lg p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-black/50 relative border border-white/40 dark:border-slate-700 animate-in zoom-in-95 duration-500">
                        {/* Decorative Background Elements */}
                        <div className="absolute -top-12 -left-12 w-32 h-32 bg-green-200/20 rounded-full blur-2xl -z-10" />
                        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-200/20 rounded-full blur-2xl -z-10" />

                        {!evalResults ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="relative">
                                    <Loader2 className="animate-spin text-green-500" size={64} />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Star className="text-green-500 animate-pulse" size={24} />
                                    </div>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 font-bold text-xl mt-8">Đang tổng hợp đánh giá...</p>
                                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2 font-medium">AI đang phân tích cuộc hội thoại của bạn</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Header Section */}
                                <div className="text-center animate-in slide-in-from-top-4 duration-700">
                                    <div className="inline-flex items-center gap-1.5 bg-green-100/80 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-[10px] font-extrabold shadow-sm mb-3">
                                        <Trophy size={14} />
                                        <span>PRACTICE COMPLETE</span>
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                        Kết quả luyện tập
                                    </h2>
                                    <p className="text-slate-500 dark:text-gray-400 mt-1 font-medium text-sm leading-relaxed px-2">
                                        {evalResults.overallScore >= 80 ? "Tuyệt vời! Bạn hoàn thành xuất sắc" :
                                            evalResults.overallScore >= 50 ? "Khá tốt! Bạn đã hoàn thành" :
                                                "Cố gắng lên nhé! Bạn đã hoàn thành"} bài luyện tập {selectedRole}.
                                    </p>
                                </div>

                                {/* Score Circle - Centered & Premium */}
                                <div className="flex justify-center animate-in fade-in zoom-in duration-1000 delay-300">
                                    <div className="relative group">
                                        <div className="relative w-28 h-28 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.06)] border-[6px] border-gray-50 dark:border-slate-700">
                                            {/* Progress SVG */}
                                            <svg className="absolute inset-0 w-full h-full -rotate-90 p-1">
                                                <circle
                                                    cx="50%"
                                                    cy="50%"
                                                    r="45%"
                                                    className="fill-none stroke-gray-100 dark:stroke-slate-700 stroke-[5px]"
                                                />
                                                <circle
                                                    cx="50%"
                                                    cy="50%"
                                                    r="45%"
                                                    className="fill-none stroke-green-500 stroke-[5px] transition-all duration-1000 ease-out"
                                                    strokeDasharray="282"
                                                    strokeDashoffset={282 - (282 * evalResults.overallScore) / 100}
                                                    strokeLinecap="round"
                                                />
                                            </svg>

                                            <div className="text-center">
                                                <span className="block text-3xl font-black text-slate-800 dark:text-white leading-none">
                                                    {evalResults.overallScore}
                                                </span>
                                                <span className="text-[9px] font-extrabold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1 block">Score</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Feedback Cards */}
                                <div className="grid grid-cols-1 gap-3 animate-in slide-in-from-bottom-6 duration-1000 delay-500">
                                    {/* Strengths */}
                                    <div className="group bg-green-50/50 dark:bg-green-900/10 hover:bg-green-50 dark:hover:bg-green-900/20 border border-green-100/80 dark:border-green-800/30 rounded-[1.25rem] p-3 shadow-sm transition-all hover:shadow-md flex gap-3">
                                        <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm text-green-500 shrink-0 group-hover:scale-110 transition-transform">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-extrabold text-slate-800 dark:text-white text-[12px] mb-0.5">Điểm mạnh</h4>
                                            <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-tight font-medium">
                                                {evalResults.strengths}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Weaknesses */}
                                    <div className="group bg-orange-50/50 dark:bg-orange-900/10 hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-orange-100/80 dark:border-orange-800/30 rounded-[1.25rem] p-3 shadow-sm transition-all hover:shadow-md flex gap-3">
                                        <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm text-orange-500 shrink-0 group-hover:scale-110 transition-transform">
                                            <Bot size={16} className="opacity-70" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-extrabold text-slate-800 dark:text-white text-[12px] mb-0.5">Cần cải thiện</h4>
                                            <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-tight font-medium">
                                                {evalResults.weaknesses}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Tips */}
                                    <div className="group bg-blue-50/60 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-100/80 dark:border-blue-800/30 rounded-[1.25rem] p-3 shadow-sm transition-all hover:shadow-md flex gap-3">
                                        <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm text-blue-500 shrink-0 group-hover:scale-110 transition-transform">
                                            <Lightbulb size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-extrabold text-slate-800 dark:text-white text-[12px] mb-0.5">Lời khuyên</h4>
                                            <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-tight font-medium">
                                                {evalResults.tips}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 mt-4 pt-1 animate-in fade-in duration-1000 delay-700">
                                    <button
                                        onClick={handleRetry}
                                        className="flex-1 py-3 rounded-2xl border border-gray-100 dark:border-slate-700 text-gray-500 dark:text-gray-400 font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-white transition-all hover:border-gray-200 dark:hover:border-slate-600"
                                    >
                                        <RotateCcw size={14} />
                                        Làm lại
                                    </button>

                                    <button
                                        onClick={() => navigate('/practice')}
                                        className="flex-[1.2] py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-[11px] uppercase tracking-wider hover:opacity-90 shadow-sm flex items-center justify-center gap-1.5"
                                    >
                                        Hoàn thành <Check size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-65px)] bg-gray-50 dark:bg-slate-900 overflow-hidden relative">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button onClick={handleLeaveWithoutEval} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="font-bold text-lg text-gray-800 dark:text-white">Trò chuyện với AI</h2>
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-green-600 dark:text-green-400 tracking-wider uppercase">{selectedRole} • {selectedScenario}</p>
                            <span className="text-xs text-gray-400 dark:text-gray-600">|</span>
                            <span className={`text-xs font-mono font-bold ${elapsedSeconds > 150 ? 'text-red-500 animate-pulse' : 'text-gray-500 dark:text-gray-400'}`}>
                                {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')} / 3:00
                            </span>
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <button
                        onClick={elapsedSeconds >= 60 ? handleEndSession : undefined}
                        disabled={elapsedSeconds < 60}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition ${elapsedSeconds >= 60
                            ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            }`}
                        title={elapsedSeconds < 60 ? `Cần ít nhất 1 phút để kết thúc (còn ${60 - elapsedSeconds}s)` : 'Kết thúc và chấm điểm'}
                    >
                        {elapsedSeconds < 60
                            ? `Kết thúc (${60 - elapsedSeconds}s)`
                            : 'Kết thúc'
                        }
                    </button>
                </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                {history.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] md:max-w-[70%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

                            {/* The Message Bubble */}
                            <div className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-10 h-10 rounded-full overflow-hidden flex shrink-0 items-center justify-center ${msg.role === 'user' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600'} shadow-sm`}>
                                    {msg.role === 'user' ? (
                                        user?.avatar ? <img src={user.avatar} alt="User" className="w-full h-full object-cover" /> : <User size={20} className="text-blue-600 dark:text-blue-400" />
                                    ) : (
                                        <img src="/favicon.png" alt="AI Robot" className="w-7 h-7 object-contain" />
                                    )}
                                </div>

                                <div className={`p-4 rounded-2xl shadow-sm text-[15px] leading-relaxed ${msg.role === 'user'
                                    ? 'bg-blue-500 text-white rounded-br-sm'
                                    : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>

                            {/* Grammar Correction Panel (Only for User) */}
                            {msg.role === 'user' && (msg.correction || msg.suggestion) && (
                                <div className="mt-2 text-sm bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 text-orange-800 dark:text-orange-300 p-3 rounded-2xl rounded-tr-sm max-w-[90%] self-end shadow-sm">
                                    {msg.correction && (
                                        <p className="mb-1"><span className="font-bold">📝 Nên nói:</span> {msg.correction}</p>
                                    )}
                                    {msg.suggestion && (
                                        <p className="text-[13px] opacity-90">{msg.suggestion}</p>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Status & Visualizer Panel */}
            <div className="bg-white dark:bg-slate-800 border-t dark:border-slate-700 rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-black/20 p-6 shrink-0 relative flex flex-col items-center">

                {/* Main Hold-to-Talk Button & Status Area */}
                <div className="flex flex-col items-center w-full gap-4">

                    {/* Status Pill */}
                    {chatState === "thinking" ? (
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-semibold bg-gray-50 dark:bg-slate-700 px-6 py-2 rounded-full border dark:border-slate-600 shadow-sm animate-pulse">
                            <Loader2 className="animate-spin" size={18} /> AI đang suy nghĩ...
                        </div>
                    ) : chatState === "speaking" ? (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/20 px-6 py-2 rounded-full border border-green-100 dark:border-green-800/30 shadow-sm">
                            <Bot className="animate-pulse" size={18} /> AI đang trả lời...
                        </div>
                    ) : (
                        currentHint && (
                            <div className="text-orange-600 dark:text-orange-400 text-sm font-medium bg-orange-50 dark:bg-orange-900/20 px-5 py-2 rounded-2xl border border-orange-100 dark:border-orange-800/30 animate-in fade-in slide-in-from-top-2">
                                💡 {currentHint}
                            </div>
                        )
                    )}

                    {/* The Button */}
                    <div className="flex flex-col items-center">
                        <p className={`text-xs font-bold mb-3 transition-colors ${isRecording ? 'text-red-500 animate-pulse' :
                            chatState === "listening" ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                            }`}>
                            {isRecording ? "ĐANG THU ÂM (thả để gửi)" :
                                chatState === "listening" ? "HOLD TO SPEAK" : "ĐANG XỬ LÝ..."}
                        </p>

                        <button
                            onMouseDown={handlePressStart}
                            onMouseUp={handlePressEnd}
                            onMouseLeave={handlePressEnd}
                            onTouchStart={(e) => { e.preventDefault(); handlePressStart(); }}
                            onTouchEnd={(e) => { e.preventDefault(); handlePressEnd(); }}
                            disabled={chatState !== "listening"}
                            className={`relative w-22 h-22 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${isRecording
                                ? 'bg-red-500 scale-110 ring-[8px] ring-red-100 dark:ring-red-900/30 animate-pulse'
                                : chatState === "listening"
                                    ? 'bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 hover:scale-110 shadow-green-200 dark:shadow-none'
                                    : 'bg-gray-200 dark:bg-slate-700 cursor-not-allowed text-gray-400'
                                }`}
                        >
                            <Mic size={36} className={`text-white ${isRecording ? 'animate-bounce' : ''}`} />
                        </button>

                        <div className="mt-4 w-60 h-10 flex items-center justify-center">
                            <WaveVisualizer
                                isActive={isRecording || chatState === "speaking"}
                                analyser={analyser}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
