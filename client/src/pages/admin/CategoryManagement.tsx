import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { Plus, Edit2, Trash2, Loader2, Save, X } from "lucide-react";

export default function CategoryManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ten_danh_muc: "", mo_ta: "" });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/categories");
      setCategories(res.data);
    } catch (error) {
      console.error("Lỗi khi tải danh mục", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSave = async () => {
    if (!formData.ten_danh_muc.trim()) return alert("Tên danh mục không được để trống");
    try {
      if (editingId) {
        await api.put(`/api/admin/categories/${editingId}`, formData);
      } else {
        await api.post("/api/admin/categories", formData);
      }
      setEditingId(null);
      setIsAdding(false);
      setFormData({ ten_danh_muc: "", mo_ta: "" });
      fetchCategories();
    } catch (error) {
      console.error("Lỗi khi lưu danh mục", error);
      alert("Lỗi khi lưu danh mục");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này? Hệ thống có thể chuyển các bài học liên quan về trạng thái không thuộc danh mục nào. Tiếp tục?")) return;
    try {
      await api.delete(`/api/admin/categories/${id}`);
      fetchCategories();
    } catch (error) {
      console.error("Lỗi khi xóa", error);
      alert("Lỗi khi xóa danh mục");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý danh mục</h1>
          <p className="text-gray-500 text-sm mt-1">Thêm, sửa, xóa các danh mục bài học</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            setEditingId(null);
            setFormData({ ten_danh_muc: "", mo_ta: "" });
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Thêm danh mục
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-500">Tên danh mục</th>
              <th className="px-6 py-4 font-medium text-gray-500">Mô tả</th>
              <th className="px-6 py-4 font-medium text-gray-500 w-32">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isAdding && (
              <tr className="bg-green-50/50">
                <td className="px-6 py-4">
                  <input
                    autoFocus
                    value={formData.ten_danh_muc}
                    onChange={(e) => setFormData({ ...formData, ten_danh_muc: e.target.value })}
                    className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Nhập tên..."
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    value={formData.mo_ta}
                    onChange={(e) => setFormData({ ...formData, mo_ta: e.target.value })}
                    className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Nhập mô tả..."
                  />
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={handleSave} className="p-2 text-green-600 bg-green-100 rounded hover:bg-green-200" title="Lưu">
                    <Save size={18} />
                  </button>
                  <button onClick={() => setIsAdding(false)} className="p-2 text-red-600 bg-red-100 rounded hover:bg-red-200" title="Hủy">
                    <X size={18} />
                  </button>
                </td>
              </tr>
            )}

            {loading && !isAdding && (
              <tr>
                <td colSpan={3} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-green-500 mx-auto" />
                </td>
              </tr>
            )}

            {!loading && categories.length === 0 && !isAdding && (
              <tr>
                <td colSpan={3} className="text-center py-8 text-gray-500">
                  Chưa có danh mục nào. Hãy thêm danh mục đầu tiên!
                </td>
              </tr>
            )}

            {!loading && categories.map((cat) => (
              <tr key={cat.ma_danh_muc} className="hover:bg-gray-50 transition-colors">
                {editingId === cat.ma_danh_muc ? (
                  <>
                    <td className="px-6 py-4">
                      <input
                        autoFocus
                        value={formData.ten_danh_muc}
                        onChange={(e) => setFormData({ ...formData, ten_danh_muc: e.target.value })}
                        className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        value={formData.mo_ta}
                        onChange={(e) => setFormData({ ...formData, mo_ta: e.target.value })}
                        className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={handleSave} className="p-2 text-green-600 bg-green-100 rounded hover:bg-green-200" title="Lưu">
                        <Save size={18} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200" title="Hủy">
                        <X size={18} />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 font-medium text-gray-900">{cat.ten_danh_muc}</td>
                    <td className="px-6 py-4 text-gray-500">{cat.mo_ta || "-"}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(cat.ma_danh_muc);
                          setFormData({ ten_danh_muc: cat.ten_danh_muc, mo_ta: cat.mo_ta || "" });
                        }}
                        className="p-2 text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                        title="Sửa"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.ma_danh_muc)}
                        className="p-2 text-red-600 bg-red-50 rounded hover:bg-red-100"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
