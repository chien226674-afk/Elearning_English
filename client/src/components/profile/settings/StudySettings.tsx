import { useState, useEffect } from "react";
import { GraduationCap, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import api from "../../../lib/axios";

export default function StudySettings() {

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const defaultSettings = {
    feedbackMode: "friendly",
    accent: "US",
    audioSpeed: 1,
  };

  const [settings, setSettings] = useState(defaultSettings);

  const loadSettings = async () => {
    try {
      const response = await api.get("/api/users/settings");
      if (response.data) {
        setSettings({
          feedbackMode: response.data.feedbackMode || "friendly",
          accent: response.data.accent || "US",
          audioSpeed: response.data.audioSpeed || 1,
        });
      }
    } catch (error) {
      console.error("Lỗi khi tải cài đặt:", error);
    }
  };

  useEffect(() => {
    if (open && !loaded) {
      loadSettings().then(() => setLoaded(true));
    }
  }, [open, loaded]);

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put("/api/users/settings", settings);
      toast.success("Đã lưu cài đặt!");
      await loadSettings();
    } catch (error) {
      console.error("Lỗi khi lưu cài đặt:", error);
      toast.error("Có lỗi xảy ra khi lưu cài đặt.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div>
      {/* Main item */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-4">
          <GraduationCap className="text-gray-500" size={20} />
          <span>Cài đặt học tập</span>
        </div>

        <ChevronRight
          size={18}
          className={`text-gray-400 transition-transform ${open ? "rotate-90" : ""
            }`}
        />
      </div>

      {open && (
        <div className="ml-10 border-l space-y-5 p-4">

          {/* AI Feedback */}
          <div>
            <div className="text-sm font-medium mb-2">Chế độ AI feedback</div>

            <select
              value={settings.feedbackMode}
              onChange={(e) =>
                handleChange("feedbackMode", e.target.value)
              }
              className="border dark:border-slate-600 rounded-md p-2 w-full dark:bg-slate-700 dark:text-white"
            >
              <option value="none">🔇 Không phản hồi</option>
              <option value="friendly">😊 Thân thiện và lịch sự</option>
              <option value="playful">😜 Táo bạo và tinh nghịch</option>
              <option value="strict">⚖️ Gay gắt nhưng công bằng</option>
            </select>
          </div>

          {/* Accent */}
          <div>
            <div className="text-sm font-medium mb-2">Accent</div>

            <select
              value={settings.accent}
              onChange={(e) =>
                handleChange("accent", e.target.value)
              }
              className="border dark:border-slate-600 rounded-md p-2 w-full dark:bg-slate-700 dark:text-white"
            >
              <option value="US">US</option>
              <option value="UK">UK</option>
            </select>
          </div>

          {/* Audio Speed */}
          <div>
            <div className="text-sm font-medium mb-2">
              Tốc độ audio: {settings.audioSpeed}x
            </div>

            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={settings.audioSpeed}
              onChange={(e) =>
                handleChange("audioSpeed", parseFloat(e.target.value))
              }
              className="w-full"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className={`px-4 py-2 text-white rounded-md ${loading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>

          </div>

        </div>
      )}
    </div>
  );
}