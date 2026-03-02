import { Outlet } from "react-router-dom"
import Header from "@/components/layout/Header"

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#2B2B2B]">
      <Header/>

      <main className="p-4">
        <Outlet />
      </main>
    </div>
  )
}
