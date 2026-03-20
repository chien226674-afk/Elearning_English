import { Outlet } from "react-router-dom"
import Header from "@/components/layout/Header"
import { Toaster } from "@/components/ui/sonner"

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Toaster position="top-right" richColors />
    </div>
  )
}
