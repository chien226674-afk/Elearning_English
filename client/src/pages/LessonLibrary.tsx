import { useState, useEffect } from "react";
import LessonCard from "../components/lesson/LessonCard";
import api from "@/lib/axios";
import { Loader2, BookOpen, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";

interface Category {
  ma_danh_muc: string;
  ten_danh_muc: string;
}

interface LessonData {
  ma_bai_hoc: string;
  tieu_de: string;
  mo_ta: string;
  thoi_luong_phut: number;
  do_kho: string;
  mau_the_hien_thi: string;
  ten_icon: string;
  da_hoc: boolean;
}

export default function LessonLibrary() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'completed', or categoryId
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchLessons(1, true);
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      setCategoryLoading(true);
      const res = await api.get("/api/lessons");
      setCategories(res.data);
    } catch (err) {
      console.error("Lỗi lấy danh mục:", err);
    } finally {
      setCategoryLoading(false);
    }
  };

  const fetchLessons = async (pageNum: number, isInitial: boolean = false) => {
    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      let url = "/api/lessons/list";
      const params: any = {
        page: pageNum,
        limit: 8
      };

      if (activeTab === "all") {
        params.status = "unlearned";
      } else if (activeTab === "completed") {
        params.status = "completed";
      } else {
        params.categoryId = activeTab;
      }

      const res = await api.get(url, { params });

      if (isInitial) {
        setLessons(res.data);
      } else {
        setLessons(prev => [...prev, ...res.data]);
      }

      setHasMore(res.data.length === 8);
    } catch (err) {
      console.error("Lỗi lấy bài học:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLessons(nextPage);
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    const container = document.getElementById('category-scroll');
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-white dark:bg-slate-900">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold tracking-wider uppercase">
            <BookOpen size={12} />
            Học tập mỗi ngày
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Thư Viện Bài Học
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed">
            Chọn một chủ đề thú vị và bắt đầu hành trình chinh phục tiếng Anh của bạn ngay hôm nay.
            Mọi nỗ lực nhỏ đều dẫn đến kết quả lớn!
          </p>
        </div>

        <div className="relative group overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-3xl border border-green-100/50 w-full md:w-80 shadow-sm transition-all hover:shadow-md">
          <div className="relative z-10">
            <p className="font-bold text-green-800 text-base leading-snug">
              "Luyện tập một chút mỗi ngày để tiến bộ nhanh hơn!"
            </p>
            <p className="text-green-600/80 mt-2 text-sm font-medium">
              Thử hoàn thành một bài học 5 phút hôm nay.
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-green-200/20 rounded-full blur-2xl group-hover:bg-green-300/30 transition-colors" />
        </div>
      </div>

      {/* Tabs / Categories Filter */}
      <div className="relative mb-10 group">
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollCategories('left')}
            className="p-2 rounded-full border border-gray-100 bg-white shadow-sm hover:bg-gray-50 transition opacity-0 group-hover:opacity-100 z-10 hidden sm:block"
          >
            <ChevronLeft size={16} />
          </button>

          <div
            id="category-scroll"
            className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-2 flex-grow"
          >
            <button
              onClick={() => setActiveTab("all")}
              className={`px-6 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 shadow-sm ${activeTab === "all"
                ? "bg-green-500 text-white shadow-green-200 scale-105"
                : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                }`}
            >
              Tất cả bài học
            </button>

            <button
              onClick={() => setActiveTab("completed")}
              className={`px-6 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 shadow-sm flex items-center gap-2 ${activeTab === "completed"
                ? "bg-emerald-600 text-white shadow-emerald-200 scale-105"
                : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                }`}
            >
              <CheckCircle2 size={16} />
              Đã học
            </button>

            <div className="h-8 w-[1px] bg-gray-200 mx-2 self-center shrink-0" />

            {!categoryLoading && categories.map((cat) => (
              <button
                key={cat.ma_danh_muc}
                onClick={() => setActiveTab(cat.ma_danh_muc)}
                className={`px-6 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 shadow-sm ${activeTab === cat.ma_danh_muc
                  ? "bg-indigo-500 text-white shadow-indigo-200 scale-105"
                  : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                  }`}
              >
                {cat.ten_danh_muc}
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollCategories('right')}
            className="p-2 rounded-full border border-gray-100 bg-white shadow-sm hover:bg-gray-50 transition opacity-0 group-hover:opacity-100 z-10 hidden sm:block"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Lesson Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
          <Loader2 className="animate-spin text-green-500 mb-4" size={40} />
          <p className="text-gray-500 font-medium">Đang tải kiến thức cho bạn...</p>
        </div>
      ) : lessons.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {lessons.map((lesson: LessonData) => (
            <div key={lesson.ma_bai_hoc} className="animate-in zoom-in-95 fade-in duration-500 fill-mode-both">
              <LessonCard lesson={{
                id: lesson.ma_bai_hoc,
                title: lesson.tieu_de,
                desc: lesson.mo_ta,
                time: `${lesson.thoi_luong_phut} phút`,
                level: lesson.do_kho,
                color: lesson.mau_the_hien_thi,
                iconName: lesson.ten_icon,
                isCompleted: lesson.da_hoc
              }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="text-gray-300" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Chưa có bài học nào</h3>
          <p className="text-gray-500 max-w-sm">
            Hiện tại không có bài học nào trong mục này. Vui lòng quay lại sau hoặc chọn danh mục khác.
          </p>
        </div>
      )}

      {/* Load More */}
      {!loading && hasMore && (
        <div className="flex justify-center mt-16 pb-10">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="group px-10 py-3.5 rounded-full font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 hover:border-green-500 hover:text-green-600 transition-all duration-300 shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {loadingMore ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                Xem thêm nhiều bài học thú vị
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
