import { useEffect, useState } from "react"
import { Sun, Moon, Palette } from "lucide-react"
import Privacy from "./settings/Privacy"
import StudySettings from "./settings/StudySettings"

const STORAGE_KEY = "vite-ui-theme"

function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === "dark"
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add("dark")
      localStorage.setItem(STORAGE_KEY, "dark")
    } else {
      root.classList.remove("dark")
      localStorage.setItem(STORAGE_KEY, "light")
    }
  }, [isDark])

  const toggle = () => setIsDark((prev) => !prev)

  return { isDark, toggle }
}

export default function SettingsSection() {
  const { isDark, toggle } = useDarkMode()

  return (
    <div className="space-y-4">

      <h3 className="text-lg font-semibold dark:text-white">Cài đặt tài khoản</h3>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm divide-y dark:divide-slate-700">

        {/* Theme Toggle */}
        <div className="flex items-center justify-between p-5">

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
              <Palette className="text-purple-500" size={18} />
            </div>
            <div>
              <p className="font-medium text-sm dark:text-gray-100">Giao diện</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {isDark ? "Chế độ tối đang bật" : "Chế độ sáng đang bật"}
              </p>
            </div>
          </div>

          {/* Toggle Pill */}
          <button
            type="button"
            onClick={toggle}
            className={`relative flex items-center w-16 h-8 rounded-full p-1 transition-all duration-300 cursor-pointer focus:outline-none ${
              isDark ? "bg-indigo-600" : "bg-amber-200"
            }`}
            aria-label="Toggle dark mode"
          >
            {/* Sliding knob */}
            <span
              className={`absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${
                isDark ? "translate-x-8 bg-slate-900" : "translate-x-0 bg-white"
              }`}
            >
              {isDark
                ? <Moon size={13} className="text-indigo-300" />
                : <Sun size={13} className="text-amber-500" />
              }
            </span>

            {/* Track icons */}
            <span className={`ml-1 transition-opacity duration-200 ${isDark ? "opacity-50" : "opacity-0"}`}>
              <Sun size={10} className="text-white" />
            </span>
            <span className={`ml-auto mr-1 transition-opacity duration-200 ${isDark ? "opacity-0" : "opacity-50"}`}>
              <Moon size={10} className="text-gray-500" />
            </span>
          </button>

        </div>

        {/* Study Settings */}
        <StudySettings />

        {/* Privacy Settings */}
        <Privacy/>

      </div>

    </div>
  )
}