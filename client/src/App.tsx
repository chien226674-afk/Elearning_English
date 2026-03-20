// import { useState } from 'react'
// import {Button} from "@/components/ui/button"
import './App.css'
import { RouterProvider } from "react-router-dom"
import router from "./router"
import { ThemeProvider } from "next-themes"

function App() {


  return (
    // <div className="flex flex-col items-center justify-center min-h-svh">
    // <Button>Click Me</Button>
    // </div>
    <ThemeProvider attribute="class" defaultTheme="light" storageKey="vite-ui-theme" enableSystem={false}>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default App
