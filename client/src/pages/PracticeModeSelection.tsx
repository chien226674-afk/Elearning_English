import { Shuffle, Timer, Bot, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import hippoAvatar from "@/assets/hippo_avatar.png";
import api from "@/lib/axios";

export default function PracticeModeSelection() {
  const navigate = useNavigate();

  const handleRandomLesson = async () => {
    try {
      const res = await api.get('/api/lessons/quick-start')
      if (res.data && res.data.lessonId) {
        navigate(`/speaking-practice/${res.data.lessonId}`)
      }
    } catch (error) {
      console.error('Failed to get random lesson:', error)
      navigate('/lessons')
    }
  }

  return (
    <div className="bg-[#f8f9fa] dark:bg-slate-900 flex items-start justify-center pt-8 md:pt-12 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

        {/* Left Column: Text & Cards */}
        <div className="flex flex-col">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
            Chọn chế độ <span className="text-[#65a30d]">luyện tập</span>
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 max-w-lg">
            Chào mừng trở lại! Hôm nay bạn muốn nâng cấp kỹ năng giao tiếp của mình theo cách nào?
          </p>

          <div className="mt-8 flex flex-col gap-5">
            {/* Card 1: Random Lessons */}
            <button
              onClick={handleRandomLesson}
              className="group flex items-center gap-5 p-5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-3xl shadow-sm hover:shadow-md dark:hover:shadow-slate-700/50 transition-all text-left w-full hover:-translate-y-1"
            >
              <div className="w-16 h-16 shrink-0 bg-blue-100 text-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shuffle size={32} strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Bài học ngẫu nhiên</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  Luyện tập từ vựng và cấu trúc câu đa dạng giúp tăng phản xạ giao tiếp tự nhiên.
                </p>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-blue-500 transition-colors" />
            </button>

            {/* Card 2: Time-based Speaking */}
            <button
              onClick={() => navigate('/time-speaking')}
              className="group flex items-center gap-5 p-5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-3xl shadow-sm hover:shadow-md dark:hover:shadow-slate-700/50 transition-all text-left w-full hover:-translate-y-1"
            >
              <div className="w-16 h-16 shrink-0 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Timer size={32} strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Luyện nói theo thời gian</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  Thử thách bản thân trả lời các câu hỏi hóc búa trong giới hạn thời gian quy định.
                </p>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-amber-500 transition-colors" />
            </button>

            {/* Card 3: AI Conversation */}
            <button
              onClick={() => navigate('/practice/ai')} // Feature to be implemented
              className="group flex items-center gap-5 p-5 bg-[#f0fdf4] dark:bg-green-900/10 border-2 border-[#84cc16] dark:border-[#84cc16]/50 shadow-md rounded-3xl hover:shadow-lg transition-all text-left w-full hover:-translate-y-1"
            >
              <div className="w-16 h-16 shrink-0 bg-[#84cc16] text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bot size={32} strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Luyện hội thoại với AI</h3>
                  <span className="bg-[#84cc16] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full tracking-wider uppercase">
                    Phổ biến
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  Trò chuyện trực tiếp với AI thông minh như đang nói chuyện với người bản xứ.
                </p>
              </div>
              <ChevronRight className="text-[#84cc16] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Column: Mascot */}
        <div className="flex justify-center items-center relative mt-8 md:mt-0 xl:scale-105">
          {/* Speech Bubble */}
          <div className="absolute -top-6 md:-top-4 md:right-12 z-20 bg-white dark:bg-slate-800 px-6 py-4 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 animate-bounce">
            <p className="font-extrabold text-gray-800 dark:text-white text-lg">"Cùng luyện tập nào!"</p>
            {/* Triangle tail */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white dark:bg-slate-800 transform rotate-45 border-b border-r border-gray-100 dark:border-slate-700"></div>
          </div>

          {/* Background decoration & Mascot */}
          <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] flex items-center justify-center">
            {/* Outer dotted ring */}
            <div className="absolute inset-0 border-[3px] border-dashed border-green-200 rounded-full animate-[spin_60s_linear_infinite]"></div>

            {/* Inner solid ring */}
            <div className="absolute inset-6 border border-green-100 rounded-full bg-gradient-to-tr from-green-50 to-transparent"></div>

            {/* Large subtle glow */}
            <div className="absolute inset-10 bg-green-200 rounded-full opacity-20 blur-2xl"></div>

            {/* The Mascot */}
            <div className="relative z-10 w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden shadow-2xl bg-white border-[6px] border-white">
              <img
                src={hippoAvatar}
                alt="Hippo Mascot"
                className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
