import { createBrowserRouter } from "react-router-dom"
import MainLayout from "@/layouts/MainLayout"
import Index from "@/pages/Index"
import Login from "@/pages/Login"
import NotFound from "@/pages/NotFound"
import ProfilePage from "@/pages/Profile"
import Register from "@/pages/Register"
import ForgotPassword from "@/pages/ForgotPassword"
import ResetPassword from "@/pages/ResetPassword"
import VerifyEmail from "@/pages/VerifyEmail"
import LessonLibrary from "@/pages/LessonLibrary"
import ProgressPage from "@/pages/Progress"
import SpeakingPracticePage from "@/pages/SpeakingPractice"
import LandingPage from "@/pages/LandingPage"
import PracticeModeSelection from "@/pages/PracticeModeSelection"
import ProtectedRoute from "@/components/layout/ProtectedRoute"
import WrongWordPractice from "@/pages/WrongWordPractice"
import TimeSpeakingPracticePage from "@/pages/TimeSpeakingPractice"
import AiConversationPractice from "@/pages/AiConversationPractice"
import AdminRoute from "@/components/layout/AdminRoute"
import AdminLayout from "@/layouts/AdminLayout"
import AdminDashboard from "@/pages/admin/AdminDashboard"
import CategoryManagement from "@/pages/admin/CategoryManagement"
import LessonManagement from "@/pages/admin/LessonManagement"
import AchievementManagement from "@/pages/admin/AchievementManagement"

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      {
        path: "/",
        element: <Index />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "forgot-password",
        element: <ForgotPassword />,
      },
      {
        path: "reset-password",
        element: <ResetPassword />,
      },
      {
        path: "verify-email",
        element: <VerifyEmail />,
      },
      {
        element: <ProtectedRoute />, // Wrap protected routes
        children: [
          {
            path: "/profile",
            element: <ProfilePage />,
          },
          {
            path: "lessons",
            element: <LessonLibrary />,
          },
          {
            path: "progress",
            element: <ProgressPage />,
          },
          {
            path: "speaking-practice/:id",
            element: <SpeakingPracticePage />,
          },
          {
            path: "time-speaking",
            element: <TimeSpeakingPracticePage />,
          },
          {
            path: "practice",
            element: <PracticeModeSelection />,
          },
          {
            path: "practice/ai",
            element: <AiConversationPractice />,
          },
          {
            path: "practice/wrong-word/:word",
            element: <WrongWordPractice />,
          }
        ]
      },
      {
        path: "/",
        element: <LandingPage />
      }
    ],
  },
  {
    path: "/admin",
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <AdminDashboard />
          },
          {
            path: "categories",
            element: <CategoryManagement />
          },
          {
            path: "lessons",
            element: <LessonManagement />
          },
          {
            path: "achievements",
            element: <AchievementManagement />
          }
        ]
      }
    ]
  },
  {
    path: "*",
    element: <NotFound />,
  },
])

export default router
