// import { useState } from 'react'
// import {Button} from "@/components/ui/button"
import './App.css'
import { RouterProvider } from "react-router-dom"
import router from "./router"

function App() {
  

  return (
    // <div className="flex flex-col items-center justify-center min-h-svh">
    // <Button>Click Me</Button>
    // </div>
    <>
    <RouterProvider router={router} />
    </>
  )
}

export default App
