import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, History, Coffee, Clock, CheckCircle, Loader2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";

// Persistence key for recent searches
const RECENT_KEY = "globalSearch_recent";

interface Lesson {
  ma_bai_hoc: string;
  tieu_de: string;
  mo_ta: string;
  thoi_luong_phut: number;
  do_kho: string;
  mau_the_hien_thi: string;
  ten_icon: string;
  da_hoc: boolean;
}

function loadRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentSearches(searches: string[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(searches.slice(0, 5)));
}

const LEVEL_COLORS: Record<string, string> = {
  "CƠ BẢN": "bg-[#e0f2fe] text-[#0284c7]",
  "TRUNG CẤP": "bg-[#ffedd5] text-[#c2410c]",
  "NÂNG CAO": "bg-[#dcfce7] text-[#16a34a]",
};

// Map color name → tailwind classes for icon container
const COLOR_MAP: Record<string, string> = {
  orange: "bg-orange-100 text-orange-500",
  blue: "bg-blue-100 text-blue-500",
  green: "bg-green-100 text-green-500",
  purple: "bg-purple-100 text-purple-500",
  indigo: "bg-indigo-100 text-indigo-500",
};

function LessonRow({ lesson, onNavigate }: { lesson: Lesson; onNavigate: () => void }) {
  const IconComponent = (LucideIcons as any)[lesson.ten_icon || ""] || Coffee;
  const iconColorClass = COLOR_MAP[lesson.mau_the_hien_thi] || "bg-green-100 text-green-500";
  const levelClass = LEVEL_COLORS[lesson.do_kho] || "bg-gray-100 text-gray-500";

  return (
    <div className="flex items-center justify-between p-3 border border-gray-100 dark:border-slate-700 rounded-2xl hover:border-gray-200 dark:hover:border-slate-600 hover:shadow-sm transition-all bg-white dark:bg-slate-800 group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconColorClass} dark:opacity-90`}>
          <IconComponent size={22} />
        </div>

        {/* Details */}
        <div className="flex flex-col min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white text-[14px] truncate">{lesson.tieu_de}</h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${levelClass} dark:contrast-125`}>
              {lesson.do_kho}
            </span>
            {lesson.da_hoc && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3" />
                Đã học
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 dark:text-gray-500">
              <Clock className="w-3 h-3" />
              {lesson.thoi_luong_phut} phút
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onNavigate}
        className="ml-3 px-4 py-1.5 bg-[#84cc16] hover:bg-[#65a30d] text-white text-xs font-bold rounded-full transition-colors shrink-0 shadow-sm"
      >
        Học ngay
      </button>
    </div>
  );
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecentSearches);
  const [suggestions, setSuggestions] = useState<Lesson[]>([]);
  const [results, setResults] = useState<Lesson[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load suggested lessons on first focus
  useEffect(() => {
    if (!isFocused || suggestions.length > 0) return;
    api.get("/api/lessons/suggested", { params: { limit: 3 } })
      .then(res => setSuggestions(res.data))
      .catch(() => setSuggestions([]));
  }, [isFocused]);

  // Debounced search
  const searchLessons = useCallback((term: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!term.trim()) { setResults([]); setTotalResults(0); return; }

    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/lessons/list", {
          params: { searchTerm: term.trim(), limit: 3, page: 1, status: "all" },
        });
        setResults(res.data);
        // If the API returns a `total` field, use it; otherwise count results
        setTotalResults(res.data.length);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, []);

  useEffect(() => {
    searchLessons(query);
  }, [query, searchLessons]);

  const handleClearRecent = (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const next = prev.filter(s => s !== item);
      saveRecentSearches(next);
      return next;
    });
  };

  const pickRecent = (term: string) => {
    setQuery(term);
  };

  const handleNavigate = (lesson: Lesson) => {
    setIsFocused(false);
    // Save to recent searches
    setRecentSearches(prev => {
      const next = [lesson.tieu_de, ...prev.filter(s => s !== lesson.tieu_de)];
      saveRecentSearches(next);
      return next;
    });
    navigate(`/speaking-practice/${lesson.ma_bai_hoc}`);
  };

  const isSearching = query.trim().length > 0;
  const showDropdown = isFocused;

  return (
    <div className="hidden md:block w-[450px] relative shrink-0" ref={containerRef}>

      {/* Search Input */}
      <div
        className={`relative flex items-center w-full rounded-3xl transition-all duration-200 z-50 ${isFocused
            ? "bg-white dark:bg-slate-800 border-[2px] border-green-500 shadow-md"
            : "bg-green-50/80 dark:bg-slate-800/50 border border-green-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-500"
          }`}
      >
        <Search className={`absolute left-4 w-4 h-4 transition-colors ${isSearching ? "text-green-600" : "text-green-500"}`} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Tìm kiếm bài học..."
          className="w-full py-2.5 pl-11 pr-10 bg-transparent border-none outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 font-medium text-sm"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 p-1 bg-green-100 dark:bg-green-900/40 rounded-full hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
          >
            <X className="w-4 h-4 text-[#84cc16]" strokeWidth={3} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-0 left-0 right-0 pt-[52px] bg-white dark:bg-slate-900 rounded-3xl shadow-[0_12px_48px_-8px_rgba(0,0,0,0.14)] border border-gray-100 dark:border-slate-800 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[68vh] overflow-y-auto px-5 py-4 flex flex-col gap-5">

            {/* === STATE 1: Empty query === */}
            {!isSearching ? (
              <>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-2">Tìm kiếm gần đây</h4>
                    <ul className="space-y-0.5">
                      {recentSearches.map((s, i) => (
                        <li key={i} className="flex items-center justify-between group">
                          <button
                            className="flex items-center gap-2.5 py-2 text-gray-600 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white text-sm flex-1 text-left"
                            onClick={() => pickRecent(s)}
                          >
                            <History className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 shrink-0" />
                            {s}
                          </button>
                          <button
                            onClick={e => handleClearRecent(s, e)}
                            className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 rounded-lg"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested Lessons */}
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-2">Gợi ý bài học</h4>
                  {suggestions.length === 0 ? (
                    <div className="py-4 flex justify-center">
                      <Loader2 className="animate-spin text-[#84cc16] w-5 h-5" />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {suggestions.map(lesson => (
                        <LessonRow
                          key={lesson.ma_bai_hoc}
                          lesson={lesson}
                          onNavigate={() => handleNavigate(lesson)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-50 dark:border-slate-800 pt-3 flex justify-center">
                  <button
                    onClick={() => navigate("/lessons")}
                    className="text-sm font-bold text-[#84cc16] hover:text-[#65a30d] transition-colors flex items-center gap-1"
                  >
                    Xem tất cả bài học <span className="text-base">→</span>
                  </button>
                </div>
              </>
            ) : (
              /* === STATE 2: Has query === */
              <>
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-[#84cc16] tracking-wider uppercase">
                    Kết quả cho "{query}"
                  </h4>
                  {!loading && (
                    <span className="text-[11px] font-bold text-gray-400 uppercase">
                      {totalResults} bài học tìm thấy
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="py-4 flex justify-center">
                    <Loader2 className="animate-spin text-[#84cc16] w-5 h-5" />
                  </div>
                ) : results.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {results.map(lesson => (
                      <LessonRow
                        key={lesson.ma_bai_hoc}
                        lesson={lesson}
                        onNavigate={() => handleNavigate(lesson)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Không tìm thấy bài học nào.</p>
                )}

                <div className="border-t border-gray-50 dark:border-slate-800 pt-3 flex justify-center">
                  <button
                    onClick={() => navigate("/lessons")}
                    className="text-sm font-bold text-[#84cc16] hover:text-[#65a30d] transition-colors uppercase tracking-wide"
                  >
                    Xem tất cả bài học liên quan
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
