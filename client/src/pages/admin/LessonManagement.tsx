import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { Plus, Edit2, Trash2, ArrowLeft, Loader2, Save, X, BookOpen, MessageSquare, BookA } from "lucide-react";

export default function LessonManagement() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States cho danh sách bài học
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonFormData, setLessonFormData] = useState<any>({
    tieu_de: "", mo_ta: "", ma_danh_muc: "", thoi_luong_phut: 10, do_kho: "CƠ BẢN", trang_thai_hoat_dong: true
  });

  // State cho Chi tiết bài học
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // States cho Từ vựng / Câu
  const [vocabFormData, setVocabFormData] = useState({ tu_tieng_anh: "", nghia_tieng_viet: "", thu_tu_hien_thi: 1 });
  const [sentenceFormData, setSentenceFormData] = useState({ cau_tieng_anh: "", cau_tieng_viet: "", thu_tu_hien_thi: 1 });
  const [editingVocabId, setEditingVocabId] = useState(null);
  const [editingSentenceId, setEditingSentenceId] = useState(null);
  const [isAddingVocab, setIsAddingVocab] = useState(false);
  const [isAddingSentence, setIsAddingSentence] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lessonRes, catRes] = await Promise.all([
        api.get("/api/admin/lessons"),
        api.get("/api/admin/categories")
      ]);
      setLessons(lessonRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchLessonDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      const res = await api.get(`/api/admin/lessons/${id}`);
      setSelectedLesson(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setDetailLoading(false);
    }
  };

  // --- LESSON CRUD ---
  const saveLesson = async () => {
    if (!lessonFormData.tieu_de.trim()) return alert("Tiêu đề là bắt buộc");
    try {
      const data = { ...lessonFormData, ma_danh_muc: lessonFormData.ma_danh_muc || null };
      if (editingLessonId) {
        await api.put(`/api/admin/lessons/${editingLessonId}`, data);
      } else {
        await api.post("/api/admin/lessons", data);
      }
      setEditingLessonId(null);
      setIsAddingLesson(false);
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Lỗi khi lưu bài học");
    }
  };

  const deleteLesson = async (id: string) => {
    if (!confirm("Xóa bài học sẽ xóa toàn bộ từ vựng và câu bên trong. Tiếp tục?")) return;
    try {
      await api.delete(`/api/admin/lessons/${id}`);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  // --- VOCAB CRUD ---
  const saveVocab = async () => {
    try {
      if (editingVocabId) {
        await api.put(`/api/admin/lessons/vocab/${editingVocabId}`, vocabFormData);
      } else {
        await api.post(`/api/admin/lessons/${selectedLesson.ma_bai_hoc}/vocab`, vocabFormData);
      }
      setEditingVocabId(null);
      setIsAddingVocab(false);
      fetchLessonDetail(selectedLesson.ma_bai_hoc); // refresh
    } catch (error) {
      console.error(error);
      alert("Lỗi khi lưu từ vựng");
    }
  };

  const deleteVocab = async (id: string) => {
    if (!confirm("Xóa từ vựng này?")) return;
    try {
      await api.delete(`/api/admin/lessons/vocab/${id}`);
      fetchLessonDetail(selectedLesson.ma_bai_hoc);
    } catch (error) {
      console.error(error);
    }
  };

  // --- SENTENCE CRUD ---
  const saveSentence = async () => {
    try {
      if (editingSentenceId) {
        await api.put(`/api/admin/lessons/sentences/${editingSentenceId}`, sentenceFormData);
      } else {
        await api.post(`/api/admin/lessons/${selectedLesson.ma_bai_hoc}/sentences`, sentenceFormData);
      }
      setEditingSentenceId(null);
      setIsAddingSentence(false);
      fetchLessonDetail(selectedLesson.ma_bai_hoc); // refresh
    } catch (error) {
      console.error(error);
      alert("Lỗi khi lưu câu");
    }
  };

  const deleteSentence = async (id: string) => {
    if (!confirm("Xóa câu này?")) return;
    try {
      await api.delete(`/api/admin/lessons/sentences/${id}`);
      fetchLessonDetail(selectedLesson.ma_bai_hoc);
    } catch (error) {
      console.error(error);
    }
  };


  if (loading) {
    return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;
  }

  // === RENDER CHI TIẾT BÀI HỌC ===
  if (selectedLesson) {
    return (
      <div className="space-y-6">
        {/* Header Chi tiết */}
        <div className="flex items-center gap-4 bg-white p-6 rounded-lg shadow-sm">
          <button onClick={() => { setSelectedLesson(null); fetchData(); }} className="text-gray-500 hover:text-green-600 bg-gray-50 p-2 rounded-full">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedLesson.tieu_de}</h1>
            <p className="text-gray-500 text-sm mt-1">{selectedLesson.mo_ta || "Không có mô tả"}</p>
          </div>
        </div>

        {detailLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-green-500" /></div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* CỘT TỪ VỰNG */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2"><BookA className="text-blue-500" /> Từ vựng ({selectedLesson.vocabularies?.length || 0})</h2>
                <button
                  onClick={() => { setIsAddingVocab(true); setEditingVocabId(null); setVocabFormData({ tu_tieng_anh: "", nghia_tieng_viet: "", thu_tu_hien_thi: (selectedLesson.vocabularies?.length || 0) + 1 }); }}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded text-sm flex items-center gap-1"
                ><Plus size={16} /> Thêm</button>
              </div>

              <div className="space-y-3">
                {isAddingVocab && (
                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg flex flex-col gap-2">
                    <input autoFocus value={vocabFormData.tu_tieng_anh} onChange={e => setVocabFormData({...vocabFormData, tu_tieng_anh: e.target.value})} placeholder="Từ tiếng anh..." className="border p-2 rounded text-sm outline-none" />
                    <input value={vocabFormData.nghia_tieng_viet} onChange={e => setVocabFormData({...vocabFormData, nghia_tieng_viet: e.target.value})} placeholder="Nghĩa tiếng việt..." className="border p-2 rounded text-sm outline-none" />
                    <input type="number" value={vocabFormData.thu_tu_hien_thi} onChange={e => setVocabFormData({...vocabFormData, thu_tu_hien_thi: Number(e.target.value)})} placeholder="Thứ tự..." className="border p-2 rounded text-sm outline-none w-24" />
                    <div className="flex gap-2 justify-end">
                      <button onClick={saveVocab} className="text-green-600 px-2 flex items-center gap-1"><Save size={16}/> Lưu</button>
                      <button onClick={() => setIsAddingVocab(false)} className="text-red-500 px-2 flex items-center gap-1"><X size={16}/> Hủy</button>
                    </div>
                  </div>
                )}

                {selectedLesson.vocabularies?.map((voc: any) => (
                  <div key={voc.id} className="p-3 border rounded-lg flex justify-between items-center bg-gray-50 hover:bg-white transition-colors">
                    {editingVocabId === voc.id ? (
                      <div className="flex flex-col gap-2 w-full pr-4">
                         <input autoFocus value={vocabFormData.tu_tieng_anh} onChange={e => setVocabFormData({...vocabFormData, tu_tieng_anh: e.target.value})} className="border p-1.5 rounded text-sm" />
                         <input value={vocabFormData.nghia_tieng_viet} onChange={e => setVocabFormData({...vocabFormData, nghia_tieng_viet: e.target.value})} className="border p-1.5 rounded text-sm" />
                         <input type="number" value={vocabFormData.thu_tu_hien_thi} onChange={e => setVocabFormData({...vocabFormData, thu_tu_hien_thi: Number(e.target.value)})} className="border p-1.5 rounded text-sm w-20" />
                      </div>
                    ) : (
                      <div>
                        <div className="font-bold text-blue-600">{voc.english}</div>
                        <div className="text-sm text-gray-600">{voc.vietnamese}</div>
                        <div className="text-xs text-gray-400">Thứ tự: {voc.order}</div>
                      </div>
                    )}
                    
                    {editingVocabId === voc.id ? (
                      <div className="flex flex-col gap-2">
                        <button onClick={saveVocab} className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded" title="Lưu"><Save size={16}/></button>
                        <button onClick={() => setEditingVocabId(null)} className="p-1.5 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded" title="Hủy"><X size={16}/></button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                         <button onClick={() => {setEditingVocabId(voc.id); setVocabFormData({ tu_tieng_anh: voc.english, nghia_tieng_viet: voc.vietnamese, thu_tu_hien_thi: voc.order });}} className="p-1.5 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded"><Edit2 size={16}/></button>
                         <button onClick={() => deleteVocab(voc.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded"><Trash2 size={16}/></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* CỘT CÂU */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2"><MessageSquare className="text-purple-500" /> Bài tập câu ({selectedLesson.sentences?.length || 0})</h2>
                <button
                  onClick={() => { setIsAddingSentence(true); setEditingSentenceId(null); setSentenceFormData({ cau_tieng_anh: "", cau_tieng_viet: "", thu_tu_hien_thi: (selectedLesson.sentences?.length || 0) + 1 }); }}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-600 px-3 py-1.5 rounded text-sm flex items-center gap-1"
                ><Plus size={16} /> Thêm</button>
              </div>

              <div className="space-y-3">
                {isAddingSentence && (
                  <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-lg flex flex-col gap-2">
                    <textarea autoFocus value={sentenceFormData.cau_tieng_anh} onChange={e => setSentenceFormData({...sentenceFormData, cau_tieng_anh: e.target.value})} placeholder="Câu tiếng anh..." className="border p-2 rounded text-sm outline-none resize-none" rows={2}/>
                    <textarea value={sentenceFormData.cau_tieng_viet} onChange={e => setSentenceFormData({...sentenceFormData, cau_tieng_viet: e.target.value})} placeholder="Nghĩa tiếng việt..." className="border p-2 rounded text-sm outline-none resize-none" rows={2}/>
                    <input type="number" value={sentenceFormData.thu_tu_hien_thi} onChange={e => setSentenceFormData({...sentenceFormData, thu_tu_hien_thi: Number(e.target.value)})} placeholder="Thứ tự..." className="border p-2 rounded text-sm outline-none w-24" />
                    <div className="flex gap-2 justify-end">
                      <button onClick={saveSentence} className="text-green-600 px-2 flex items-center gap-1"><Save size={16}/> Lưu</button>
                      <button onClick={() => setIsAddingSentence(false)} className="text-red-500 px-2 flex items-center gap-1"><X size={16}/> Hủy</button>
                    </div>
                  </div>
                )}

                {selectedLesson.sentences?.map((sen: any) => (
                  <div key={sen.id} className="p-3 border rounded-lg flex justify-between items-center bg-gray-50 hover:bg-white transition-colors">
                    {editingSentenceId === sen.id ? (
                      <div className="flex flex-col gap-2 w-full pr-4">
                         <textarea autoFocus value={sentenceFormData.cau_tieng_anh} onChange={e => setSentenceFormData({...sentenceFormData, cau_tieng_anh: e.target.value})} className="border p-1.5 rounded text-sm resize-none" rows={2} />
                         <textarea value={sentenceFormData.cau_tieng_viet} onChange={e => setSentenceFormData({...sentenceFormData, cau_tieng_viet: e.target.value})} className="border p-1.5 rounded text-sm resize-none" rows={2}/>
                         <input type="number" value={sentenceFormData.thu_tu_hien_thi} onChange={e => setSentenceFormData({...sentenceFormData, thu_tu_hien_thi: Number(e.target.value)})} className="border p-1.5 rounded text-sm w-20" />
                      </div>
                    ) : (
                      <div>
                        <div className="font-bold text-purple-600">{sen.english}</div>
                        <div className="text-sm text-gray-600">{sen.vietnamese}</div>
                        <div className="text-xs text-gray-400">Thứ tự: {sen.order}</div>
                      </div>
                    )}
                    
                    {editingSentenceId === sen.id ? (
                      <div className="flex flex-col gap-2">
                        <button onClick={saveSentence} className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded" title="Lưu"><Save size={16}/></button>
                        <button onClick={() => setEditingSentenceId(null)} className="p-1.5 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded" title="Hủy"><X size={16}/></button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                         <button onClick={() => {setEditingSentenceId(sen.id); setSentenceFormData({ cau_tieng_anh: sen.english, cau_tieng_viet: sen.vietnamese, thu_tu_hien_thi: sen.order });}} className="p-1.5 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded"><Edit2 size={16}/></button>
                         <button onClick={() => deleteSentence(sen.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded"><Trash2 size={16}/></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    );
  }

  // === RENDER DANH SÁCH BÀI HỌC ===
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý bài học</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý các bài học luyện nói tiếng Anh</p>
        </div>
        <button
          onClick={() => {
            setIsAddingLesson(true);
            setEditingLessonId(null);
            setLessonFormData({ tieu_de: "", mo_ta: "", ma_danh_muc: "", thoi_luong_phut: 10, do_kho: "CƠ BẢN", trang_thai_hoat_dong: true });
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Tạo bài học
        </button>
      </div>

      {isAddingLesson || editingLessonId ? (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-bold mb-4">{editingLessonId ? "Sửa bài học" : "Thêm bài học mới"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
                <input value={lessonFormData.tieu_de} onChange={(e) => setLessonFormData({...lessonFormData, tieu_de: e.target.value})} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea rows={3} value={lessonFormData.mo_ta} onChange={(e) => setLessonFormData({...lessonFormData, mo_ta: e.target.value})} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Danh mục</label>
                <select value={lessonFormData.ma_danh_muc} onChange={(e) => setLessonFormData({...lessonFormData, ma_danh_muc: e.target.value})} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">-- Không phân loại --</option>
                  {categories.map(c => <option key={c.ma_danh_muc} value={c.ma_danh_muc}>{c.ten_danh_muc}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Thời lượng (phút)</label>
                <input type="number" value={lessonFormData.thoi_luong_phut} onChange={(e) => setLessonFormData({...lessonFormData, thoi_luong_phut: Number(e.target.value)})} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Độ khó</label>
                <select value={lessonFormData.do_kho} onChange={(e) => setLessonFormData({...lessonFormData, do_kho: e.target.value})} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-green-500">
                  <option value="CƠ BẢN">CƠ BẢN</option>
                  <option value="TRUNG CẤP">TRUNG CẤP</option>
                  <option value="NÂNG CAO">NÂNG CAO</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="active" checked={lessonFormData.trang_thai_hoat_dong} onChange={(e) => setLessonFormData({...lessonFormData, trang_thai_hoat_dong: e.target.checked})} className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" />
                <label htmlFor="active" className="text-sm font-medium">Hoạt động (Hiển thị cho người dùng)</label>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t pt-4">
            <button onClick={() => { setIsAddingLesson(false); setEditingLessonId(null); }} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50 font-medium">Hủy</button>
            <button onClick={saveLesson} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium flex items-center gap-2"><Save size={18} /> Lưu bài học</button>
          </div>
        </div>
      ) : null}

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-500">Tiêu đề</th>
              <th className="px-6 py-4 font-medium text-gray-500">Danh mục</th>
              <th className="px-6 py-4 font-medium text-gray-500 text-center">Nội dung</th>
              <th className="px-6 py-4 font-medium text-gray-500">Trạng thái</th>
              <th className="px-6 py-4 font-medium text-gray-500 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lessons.map((lesson) => (
              <tr key={lesson.ma_bai_hoc} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{lesson.tieu_de}</div>
                  <div className="text-xs text-gray-500">{lesson.thoi_luong_phut} phút • {lesson.do_kho}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {lesson.ten_danh_muc || "Không phân loại"}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1" title="Số từ vựng"><BookA size={14} /> {lesson.total_vocab}</span>
                    <span className="flex items-center gap-1" title="Số câu luyện"><MessageSquare size={14} /> {lesson.total_sentence}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {lesson.trang_thai_hoat_dong ? (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">Hoạt động</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold">Đã ẩn</span>
                  )}
                </td>
                <td className="px-6 py-4 flex justify-end gap-2">
                  <button
                    onClick={() => fetchLessonDetail(lesson.ma_bai_hoc)}
                    className="p-1.5 text-blue-600 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 text-sm font-medium flex items-center gap-1"
                  >
                    <BookOpen size={16} /> Nội dung
                  </button>
                  <button
                    onClick={() => {
                       setEditingLessonId(lesson.ma_bai_hoc);
                       setIsAddingLesson(false);
                       setLessonFormData({
                         tieu_de: lesson.tieu_de,
                         mo_ta: lesson.mo_ta || "",
                         ma_danh_muc: lesson.ma_danh_muc || "",
                         thoi_luong_phut: lesson.thoi_luong_phut,
                         do_kho: lesson.do_kho,
                         trang_thai_hoat_dong: lesson.trang_thai_hoat_dong
                       });
                       window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-1.5 text-yellow-600 bg-yellow-50 rounded hover:bg-yellow-100" title="Sửa thông tin"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteLesson(lesson.ma_bai_hoc)}
                    className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100" title="Xóa bài học"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {lessons.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  Chưa có bài học nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
