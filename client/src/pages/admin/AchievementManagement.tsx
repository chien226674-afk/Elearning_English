import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { Plus, Edit2, Trash2, Loader2, Save, X, Image as ImageIcon } from "lucide-react";

export default function AchievementManagement() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form Data
  const [formData, setFormData] = useState({
    ten_thanh_tuu: "", mo_ta: "", ten_icon: "", 
    phan_thuong_kn: 0, loai_dieu_kien: "", gia_tri: 0, existing_image_url: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/achievements");
      setAchievements(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const handleSave = async () => {
    if (!formData.ten_thanh_tuu.trim()) return alert("Tên thành tựu là bắt buộc");
    
    // Create FormData for multipart/form-data
    const data = new FormData();
    data.append("ten_thanh_tuu", formData.ten_thanh_tuu);
    data.append("mo_ta", formData.mo_ta || "");
    data.append("ten_icon", formData.ten_icon || "");
    data.append("phan_thuong_kn", String(formData.phan_thuong_kn));
    data.append("loai_dieu_kien", formData.loai_dieu_kien || "");
    data.append("gia_tri", String(formData.gia_tri));
    if (formData.existing_image_url) {
      data.append("existing_image_url", formData.existing_image_url);
    }
    if (imageFile) {
      data.append("image", imageFile);
    }

    try {
      if (editingId) {
        await api.put(`/api/admin/achievements/${editingId}`, data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        await api.post("/api/admin/achievements", data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }
      setEditingId(null);
      setIsAdding(false);
      setImageFile(null);
      setFormData({ ten_thanh_tuu: "", mo_ta: "", ten_icon: "", phan_thuong_kn: 0, loai_dieu_kien: "", gia_tri: 0, existing_image_url: "" });
      fetchAchievements();
    } catch (error) {
      console.error(error);
      alert("Lỗi khi lưu thành tựu");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa thành tựu này? Người dùng đã đạt sẽ mất hiển thị.")) return;
    try {
      await api.delete(`/api/admin/achievements/${id}`);
      fetchAchievements();
    } catch (error) {
      console.error(error);
      alert("Lỗi khi xóa");
    }
  };

  const renderFormRow = () => (
    <tr className="bg-orange-50/50">
      <td className="px-4 py-4" colSpan={4}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <input autoFocus value={formData.ten_thanh_tuu} onChange={e => setFormData({...formData, ten_thanh_tuu: e.target.value})} placeholder="Tên thành tựu *" className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
            <textarea value={formData.mo_ta} onChange={e => setFormData({...formData, mo_ta: e.target.value})} placeholder="Mô tả..." className="w-full border p-2 rounded text-sm resize-none focus:ring-2 focus:ring-orange-500 outline-none" rows={2} />
            <div className="flex gap-2">
              <input value={formData.ten_icon} onChange={e => setFormData({...formData, ten_icon: e.target.value})} placeholder="Tên icon (Lucide)" className="w-1/2 border p-2 rounded text-sm" />
              <input type="number" value={formData.phan_thuong_kn} onChange={e => setFormData({...formData, phan_thuong_kn: Number(e.target.value)})} placeholder="EXP thưởng" className="w-1/2 border p-2 rounded text-sm" />
            </div>
          </div>
          <div className="space-y-3">
            <select value={formData.loai_dieu_kien} onChange={e => setFormData({...formData, loai_dieu_kien: e.target.value})} className="w-full border p-2 rounded text-sm bg-white">
              <option value="">-- Loại điều kiện --</option>
              <option value="STREAK">Chuỗi ngày (Streak)</option>
              <option value="DIEM_CAO">Điểm số trung bình (Avg Score)</option>
              <option value="SO_BAI_HOC">Tổng bài học (Total Lessons)</option>
            </select>
            <input type="number" value={formData.gia_tri} onChange={e => setFormData({...formData, gia_tri: Number(e.target.value)})} placeholder="Giá trị điều kiện" className="w-full border p-2 rounded text-sm" />
            <div className="border p-2 rounded bg-white flex items-center gap-2">
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="text-sm w-full" />
              {formData.existing_image_url && !imageFile && <img src={formData.existing_image_url} alt="Current" className="h-8 w-8 rounded-full border object-cover" />}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 flex flex-col gap-2 justify-center h-full">
        <button onClick={handleSave} className="p-2 text-green-600 bg-green-100 rounded hover:bg-green-200 flex justify-center"><Save size={18} /></button>
        <button onClick={() => { setIsAdding(false); setEditingId(null); setImageFile(null); }} className="p-2 text-red-600 bg-red-100 rounded hover:bg-red-200 flex justify-center"><X size={18} /></button>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý thành tựu</h1>
          <p className="text-gray-500 text-sm mt-1">Cấu hình hệ thống huy hiệu và điều kiện đạt được</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true); setEditingId(null);
            setFormData({ ten_thanh_tuu: "", mo_ta: "", ten_icon: "", phan_thuong_kn: 0, loai_dieu_kien: "", gia_tri: 0, existing_image_url: "" });
            setImageFile(null);
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Thêm thành tựu
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500 w-16 text-center">Icon/Ảnh</th>
              <th className="px-4 py-3 font-medium text-gray-500">Thông tin chung</th>
              <th className="px-4 py-3 font-medium text-gray-500">Điều kiện đạt</th>
              <th className="px-4 py-3 font-medium text-gray-500">Thưởng EXP</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-24 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isAdding && renderFormRow()}

            {loading && !isAdding && (
              <tr><td colSpan={5} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" /></td></tr>
            )}

            {!loading && achievements.length === 0 && !isAdding && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">Chưa có thành tựu nào.</td></tr>
            )}

            {!loading && achievements.map((ach) => (
              editingId === ach.ma_thanh_tuu ? (
                renderFormRow()
              ) : (
                <tr key={ach.ma_thanh_tuu} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-center align-top">
                    <div className="w-12 h-12 rounded-full border bg-orange-50 flex items-center justify-center overflow-hidden mx-auto shadow-sm">
                      {ach.image_url ? (
                        <img src={ach.image_url} alt={ach.ten_thanh_tuu} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="text-orange-400 w-6 h-6" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="font-bold text-gray-900">{ach.ten_thanh_tuu}</div>
                    <div className="text-sm text-gray-500 mt-1">{ach.mo_ta || "Không có mô tả"}</div>
                    {ach.ten_icon && <div className="text-xs text-gray-400 mt-1">Icon: {ach.ten_icon}</div>}
                  </td>
                  <td className="px-4 py-4 align-top text-sm">
                    {ach.loai_dieu_kien ? (
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                        {ach.loai_dieu_kien}: <strong className="font-bold">{ach.gia_tri}</strong>
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Không có</span>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top font-bold text-green-600 text-lg text-center">
                    +{ach.phan_thuong_kn}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-col gap-2 items-center">
                      <button
                        onClick={() => {
                          setEditingId(ach.ma_thanh_tuu); setIsAdding(false); setImageFile(null);
                          setFormData({ 
                            ten_thanh_tuu: ach.ten_thanh_tuu, mo_ta: ach.mo_ta || "", 
                            ten_icon: ach.ten_icon || "", phan_thuong_kn: ach.phan_thuong_kn, 
                            loai_dieu_kien: ach.loai_dieu_kien || "", gia_tri: ach.gia_tri || 0, 
                            existing_image_url: ach.image_url || "" 
                          });
                        }}
                        className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded text-sm w-full flex justify-center" title="Sửa"
                      ><Edit2 size={16} /></button>
                      <button
                        onClick={() => handleDelete(ach.ma_thanh_tuu)}
                        className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded text-sm w-full flex justify-center" title="Xóa"
                      ><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
