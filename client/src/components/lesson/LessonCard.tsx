import { useNavigate } from "react-router-dom";
import { Coffee, CheckCircle, Clock } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface LessonCardType {
    id: string;
    time: string;
    title: string;
    desc: string;
    level: string;
    color?: string;
    iconName?: string;
    isCompleted?: boolean;
}

export default function LessonCard({ lesson }: { lesson: LessonCardType }) {
    const navigate = useNavigate();
    // Dynamic Icon Selection
    const IconComponent = (LucideIcons as any)[lesson.iconName || ''] || Coffee;

    // Color Mapping
    const colorClasses: Record<string, string> = {
        orange: "bg-orange-50 text-orange-500 border-orange-100",
        blue: "bg-blue-50 text-blue-500 border-blue-100",
        green: "bg-green-50 text-green-500 border-green-100",
        purple: "bg-purple-50 text-purple-500 border-purple-100",
        indigo: "bg-indigo-50 text-indigo-500 border-indigo-100",
    };

    const selectedColor = colorClasses[lesson.color || 'green'];

    // Difficulty Color Mapping
    const difficultyColorClasses: Record<string, string> = {
        'CƠ BẢN': "bg-green-500",
        'TRUNG CẤP': "bg-yellow-500",
        'NÂNG CAO': "bg-red-500",
    };

    const difficultyDotColor = difficultyColorClasses[lesson.level as any] || "bg-gray-400";

    return (
        <div className="group relative bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[2rem] p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-green-100/50 dark:hover:shadow-green-900/20 hover:-translate-y-2 overflow-hidden flex flex-col h-[350px]">
            {/* Background Decoration */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-5 transition-transform duration-500 group-hover:scale-150 ${selectedColor}`} />

            {/* Header: Icon & Time */}
            <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-12 shadow-sm ${selectedColor}`}>
                    <IconComponent size={24} />
                </div>

                <div className="flex flex-col items-end gap-2">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold bg-green-50 text-green-600 px-3 py-1.5 rounded-full uppercase tracking-wider">
                        <Clock size={10} />
                        {lesson.time}
                    </span>
                    {lesson.isCompleted && (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500 text-white px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm animate-in slide-in-from-right-4 duration-500">
                            <CheckCircle size={10} />
                            Đã học
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    {lesson.title}
                </h3>

                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed h-10">
                    {lesson.desc}
                </p>

                <div className="flex items-center gap-2 pt-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${difficultyDotColor}`} />
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        {lesson.level}
                    </span>
                </div>
            </div>

            {/* Action Area - Pushed to bottom */}
            <div className="mt-auto pt-6">
                <button 
                  onClick={() => navigate(`/speaking-practice/${lesson.id}`)}
                  className="w-full bg-gray-900 dark:bg-slate-700 dark:hover:bg-green-500 text-white rounded-2xl py-4 font-bold text-sm transition-all duration-300 hover:bg-green-500 hover:shadow-xl hover:shadow-green-200 dark:hover:shadow-green-800 active:scale-95 flex items-center justify-center gap-2"
                >
                    {lesson.isCompleted ? "Học lại" : "Bắt đầu ngay"}
                    <LucideIcons.ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
}
