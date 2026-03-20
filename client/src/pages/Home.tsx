import HomeDashboard from "@/components/home/HomeDashboard";
import Sidebar from "@/components/layout/Sidebar";

export default function Home() {
  return (
    <div className="flex w-full" style={{ minHeight: "calc(100vh - 65px)" }}>
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <HomeDashboard />
      </div>
    </div>
  )
}
